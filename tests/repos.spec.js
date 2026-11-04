// Checks do contador de repositórios do rodapé. A API do GitHub é sempre simulada:
// os testes não dependem da conta real nem do GitHub estar no ar.
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
  await page.route('https://github-contributions-api.jogruber.de/**', (r) => r.fulfill({ json: contribs }));
});

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function gotoFooter(page) {
  await page.goto('/');
  await page.locator('#repoCounter').scrollIntoViewIfNeeded();
}

const counter = (page) => page.locator('#repoCounter');
const number = (page) => page.locator('#repoCounter .repos__n');

test('número acompanha a API a cada carregamento (19 → 20)', async ({ page }) => {
  let repos = 19, calls = 0;
  await page.route(USERS_API, (r) => { calls++; return r.fulfill(json({ public_repos: repos })); });

  await gotoFooter(page);
  await expect(counter(page)).toHaveAttribute('data-state', 'ok');
  await expect(number(page)).toHaveText('19');

  repos = 20; // "criaram" um repositório
  await page.reload();
  await page.locator('#repoCounter').scrollIntoViewIfNeeded();
  await expect(number(page)).toHaveText('20');

  expect(calls).toBeGreaterThanOrEqual(2); // uma requisição nova por carregamento
  const stored = await page.evaluate(() => Object.values(localStorage).join(' '));
  expect(stored).not.toContain('"repos"'); // nada de cache do número
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

test.describe('celular (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('sem rolagem horizontal e rodapé sem sobreposição, com a mensagem de erro (a mais longa)', async ({ page }) => {
    await page.route(USERS_API, (r) => r.abort('failed'));
    await gotoFooter(page);
    await expect(counter(page)).toHaveAttribute('data-state', 'error');

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
      };
    });
    expect(m.scrollWidth).toBeLessThanOrEqual(375);
    expect(m.overlappingSections).toEqual([]);
    expect(m.itemsOverlap).toBe(false);
    expect(m.itemsOutside).toBe(false);
  });
});

test('resto da página funciona com a API do GitHub fora do ar', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.route(GITHUB_API, (r) => r.abort('failed')); // repositórios e commits falham

  await page.goto('/');

  // números do "Sobre" preenchidos (commits e repositórios caem no valor do HTML)
  await page.locator('.stats').scrollIntoViewIfNeeded();
  const stats = page.locator('.stat b');
  await expect(stats).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(stats.nth(i)).toHaveText(/^[1-9]\d*\+?$/);

  // o que roda depois do contador no main.js continua de pé
  await expect(page.locator('body')).toHaveClass(/has-cursor/);
  await page.locator('#copyEmail').scrollIntoViewIfNeeded();
  await page.locator('#copyEmail').click();
  await expect(page.locator('#copyFeedback')).toHaveText('copiado ✓');

  expect(pageErrors).toEqual([]);
});
