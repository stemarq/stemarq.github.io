// GitLab SIMULADO para a gravação: nenhuma issue vai para o GitLab real
import http from 'node:http';
let iid = 127;
http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    const u = req.url; const json = (d) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(d)); };
    if (u.startsWith('/api/v4/user')) return json({ id: 1, name: 'Stephany Marques', username: 'stemarq' });
    if (u.includes('/milestones')) return json([{ id: 9, iid: 4, title: 'Sprint 4', state: 'active', start_date: '2026-11-02', due_date: '2026-11-13' }]);
    if (u.includes('/labels')) return json([{ id: 1, name: 'Review: Ana' }, { id: 2, name: 'Review: Bruno' }, { id: 3, name: 'Review: Carla' }]);
    if (u.includes('time_estimate')) return json({ time_estimate: 3600 });
    if (req.method === 'POST' && u.endsWith('/issues')) { const p = JSON.parse(body || '{}'); iid++; return json({ iid, title: p.title, due_date: p.due_date, milestone: p.milestone_id ? { id: 9, title: 'Sprint 4' } : null, web_url: `https://gitlab.com/demo/app-entregas/-/issues/${iid}` }); }
    if (req.method === 'PUT') return json({ iid, due_date: '2026-11-12' });
    json({});
  });
}).listen(8766);
