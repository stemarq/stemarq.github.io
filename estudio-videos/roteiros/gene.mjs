// GeneTools: monta um cruzamento, acompanha a explicação guiada e resolve um exercício.
export default {
  url: 'https://stemarq.github.io/GeneTools/', w: 1280, h: 800, scale: 2, sheetEvery: 3,
  async before(p) { await p.waitForTimeout(2500); },
  async run(p, h) {
    h.mark('inicio');
    await h.move(640, 400); await h.wait(1500);
    h.mark('animal');
    await h.tap('#animal-select .selected-option'); await h.wait(900);
    await h.tap('#animal-select .option[data-value="coelho"]'); await h.wait(1200);
    h.mark('alelos');
    await h.tap('#select_cor1 .selected-option-cor'); await h.wait(900);
    await h.tap('#select_cor1 .option[data-value="preto"]'); await h.wait(1000);
    await h.tap('#select_cor2 .selected-option-cor'); await h.wait(900);
    await h.tap('#select_cor2 .option[data-value="marrom"]'); await h.wait(1200);
    h.mark('combinar');
    await h.tap('#btn'); await h.wait(2500);
    await h.move(390, 820 - 40); await h.scroll(380); await h.wait(2800);
    h.mark('explica');
    for (let i = 0; i < 5; i++) { await h.tap('#btn-prox'); await h.wait(3000); }
    h.mark('exercicio');
    await p.goto('https://stemarq.github.io/GeneTools/exercicios.html'); await h.wait(2500);
    await h.move(640, 220); await h.wait(2200);
    await h.tapText('100%', true); await h.wait(1200);
    await h.tapText('Responder', true); await h.wait(3500);
    h.mark('fim');
    await h.wait(1500);
  },
};
