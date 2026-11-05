export default {
  url: 'https://stemarq.github.io/GeneTools/', w: 1280, h: 800, sheetEvery: 2,
  async before(p) { await p.waitForTimeout(2500); },
  async run(p, h) {
    await h.move(640, 400); await h.wait(1200);
    await h.tap('#animal-select .selected-option'); await h.wait(700);
    await h.tap('#animal-select .option[data-value="cachorro"]'); await h.wait(900);
    await h.tap('#select_cor1 .selected-option-cor'); await h.wait(700);
    await h.tap('#select_cor1 .option[data-value="preto"]'); await h.wait(800);
    await h.tap('#select_cor2 .selected-option-cor'); await h.wait(700);
    await h.tap('#select_cor2 .option[data-value="preto"]'); await h.wait(900);
    await h.tap('#btn'); await h.wait(1500);
    await h.scroll(380); await h.wait(2500);
    for (let i = 0; i < 4; i++) { await h.tap('#btn-prox'); await h.wait(2600); }
  },
};
