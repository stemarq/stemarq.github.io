const BASE = 'https://stemarq.github.io/DudyApp/';
export default {
  url: BASE + 'index.html', w: 390, h: 844, dpr: 2, mobile: true, sheetEvery: 2.5,
  async setup(ctx) {
    // nada vai para o Supabase de produção: respostas vazias
    await ctx.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? '[]' : '{}' }));
    await ctx.addInitScript(() => { localStorage.setItem('criancaSelecionada', 'demo'); localStorage.setItem('id', 'demo'); });
  },
  async before(p) { await p.waitForTimeout(2000); },
  async run(p, h) {
    await h.wait(2000);
    await p.goto(BASE + 'telas/telaHome.html'); await h.wait(1800);
    await h.tapText('Atividades'); await h.wait(2000);
    await h.tapText('Comidas'); await h.wait(2500);
    await h.tapText('Apple'); await h.wait(900);
    await h.tapText('VERIFICAR'); await h.wait(2500);
    await p.screenshot({ path: 'dd-after.png' });
    await p.goto(BASE + 'telas/telaHome.html'); await h.wait(1500);
    await h.tapText('Jogos'); await h.wait(1800);
    await h.tap('#jogo-memoria'); await h.wait(4200);
    // o jogo mostra todas as cartas antes de virar: memoriza as posições e depois forma os pares
    const srcs = await p.locator('.block img').evaluateAll((im) => im.map((i) => i.getAttribute('src')));
    await p.waitForFunction(() => !document.querySelector('.block.flipped'), null, { timeout: 15000 }).catch(() => {});
    await h.wait(800);
    const pairs = {}; srcs.forEach((s, i) => (pairs[s] ||= []).push(i));
    const flip = async (i) => { const bb = await p.locator('.block').nth(i).boundingBox(); await h.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await h.wait(650); };
    let k = 0;
    for (const [s, idx] of Object.entries(pairs)) { if (idx.length < 2 || k++ >= 5) continue; await flip(idx[0]); await flip(idx[1]); await h.wait(700); }
    await h.wait(1500);
    await p.goto(BASE + 'telas/historia.html?id=1'); await h.wait(3000);
    await p.screenshot({ path: 'dd-hist.png' });
    await h.scroll(300); await h.wait(2000);
  },
};
