// Checks do contador de repositórios (rodapé e "Sobre"). Todas as chamadas ao GitHub são simuladas
// (usuário, busca de commits e contribuições): os testes não dependem da conta real nem da rede.
import { test, expect } from '@playwright/test';

const USERS_API = 'https://api.github.com/users/**';
const GITHUB_API = 'https://api.github.com/**';

// contribuições simuladas, para a seção "Atividade" não depender da rede
const contribs = {
  total: { lastYear: 5 },
  contributions: Array.from({ length: 365 }, (_, i) => {
    const d = new Date(Date.UTC(2025, 9, 21) + i * 864e5).toISOString().slice(0, 10);
    return { date: d, count: i % 7 === 0 ? 1 : 0, level: i % 7 === 0 ? 1 : 0 };
  }),
};

test.beforeEach(async ({ page }) => {
  // relógio adiantável (para simular "voltou para a aba depois de 2 min") e registro das chamadas a fetch
  await page.addInitScript(() => {
    const realNow = Date.now;
    window.__offset = 0;
    Date.now = () => realNow() + window.__offset;
    const realFetch = window.fetch;
    window.__fetches = [];
    window.fetch = (u, o) => {
      window.__fetches.push({ url: String(u), cache: o?.cache });
      return realFetch(u, o);
    };
  });
  await page.route('https://github-contributions-api.jogruber.de/**', (r) => r.fulfill({ json: contribs }));
  await page.route('https://api.github.com/search/**', (r) => r.fulfill({ json: { total_count: 1234 } }));
});

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function gotoFooter(page) {
  await page.goto('/');
  await page.locator('#repoCounter').scrollIntoViewIfNeeded();
}

const counter = (page) => page.locator('#repoCounter');
const number = (page) => page.locator('#repoCounter .repos__n');
const sobreRepos = (page) => page.locator('.stat [data-gh="repos"]');

test('número acompanha a API a cada carregamento (19 → 20 → 19), no rodapé e no "Sobre"', async ({ page }) => {
  test.slow(); // três carregamentos da página inteira; sendo o primeiro teste, ainda pega o Vite compilando
  let repos = 19, calls = 0;
  await page.route(USERS_API, (r) => { calls++; return r.fulfill(json({ public_repos: repos })); });

  for (const n of [19, 20, 19]) { // criou um repositório, depois excluiu
    repos = n;
    if (calls) await page.reload(); else await page.goto('/');
    await page.locator('.stats').scrollIntoViewIfNeeded();
    await expect(sobreRepos(page)).toHaveText(String(n));
    await page.locator('#repoCounter').scrollIntoViewIfNeeded();
    await expect(counter(page)).toHaveAttribute('data-state', 'ok');
    await expect(number(page)).toHaveText(String(n));
  }

  expect(calls).toBe(3); // uma requisição nova por carregamento
  const stored = await page.evaluate(() => Object.values(localStorage).join(' '));
  expect(stored).not.toContain('"repos"'); // nada de cache do número
});

// O Playwright desliga o cache HTTP quando intercepta requisições, então o teste acima não prova o no-store.
// Este prova que a opção é pedida ao navegador (não prova o comportamento do cache em si).
test('a consulta de repositórios pede cache: no-store', async ({ page }) => {
  await page.route(USERS_API, (r) => r.fulfill(json({ public_repos: 19 })));
  await gotoFooter(page);
  await expect(number(page)).toHaveText('19');
  const calls = await page.evaluate(() => window.__fetches.filter((f) => f.url.includes('api.github.com/users/')));
  expect(calls.length).toBeGreaterThan(0);
  for (const c of calls) expect(c.cache).toBe('no-store');
});

test('ao voltar para a aba depois de 1 min, rodapé e "Sobre" mostram o número novo sem recarregar', async ({ page }) => {
  let repos = 19;
  await page.route(USERS_API, (r) => r.fulfill(json({ public_repos: repos })));
  await page.goto('/');
  await page.locator('.stats').scrollIntoViewIfNeeded();
  await expect(sobreRepos(page)).toHaveText('19');
  await page.locator('#repoCounter').scrollIntoViewIfNeeded();
  await expect(number(page)).toHaveText('19');

  repos = 20;
  // antes de 1 min: não consulta de novo
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(1500);
  await expect(number(page)).toHaveText('19');

  // depois de 2 min: consulta de novo
  await page.evaluate(() => { window.__offset = 120e3; document.dispatchEvent(new Event('visibilitychange')); });
  await expect(number(page)).toHaveText('20');
  await expect(sobreRepos(page)).toHaveText('20');
});

