// Xepa: um dia de república — despensa, grana, faculdade e roupa no mesmo app.
// Cada h.mark() vira um passo com zoom e legenda no vídeo (footage/xepa.marks.json).
export default {
  url: 'http://localhost:8081/', w: 390, h: 844, scale: 3, mobile: true, sheetEvery: 3,
  async before(p) { await p.waitForTimeout(6000); },
  async run(p, h) {
    // rola até o elemento ficar no meio da tela e clica nele
    const alvo = async (loc) => {
      await loc.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await h.wait(1100);
      const bb = await loc.boundingBox();
      await h.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    };
    const txt = (t, i = -1) => p.getByText(t, { exact: true }).nth(i);
    const digita = async (s) => { await p.keyboard.type(s, { delay: 90 }); };

    h.mark('login');
    await h.wait(800);
    await h.tap('input >> nth=0'); await digita('demo@xepa.app');
    await h.tap('input >> nth=1'); await digita('Xepa#2026');
    await h.wait(300); await h.tap('text=Entrar >> nth=-1'); await h.wait(3500);

    h.mark('banca');
    await h.move(195, 560); await h.wait(1200);
    await h.scroll(420, 50); await h.wait(2200); await h.scroll(-420, 40); await h.wait(800);

    h.mark('despensa');
    await h.tapText('Despensa', true); await h.wait(2200);
    await alvo(txt('Café', 0)); await h.wait(1200);
    await alvo(p.getByText('Quantidade (pacote)').locator('xpath=following::input[1]')); await p.keyboard.press('Control+A'); await digita('1');
    await h.wait(400); await alvo(txt('Dar baixa')); await h.wait(2400);
    await h.move(195, 300); await h.scroll(-3000, 40); await h.wait(1800);

    h.mark('grana');
    await h.tapText('Grana', true); await h.wait(2200);
    await alvo(txt('Novo lançamento')); await h.wait(1000);
    await alvo(p.locator('input[placeholder="0,00"]').last()); await digita('18,50');
    await alvo(p.locator('input[placeholder="Feira da semana"]').last()); await digita('Pão e café');
    await alvo(txt('Mercado')); await h.wait(500);
    h.mark('lancar');
    await alvo(txt('Lançar')); await h.wait(1500);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await h.move(195, 300); await h.scroll(-3000, 40); await h.wait(2600);

    h.mark('nota');
    await h.tapText('Cabeça', true); await h.wait(2200);
    await alvo(txt('Nova nota', 0)); await h.wait(800);
    await alvo(p.locator('input[placeholder="P1"]').first()); await digita('P2');
    await p.keyboard.press('Tab'); await h.wait(300); await digita('8,5');
    await h.wait(600); await alvo(txt('Registrar nota')); await h.wait(1500);
    await h.move(195, 300); await h.scroll(-3000, 40); await h.wait(2400);

    h.mark('estudo');
    await alvo(txt('Estudei hoje', 0)); await h.wait(900);
    await alvo(p.getByText('Minutos estudados').locator('xpath=following::input[1]')); await p.keyboard.press('Control+A'); await digita('45');
    await h.wait(500); await alvo(txt('Registrar sessão')); await h.wait(1500);
    await h.move(195, 300); await h.scroll(-3000, 40); await h.wait(2400);

    h.mark('roupa');
    await h.tapText('Roupa', true); await h.wait(2200);
    await alvo(txt('Usei hoje', 0)); await h.wait(1800);
    h.mark('lavar');
    await alvo(txt('Agendar lavagem para amanhã', 0)); await h.wait(2200);

    h.mark('fim');
    await h.tapText('A banca', true); await h.wait(1500);
    await h.move(195, 560); await h.scroll(300, 40); await h.wait(2000);
  },
};
