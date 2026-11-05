// dashGit: do ritmo do board ao relatório da sprint, com um time fictício (apoio/seed_demo.py).
export default {
  url: 'http://localhost:8765/', w: 1440, h: 900, scale: 2, sheetEvery: 3,
  async before(p) { await p.waitForTimeout(2500); },
  async run(p, h) {
    const txt = (t, exact = true) => p.getByText(t, { exact }).filter({ visible: true }).first();
    h.mark('visao');
    await h.move(720, 450); await h.wait(1200);
    await h.move(560, 330, 30); await h.wait(1500);
    await h.move(1000, 330, 30); await h.wait(1500);
    h.mark('grafico');
    await h.ver(txt('Horas em coluna por dia'), 'start'); await h.wait(600);
    const g = await txt('Horas em coluna por dia').boundingBox();
    for (const dx of [120, 260, 400, 540, 680]) { await h.move(g.x + dx, g.y + 220, 20); await h.wait(700); }
    h.mark('atencao');
    await h.ver(txt('Precisa de atencao')); await h.move(1100, 450, 30); await h.wait(2600);
    h.mark('sprint');
    await h.ver(txt('Comparativo de sprints'), 'start'); await h.wait(1200);
    await h.alvo(p.getByRole('button', { name: /Sprint 4/ }).first()); await h.wait(3200);
    h.mark('gargalo');
    await h.ver(txt('Gargalo por coluna'), 'start'); await h.move(700, 450, 30); await h.wait(3200);
    h.mark('issue');
    await h.ver(txt('Issues mais demoradas'), 'start'); await h.wait(1500);
    await h.alvo(p.locator('tr', { hasText: 'Endpoint de pedidos' }).filter({ visible: true }).first()); await h.wait(1500);
    await h.move(560, 160, 30); await h.wait(1200); await h.move(800, 330, 30); await h.wait(1500); await h.move(700, 450, 30); await h.wait(1500);
    h.mark('contrib');
    await p.keyboard.press('Escape').catch(() => {});
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await h.wait(900);
    await h.tapText('Contribuidores', true); await h.wait(3000);
    await h.move(800, 500); await h.scroll(500, 40); await h.wait(2500);
    h.mark('relatorio');
    await h.tapText('Relatorio', true); await h.wait(2500);
    await h.move(620, 400, 30); await h.wait(1500); await h.move(1230, 260, 30); await h.wait(1800); // Exportar PDF (só passa o mouse)
    await h.move(800, 500); await h.scroll(560, 50); await h.wait(3500);
    h.mark('fim'); await h.wait(1000);
  },
};
