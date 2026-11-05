export default {
  url: 'http://localhost:8767/', w: 1440, h: 900, sheetEvery: 2.5,
  async setup(ctx) {
    // a pílula do topo mostra o endereço do GitLab simulado; no vídeo aparece o do GitLab
    await ctx.route('**/api/config', async (r) => { const res = await r.fetch(); const j = await res.json(); j.gitlabUrl = 'https://gitlab.com'; r.fulfill({ response: res, json: j }); });
  },
  async before(p) { await p.waitForTimeout(2000); },
  async run(p, h) {
    await h.wait(1200);
    await h.tap('textarea'); await h.wait(400);
    await p.keyboard.type('reunião de hoje:\n- login quebra no safari, ver cookie\n- falta teste no carrinho\n- documentar a rota de pedidos no swagger', { delay: 28 });
    await h.wait(800);
    // o Gemini às vezes responde 503 (alta demanda): tenta de novo
    for (let t = 0; t < 6; t++) {
      await h.tapText('Formatar com Gemini');
      const ok = await p.waitForFunction(() => /[1-9]\d* tarefas? pronta|Falha na API/.test(document.body.innerText), null, { timeout: 60000 }).then(() => p.evaluate(() => !/Falha na API/.test(document.body.innerText)));
      if (ok) break;
      console.log('gemini falhou, tentando de novo'); await h.wait(4000);
    }
    await h.wait(1200);
    await h.scroll(560, 50); await h.wait(2500);
    await h.scroll(700, 50); await h.wait(2500);
    await h.scroll(-1260, 40); await h.wait(600);
    await h.scroll(300, 20); await h.wait(600);
    await h.tapText('Atribuir para mim'); await h.wait(600);
    await p.locator('select').first().selectOption({ label: 'Sprint 4' }).catch(() => {}); await h.wait(800);
    { const btn = p.getByRole('button', { name: /Criar no GitLab/ }); await btn.scrollIntoViewIfNeeded(); await h.wait(500); const bb = await btn.boundingBox(); await h.click(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await p.waitForFunction(() => /Issue #\d+ criada/.test(document.body.innerText), null, { timeout: 30000 });
    await h.wait(1000);
    // rola suavemente até o bloco "Resultado" (issues criadas)
    await h.wait(1500);
    await p.evaluate(() => { const el = [...document.querySelectorAll('h2')].find((e) => e.textContent.trim() === 'Resultado'); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'smooth' }); });
    await h.wait(4500);
    await p.screenshot({ path: 'gi-end.png' });
  },
};
