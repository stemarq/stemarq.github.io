export default {
  url: 'http://localhost:8765/', w: 1440, h: 900, sheetEvery: 2.5,
  async before(p) { await p.waitForTimeout(2500); },
  async run(p, h) {
    await h.move(700, 400); await h.wait(1500);
    await h.move(1000, 690); await h.wait(1200);          // passeia pelo gráfico
    await h.move(700, 650, 40); await h.wait(1000);
    await h.scroll(700); await h.wait(2500);
    await h.scroll(-700); await h.wait(800);
    await h.tapText('Contribuidores'); await h.wait(3000);
    await h.scroll(500); await h.wait(2200);
    await h.tapText('Commits'); await h.wait(3000);
    await h.scroll(500); await h.wait(2200);
    await h.tapText('Relatorio'); await h.wait(3500);
    await h.scroll(600); await h.wait(2500);
  },
};
