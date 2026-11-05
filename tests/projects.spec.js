// Checks dos cards de projeto: cursor do sistema, botões de ação e o player do "Ver rodando".
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // nada de rede real: GitHub e contribuições simulados
  await page.route('https://api.github.com/**', (r) => r.fulfill({ json: { public_repos: 17, total_count: 900 } }));
  await page.route('https://github-contributions-api.jogruber.de/**', (r) => r.fulfill({ json: { total: { lastYear: 1 }, contributions: [] } }));
});

test('o cursor do sistema fica visível (sem cursor customizado)', async ({ page }) => {
  test.slow(); // costuma ser o primeiro carregamento: ainda pega o Vite compilando
  await page.goto('/');
  await expect(page.locator('#cursor, .cursor-dot')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/has-cursor/);
  await expect(page.locator('.contact__cta')).toHaveCSS('cursor', 'pointer');
});

test('cada projeto tem código e documentação, e os que estão no ar têm o botão para testar', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.pcard:not(.pcard--end)');
  await expect(cards).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const a = cards.nth(i).locator('.pcard__actions a');
    await expect(a.filter({ hasText: 'Código' })).toHaveAttribute('href', /^https:\/\/github\.com\/stemarq\//);
    expect(await a.count()).toBeGreaterThanOrEqual(2);
    for (const el of await a.all()) await expect(el).toHaveAttribute('target', '_blank');
  }
  // o card inteiro não é mais um link escondido por cima dos botões
  await expect(page.locator('.pcard:not(.pcard--end) .pcard__link')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Jogar agora/ })).toHaveAttribute('href', 'https://stemarq.github.io/jogo_cielo/');
});

test('"Ver rodando" abre o vídeo num player, trava a rolagem e para o vídeo ao fechar', async ({ page }) => {
  await page.goto('/');
  // injeta um projeto com vídeo para testar o player sem depender de um arquivo real
  await page.evaluate(() => {
    const b = document.createElement('button');
    b.className = 'pbtn';
    b.dataset.video = './videos/teste.mp4';
    b.dataset.title = 'Projeto teste';
    b.textContent = '▶ Ver rodando';
    document.querySelector('.pcard__actions').appendChild(b);
  });
  await page.locator('[data-video="./videos/teste.mp4"]').dispatchEvent('click');
  const modal = page.locator('#videoModal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#videoTitle')).toHaveText('Projeto teste');
  await expect(modal.locator('video')).toHaveAttribute('src', './videos/teste.mp4');
  await expect(page.locator('html')).toHaveClass(/lenis-stopped/);

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(modal.locator('video')).not.toHaveAttribute('src', /./);
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
});

test('os 6 projetos têm "Ver rodando", e o vídeo e a capa de cada um existem', async ({ page, request }) => {
  await page.goto('/');
  const btns = page.locator('.pcard [data-video]');
  await expect(btns).toHaveCount(6);
  for (const b of await btns.all()) {
    const [video, poster] = [await b.getAttribute('data-video'), await b.getAttribute('data-poster')];
    for (const f of [video, poster]) expect((await request.head(f.replace('./', '/'))).status(), f).toBe(200);
  }
});

test('o vídeo do Xepa toca no player', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pcard [data-video="./videos/xepa.mp4"]').dispatchEvent('click');
  const v = page.locator('#videoModal video');
  await expect(v).toHaveAttribute('poster', './videos/xepa.jpg');
  // o vídeo carrega e tem a duração do roteiro (~32 s)
  await expect.poll(() => v.evaluate((el) => el.duration)).toBeGreaterThan(60);
});

// clique de verdade (não dispatchEvent): no desktop os cards ficam em 3D e algo na frente pode roubar o clique
for (const [w, h] of [[1440, 900], [390, 844]]) {
  test(`${w}px: clicar em "Ver rodando" de cada card abre o player`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    for (const id of ['xepa', 'dashgit', 'cielo', 'gitia', 'dudy', 'genetools']) {
      const btn = page.locator(`[data-video="./videos/${id}.mp4"]`);
      // rola a página como uma pessoa até o botão aparecer (no desktop o trilho anda na horizontal)
      for (let i = 0; i < 80; i++) {
        const bb = await btn.boundingBox();
        if (bb && bb.x > 0 && bb.x + bb.width < w && bb.y > 80 && bb.y + bb.height < h - 20) break;
        await page.mouse.wheel(0, 250); await page.waitForTimeout(120);
      }
      await page.waitForTimeout(900); // o trilho anda com scrub: espera assentar
      await btn.click({ trial: true }); // falha se outro elemento estiver por cima
      await btn.click();
      await expect(page.locator('#videoModal')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#videoModal')).toBeHidden();
    }
  });
}