test('com a API no ar, o "Sobre" mostra os números dela e guarda só os commits em cache', async ({ page }) => {
  await page.route(USERS_API, (r) => r.fulfill(json({ public_repos: 19 })));
  await page.goto('/');
  await page.locator('.stats').scrollIntoViewIfNeeded();
  await expect(page.locator('.stat [data-gh="repos"]')).toHaveText('19');
  await expect(page.locator('.stat [data-gh="commits"]')).toHaveText('1234');
  await expect(page.locator('.stat [data-gh="contribs"]')).toHaveText('5');
  const cache = await page.evaluate(() => JSON.parse(localStorage.getItem('gh-stats-v3')));
  expect(cache.commits).toBe(1234);
  expect(cache).not.toHaveProperty('repos');
});

for (const [name, handler] of [
  ['erro de rede', (r) => r.abort('failed')],
  ['erro 500', (r) => r.fulfill(json({ message: 'Server Error' }, 500))],
]) {
  test(`mostra "fora do ar" com ${name}`, async ({ page }) => {
    await page.route(USERS_API, handler);
    await gotoFooter(page);
    await expect(counter(page)).toHaveAttribute('data-state', 'error');
    await expect(counter(page)).toContainText('fora do ar');
    await expect(number(page)).not.toHaveText(/\d/);
  });
}

test('mostra "fora do ar" quando a API demora mais de 7 s', async ({ page }) => {
  await page.route(USERS_API, async (r) => {
    await new Promise((res) => setTimeout(res, 7500));
    await r.fulfill(json({ public_repos: 19 })).catch(() => {}); // a página já desistiu da requisição
  });
  await gotoFooter(page);
  await expect(counter(page)).toHaveAttribute('data-state', 'error', { timeout: 10e3 });
  await expect(counter(page)).toContainText('fora do ar');
  await expect(number(page)).not.toHaveText(/\d/);
});

test('mostra "Limite de consultas" com 403', async ({ page }) => {
  await page.route(USERS_API, (r) => r.fulfill(json({ message: 'API rate limit exceeded' }, 403)));
  await gotoFooter(page);
  await expect(counter(page)).toHaveAttribute('data-state', 'error');
  await expect(counter(page)).toContainText('Limite de consultas');
  await expect(number(page)).not.toHaveText(/\d/);
});

// 375 = celular; 600 e 899 = tablet, onde o rodapé também vira uma coluna
for (const width of [375, 600, 899]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true });

    test('sem rolagem horizontal e rodapé sem sobreposição, com a mensagem de erro (a mais longa)', async ({ page }) => {
      await page.route(USERS_API, (r) => r.abort('failed'));
      await gotoFooter(page);
      await expect(counter(page)).toHaveAttribute('data-state', 'error');
      // fim da página: o nome gigante termina de se levantar
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(1500);

      const m = await page.evaluate(() => {
        const box = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right }; };
        const cross = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const footer = box(document.querySelector('.footer'));
        const sections = [...document.querySelectorAll('main > section')].map((s) => ({ id: s.id || s.className, ...box(s) }));
        const items = [...document.querySelectorAll('.footer__bar > *')].map(box);
        const itemPairs = items.flatMap((a, i) => items.slice(i + 1).map((b) => cross(a, b)));
        return {
          scrollWidth: document.documentElement.scrollWidth,
          overlappingSections: sections.filter((s) => cross(footer, s)).map((s) => s.id),
          itemsOverlap: itemPairs.some(Boolean),
          itemsOutside: items.some((b) => b.right > innerWidth),
          barCrossesName: cross(box(document.querySelector('.footer__bar')), box(document.querySelector('.footer__name'))),
        };
      });
      expect(m.scrollWidth).toBeLessThanOrEqual(width);
      expect(m.overlappingSections).toEqual([]);
      expect(m.itemsOverlap).toBe(false);
      expect(m.itemsOutside).toBe(false);
      expect(m.barCrossesName).toBe(false);
    });
  });
}

test('resto da página funciona com a API do GitHub fora do ar', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.route(GITHUB_API, (r) => r.abort('failed')); // repositórios e commits falham

  await page.goto('/');

  // "Sobre": repositórios mostram "—" (sem número inventado); commits caem no valor do HTML
  await page.locator('.stats').scrollIntoViewIfNeeded();
  await expect(page.locator('.stat b')).toHaveCount(4);
  await expect(sobreRepos(page)).toHaveText('—');
  await expect(page.locator('.stat [data-gh="commits"]')).toHaveText('900+');
  await expect(page.locator('.stat [data-gh="contribs"]')).toHaveText('5');
  await expect(page.locator('.stat b:not([data-gh])')).toHaveText(/^[1-9]\d*$/);

  // o que roda depois do contador no main.js continua de pé
  // (o player dos vídeos é ligado depois do contador; o cursor do sistema não é escondido)
  await expect(page.locator('#videoModal')).toHaveCount(1);
  await expect(page.locator('body')).toHaveCSS('cursor', 'auto');
  await page.locator('#copyEmail').scrollIntoViewIfNeeded();
  await page.locator('#copyEmail').click();
  await expect(page.locator('#copyFeedback')).toHaveText('copiado ✓');

  expect(pageErrors).toEqual([]);
});
