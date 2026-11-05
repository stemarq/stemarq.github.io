"""Banco de DEMONSTRAÇÃO para gravar o vídeo: time e issues fictícios (nada do GitLab real)."""
import random, sqlite3, hashlib
from datetime import datetime, timedelta, timezone
from app.db import SCHEMA, _migrate
random.seed(7)
db = sqlite3.connect('demo.db'); db.row_factory = sqlite3.Row
db.executescript(SCHEMA); _migrate(db)
PID = 101
team = [(1, 'Ana Souza'), (2, 'Bruno Lima'), (3, 'Carla Mendes'), (4, 'Diego Rocha'), (5, 'Elisa Prado')]
iso = lambda d: d.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
db.execute("INSERT INTO projects VALUES (?,?,?,?,?)", (PID, 'demo/app-entregas', 'app-entregas', 'https://gitlab.com/demo/app-entregas', iso(datetime(2026, 11, 4, 18, tzinfo=timezone.utc))))
for i, lab in enumerate(['Backlog', 'To Do', 'Doing', 'Review', 'Done']):
    db.execute("INSERT INTO board_lists VALUES (?,?,?,?,?,?)", (PID, 1, 'Sprint board', 10 + i, i, lab))
def work(d, h):  # avança h horas úteis (seg–sex, 9h–18h)
    while h > 0:
        d += timedelta(hours=1)
        if d.weekday() < 5 and 12 <= d.hour < 21: h -= 1
    return d
titles = ['Tela de login com validação', 'Endpoint de pedidos', 'Cache de catálogo', 'Notificação de entrega', 'Filtro por status', 'Testes do carrinho', 'Paginação da API', 'Mapa do entregador', 'Cupom de desconto', 'Histórico de pedidos', 'Upload de foto do produto', 'Relatório semanal', 'Ajuste de acessibilidade', 'Refatorar serviço de pagamento', 'Tema escuro', 'Busca com debounce', 'Rate limit na API', 'Onboarding do lojista', 'Exportar CSV', 'Corrigir fuso horário']
start = datetime(2026, 9, 7, 12, tzinfo=timezone.utc)
ev_id, iid = 1, 1
for s in range(4):
    s0 = start + timedelta(days=14 * s); s1 = s0 + timedelta(days=11)
    db.execute("INSERT INTO milestones VALUES (?,?,?,?,?,?,?,?)", (PID, 500 + s, s + 1, f'Sprint {s + 1}', 'closed' if s < 3 else 'active', s0.date().isoformat(), s1.date().isoformat(), ''))
    for k in range(10 + s * 2):
        uid, uname = random.choice(team); rid, rname = random.choice([t for t in team if t[0] != uid])
        c = work(s0, random.randint(0, 12))
        t_doing = work(c, random.randint(2, 14)); t_rev = work(t_doing, random.randint(4, 30 if s != 2 else 44)); t_done = work(t_rev, random.randint(2, 16 if s != 2 else 34))
        finished = s < 3 or k < 8
        evs = [('add', 'To Do', uid, uname, c), ('remove', 'To Do', uid, uname, t_doing), ('add', 'Doing', uid, uname, t_doing)]
        if finished or k < 11: evs += [('remove', 'Doing', uid, uname, t_rev), ('add', 'Review', uid, uname, t_rev)]
        if finished: evs += [('remove', 'Review', rid, rname, t_done), ('add', 'Done', rid, rname, t_done)]
        for a, lab, u, un, when in evs:
            db.execute("INSERT INTO label_events VALUES (?,?,?,?,?,?,?,?)", (ev_id, PID, iid, a, lab, u, un, iso(when))); ev_id += 1
        db.execute("INSERT INTO issues (project_id,iid,id,title,state,created_at,closed_at,updated_at,author_id,author_name,assignee_id,assignee_name,milestone,milestone_id,web_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                   (PID, iid, 9000 + iid, random.choice(titles), 'closed' if finished else 'opened', iso(c), iso(t_done) if finished else None, iso(t_done), uid, uname, uid, uname, f'Sprint {s + 1}', 500 + s, f'https://gitlab.com/demo/app-entregas/-/issues/{iid}'))
        iid += 1
types = ['feat', 'fix', 'test', 'refactor', 'docs', 'chore']
msgs = ['adiciona validação de formulário', 'corrige cálculo de frete', 'cobre serviço de pedidos', 'extrai repositório de produtos', 'documenta endpoints', 'atualiza dependências', 'melhora contraste do botão', 'trata erro de rede']
for n in range(320):
    uid, uname = random.choice(team); when = work(start, random.randint(0, 8 * 9 * 5))
    msg = f"{random.choice(types)}: {random.choice(msgs)}" if random.random() > 0.08 else 'ajustes'
    sha = hashlib.sha1(str(n).encode()).hexdigest()
    db.execute("INSERT INTO commits (project_id,id,short_id,title,author_name,author_email,committed_at,additions,deletions,is_merge,web_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
               (PID, sha, sha[:8], msg, uname, uname.split()[0].lower() + '@demo.dev', iso(when), random.randint(3, 260), random.randint(0, 90), 0, ''))
db.execute("INSERT INTO sync_state (project_id,last_synced_at,commits_synced_at) VALUES (?,?,?)", (PID, iso(datetime(2026, 11, 4, 18, tzinfo=timezone.utc)), iso(datetime(2026, 11, 4, 18, tzinfo=timezone.utc))))
db.commit(); print('issues', iid - 1, 'eventos', ev_id - 1)
