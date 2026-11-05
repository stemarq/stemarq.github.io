export default {
  url: 'https://stemarq.github.io/jogo_cielo/', w: 1024, h: 768, sheetEvery: 2.5,
  async setup(ctx) {
    // só na gravação: renderizador Canvas (o WebGL do navegador sem janela é instável)
    await ctx.route('**/src/main.js', async (r) => {
      const res = await r.fetch(); const body = (await res.text()).replace('Phaser.AUTO', 'Phaser.CANVAS');
      r.fulfill({ response: res, body });
    });
  },
  async before(p) { await p.waitForTimeout(9000); },
  async run(p, h) {
    await h.wait(1500);
    await h.click(510, 590); await h.wait(9000);
    for (let i = 0; i < 3; i++) { await h.click(730, 390); await h.wait(1800); }
    await h.drag(500, 600, 500, 250, 60); await h.wait(1500);
    await h.click(753, 690); await h.wait(1500);          // padaria
    await h.click(422, 444); await h.wait(5000);          // ENTRAR
    for (let r = 0; r < 4; r++) {
      for (let i = 0; i < 3; i++) { await h.click(560, 250); await h.wait(1600); } // avança fala
      await h.click(700, 340); await h.wait(2500);        // escolhe a 1ª opção
    }
  },
};
