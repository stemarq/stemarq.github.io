export default {
  url: 'http://localhost:8081/', w: 390, h: 844, dpr: 2, mobile: true, sheetEvery: 2,
  async before(p) { await p.waitForTimeout(6000); },
  async run(p, h) {
    await h.wait(1000);
    await h.tap('input[type="email"], input >> nth=0'); await p.keyboard.type('demo@xepa.app', { delay: 40 });
    await h.tap('input[type="password"], input >> nth=1'); await p.keyboard.type('Xepa#2026', { delay: 40 });
    await h.wait(400);
    await h.tap('text=Entrar >> nth=-1'); await h.wait(4000);
    await h.move(195, 600); await h.wait(1500);
    await h.scroll(500, 40); await h.wait(1800); await h.scroll(-500, 30); await h.wait(600);
    for (const tab of ['Despensa', 'Grana', 'Cabeça', 'Roupa']) {
      await h.tapText(tab, true); await h.wait(2600);
      await h.move(195, 500); await h.scroll(450, 40); await h.wait(1800);
    }
    await h.tapText('A banca', true); await h.wait(2000);
  },
};
