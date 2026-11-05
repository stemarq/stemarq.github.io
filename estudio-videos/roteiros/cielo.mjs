export default {
  url: 'https://stemarq.github.io/jogo_cielo/', w: 1024, h: 768, scale: 2, sheetEvery: 3,
  async setup(ctx) {
    // só na gravação: renderizador Canvas (o WebGL do navegador sem janela é instável)
    await ctx.route('**/src/main.js', async (r) => {
      const res = await r.fetch(); const body = (await res.text()).replace('Phaser.AUTO', 'Phaser.CANVAS');
      r.fulfill({ response: res, body });
    });
  },
  async before(p) { await p.waitForTimeout(9000); },
  async run(p, h) {
    h.mark('capa'); await h.wait(1500);
    await h.click(510, 590); h.mark('intro'); await h.wait(9000);
    h.mark('tutorial');
    for (let i = 0; i < 3; i++) { await h.click(730, 390); await h.wait(1800); }
    h.mark('mapa'); await h.drag(500, 600, 500, 250, 60); await h.wait(1500);
    await h.click(753, 690); await h.wait(1500);          // padaria
    await h.click(422, 444); h.mark('entrar'); await h.wait(5000);          // ENTRAR
    // padaria: erra a 1ª de propósito (a satisfação cai), se recupera e acerta as outras até fechar a venda
    // opções do Phaser em y = 340, 490, 640 (bakeryScene.js)
    const escolhas = [340, 340, 640, 640];
    for (let r = 0; r < escolhas.length; r++) {
      h.mark('rodada' + r);
      for (let i = 0; i < 3; i++) { await h.click(560, 250); await h.wait(1600); } // avança fala
      await h.click(700, escolhas[r]); await h.wait(2600);
    }
    h.mark('final');
    for (let i = 0; i < 3; i++) { await h.click(560, 250); await h.wait(1800); }
    h.mark('fim'); await h.wait(2000);
  },
};
