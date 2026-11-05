// GItIA: anotação solta da reunião → Gemini organiza em tarefas → issues no GitLab (simulado: apoio/mock-gitlab.mjs).
export default {
  url: 'http://localhost:8767/', w: 1440, h: 900, scale: 2, sheetEvery: 3,
  async setup(ctx) {
    // a pílula do topo mostra o endereço do GitLab simulado; no vídeo aparece o do GitLab
    await ctx.route('**/api/config', async (r) => { const res = await r.fetch(); const j = await res.json(); j.gitlabUrl = 'https://gitlab.com'; r.fulfill({ response: res, json: j }); });
  },
  async before(p) { await p.waitForTimeout(2000); },
  async run(p, h) {
    h.mark('inicio'); await h.move(720, 300); await h.wait(1500);
    h.mark('nota');
    await h.tap('textarea'); await h.wait(400);
    await p.keyboard.type('reunião de hoje:\n- login quebra no safari, ver cookie\n- falta teste no carrinho\n- documentar a rota de pedidos no swagger\n- ana pediu tema escuro, ver depois da sprint', { delay: 32 });
    await h.wait(900);
    h.mark('gemini');
    // o Gemini às vezes responde 503 (alta demanda): tenta de novo
    for (let t = 0; t < 6; t++) {
      await h.tapText('Formatar com Gemini');
      const ok = await p.waitForFunction(() => /[1-9]\d* tarefas? pronta|Falha na API/.test(document.body.innerText), null, { timeout: 60000 }).then(() => p.evaluate(() => !/Falha na API/.test(document.body.innerText)));
      if (ok) break;
      console.log('gemini falhou, tentando de novo'); await h.wait(4000);
    }
    h.mark('pronto'); await h.wait(1500);
    await h.move(500, 560, 30); await h.wait(1800);
    h.mark('tarefas');
    await h.ver(p.getByText('Preview e edição').first(), 'start'); await h.wait(1500);
    await h.move(780, 500, 30); await h.wait(1500);
    await h.scroll(420, 50); await h.wait(2400);
    await h.scroll(420, 50); await h.wait(2400);
    h.mark('ajustes');
    await h.ver(p.getByText('Preview e edição').first(), 'start'); await h.wait(900);
    await h.tapText('Atribuir para mim'); await h.wait(700);
    await p.locator('select').first().selectOption({ label: 'Sprint 4' }).catch(() => {}); await h.wait(1200);
    h.mark('criar');
    await h.alvo(p.getByRole('button', { name: /Criar no GitLab/ }));
    await p.waitForFunction(() => /Issue #\d+ criada/.test(document.body.innerText), null, { timeout: 30000 });
    await h.wait(1200);
    h.mark('resultado');
    await h.ver(p.getByRole('heading', { name: 'Resultado', exact: true }).first(), 'start'); await h.move(1170, 560, 30); await h.wait(4000);
    h.mark('fim'); await h.wait(800);
  },
};
