// Dados dos projetos — extraídos dos READMEs em github.com/stemarq
// Cada projeto pode ter até quatro ações, mostradas como botões no card (só aparecem as preenchidas):
//   video → vídeo de apresentação com o app rodando, em public/videos/ (a capa é o .jpg de mesmo nome); abre num player
//   live  → versão no ar para testar (liveLabel muda o texto do botão)
//   repo  → código no GitHub
//   docs  → documentação (docsLabel diz o que é: requisitos, GDD, artigo...)
export const featured = [
  {
    id: 'xepa',
    video: './videos/xepa.mp4',
    name: 'Xepa',
    year: '2026',
    kind: 'App mobile + API',
    desc: 'Hub de vida universitária para quem mora sozinho pela primeira vez: despensa, finanças, estudos e lavanderia num só app.',
    highlights: ['5 módulos de API prontos', '210 testes automatizados', '18 entidades no PostgreSQL'],
    tags: ['React Native', 'Expo', 'Node', 'TypeScript', 'PostgreSQL'],
    repo: 'https://github.com/stemarq/Xepa',
    docs: 'https://github.com/stemarq/Xepa/tree/main/docs',
    docsLabel: 'Documentação (requisitos, ER, API)',
    colors: ['#d6ff3d', '#2a1a4a'],
    cover: 'phone',
  },
  {
    id: 'dashgit',
    video: './videos/dashgit.mp4',
    name: 'dashGit',
    year: '2026',
    kind: 'Dashboard de dados',
    desc: 'API + dashboard que mede o fluxo de um time a partir dos boards do GitLab: tempo por coluna, gargalos, revisão e sprints.',
    highlights: ['Eventos de label viram intervalos', 'Cache em SQLite, sem estourar rate limit', 'Swagger interativo'],
    tags: ['Python', 'FastAPI', 'SQLite', 'GitLab API'],
    repo: 'https://github.com/stemarq/dashGit',
    docs: 'https://github.com/stemarq/dashGit#readme',
    docsLabel: 'README detalhado',
    colors: ['#c77dff', '#120a24'],
    cover: 'chart',
  },
  {
    id: 'cielo',
    video: './videos/cielo.mp4',
    name: 'Conexão Cielo',
    year: '2026',
    kind: 'Jogo educativo · Inteli × Cielo',
    desc: 'Visual novel que treina Gerentes de Negócios da Cielo em negociações simuladas — com barra de satisfação, reputação e fases desbloqueáveis.',
    highlights: ['Parceria real com a Cielo', 'Roda direto no navegador', 'Time Blue Codes, 8 pessoas'],
    tags: ['Phaser', 'JavaScript', 'GitLab CI'],
    live: 'https://stemarq.github.io/jogo_cielo/',
    liveLabel: 'Jogar agora',
    repo: 'https://github.com/stemarq/jogo_cielo',
    docs: 'https://github.com/stemarq/jogo_cielo/blob/main/documents/gdd.md',
    docsLabel: 'Documento de design (GDD)',
    colors: ['#3dc3ff', '#06152e'],
    cover: 'game',
  },
  {
    id: 'gitia',
    video: './videos/gitia.mp4',
    name: 'GItIA',
    year: '2026',
    kind: 'Automação com IA',
    desc: 'Cole uma anotação solta, o Gemini estrutura e o app publica como issue no GitLab. Do “anotei numa linha” à tarefa bem escrita.',
    highlights: ['Integração Gemini + GitLab', 'Endpoint de status das credenciais', 'Zero build no front'],
    tags: ['Node.js', 'Express', 'Gemini', 'GitLab API'],
    repo: 'https://github.com/stemarq/GItIA',
    docs: 'https://github.com/stemarq/GItIA#readme',
    docsLabel: 'README',
    colors: ['#ff7ad9', '#1f0820'],
    cover: 'terminal',
  },
  {
    id: 'dudy',
    video: './videos/dudy.mp4',
    name: 'DudyApp',
    year: '2025',
    kind: 'App de inglês para crianças',
    desc: 'Mapa de lições, quizzes, centro de histórias e minijogos com o urso Dudy como mascote — com login separado para responsável e criança.',
    highlights: ['Minijogos de memória e palavras', 'Auth com Supabase', 'Empacotado com Capacitor'],
    tags: ['JavaScript', 'Supabase', 'Capacitor'],
    live: 'https://stemarq.github.io/DudyApp/',
    liveLabel: 'Abrir o app',
    repo: 'https://github.com/stemarq/DudyApp',
    docs: 'https://github.com/stemarq/DudyApp#readme',
    docsLabel: 'README',
    colors: ['#ffb23d', '#2a1406'],
    cover: 'bear',
  },
  {
    id: 'genetools',
    video: './videos/genetools.mp4',
    name: 'GeneTools',
    year: '2025',
    kind: 'Simulador educacional · Pesquisa científica',
    desc: 'Simulador de cruzamentos genéticos para o ensino médio: o aluno monta os genótipos e vê o quadro de Punnett acontecer passo a passo.',
    highlights: ['Explicação guiada', 'Exercícios práticos', 'Parte de uma pesquisa científica publicada'],
    tags: ['HTML', 'CSS', 'JavaScript'],
    live: 'https://stemarq.github.io/GeneTools/',
    liveLabel: 'Usar o simulador',
    repo: 'https://github.com/stemarq/GeneTools',
    docs: 'https://github.com/stemarq/GeneTools/blob/main/Genetools_%20Facilitando%20o%20aprendizado%20na%20gen%C3%A9tica%20atr%C3%A1ves%20de%20simuladores%20de%20cruzamentos%20no%20ensino%20m%C3%A9dio.pdf',
    docsLabel: 'Artigo científico (PDF)',
    colors: ['#5dffb0', '#06231a'],
    cover: 'punnett',
  },
];

const covers = {
  phone: () => `
    <div class="cv cv--phone">
      <div class="cv-phone">
        <div class="cv-phone__notch"></div>
        <div class="cv-phone__title">Oi, Ste 👋</div>
        <div class="cv-phone__card big"><small>Grana do mês</small><b>R$ 1.240</b><i style="--w:68%"></i></div>
        <div class="cv-phone__grid">
          <div class="cv-phone__card">🥫<small>Despensa</small></div>
          <div class="cv-phone__card">📚<small>Cabeça</small></div>
          <div class="cv-phone__card">👕<small>Roupa</small></div>
          <div class="cv-phone__card">💸<small>Grana</small></div>
        </div>
      </div>
    </div>`,
  chart: () => `
    <div class="cv cv--chart">
      <div class="cv-chart__head"><span>Tempo por coluna</span><span>sprint 07</span></div>
      <div class="cv-chart__bars">
        ${[42, 78, 55, 92, 36, 64, 85, 48].map((h, i) => `<i style="--h:${h}%;--d:${i * 0.06}s"></i>`).join('')}
      </div>
      <div class="cv-chart__legend"><span><b></b>To Do</span><span><b></b>Doing</span><span><b></b>Review</span></div>
    </div>`,
  game: () => `
    <div class="cv cv--game">
      <div class="cv-game__sky"></div>
      <div class="cv-game__city">${Array.from({ length: 9 }, (_, i) => `<i style="--h:${30 + ((i * 37) % 55)}%"></i>`).join('')}</div>
      <div class="cv-game__box">
        <small>Padeiro</small>
        <p>“Por que eu trocaria minha maquininha?”</p>
        <div class="cv-game__sat"><span>Satisfação</span><i></i></div>
      </div>
    </div>`,
  terminal: () => `
    <div class="cv cv--term">
      <div class="cv-term__bar"><i></i><i></i><i></i></div>
      <pre><span class="c">// anotação solta</span>
arrumar login quebrando no safari

<span class="k">→ gemini</span>
<span class="s">## Corrigir falha de login no Safari</span>
- Reproduzir no Safari 17
- Verificar cookies SameSite
- Adicionar teste e2e

<span class="k">✓ issue #128 criada no GitLab</span><span class="caret">▍</span></pre>
    </div>`,
  bear: () => `
    <div class="cv cv--bear">
      <div class="cv-bear">ʕ•ᴥ•ʔ</div>
      <div class="cv-bear__path">${Array.from({ length: 5 }, (_, i) => `<i class="${i < 3 ? 'done' : ''}">${i + 1}</i>`).join('')}</div>
      <div class="cv-bear__word"><span>A</span><span>P</span><span>P</span><span>L</span><span>E</span></div>
    </div>`,
  punnett: () => `
    <div class="cv cv--punnett">
      <div class="cv-pun">
        <span></span><span class="h">A</span><span class="h">a</span>
        <span class="h">A</span><span>AA</span><span>Aa</span>
        <span class="h">a</span><span>Aa</span><span class="r">aa</span>
      </div>
      <div class="cv-pun__ratio">3 : 1</div>
    </div>`,
};

const ext = (href, cls, label) => `<a class="pbtn ${cls}" href="${href}" target="_blank" rel="noopener">${label} <i aria-hidden="true">↗</i></a>`;

function actions(p) {
  return [
    p.video ? `<button type="button" class="pbtn pbtn--main" data-video="${p.video}" data-poster="${p.video.replace(/\.mp4$/, '.jpg')}" data-title="${p.name}">▶ Ver rodando</button>` : '',
    p.live ? ext(p.live, p.video ? '' : 'pbtn--main', p.liveLabel || 'Ver no ar') : '',
    p.repo ? ext(p.repo, '', 'Código') : '',
    p.docs ? ext(p.docs, '', p.docsLabel || 'Documentação') : '',
  ].join('');
}

export function renderFeatured(track) {
  track.innerHTML = featured
    .map(
      (p, i) => `
    <article class="pcard" style="--c1:${p.colors[0]};--c2:${p.colors[1]}">
      <div class="pcard__cover">${covers[p.cover]()}</div>
      <div class="pcard__body">
        <div class="pcard__top mono"><span>${String(i + 1).padStart(2, '0')} / ${String(featured.length).padStart(2, '0')}</span><span>${p.year}</span></div>
        <h3 class="pcard__name">${p.name}</h3>
        <p class="pcard__kind mono">${p.kind}</p>
        <p class="pcard__desc">${p.desc}</p>
        <ul class="pcard__hl">${p.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
        <div class="pcard__tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
        <div class="pcard__actions mono">${actions(p)}</div>
      </div>
    </article>`
    )
    .join('') +
    `<article class="pcard pcard--end">
      <a href="https://github.com/stemarq" target="_blank" rel="noopener" class="pcard__link" aria-label="Ver todos os projetos no GitHub"></a>
      <span class="mono">E tem mais</span>
      <h3>Ver tudo no<br/><em>GitHub ↗</em></h3>
    </article>`;
}

// Player do "Ver rodando": um só <dialog> para todos os cards
export function initVideoModal(root, dialog, { onOpen, onClose } = {}) {
  const video = dialog.querySelector('video');
  const title = dialog.querySelector('[data-video-title]');
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-video]');
    if (!btn) return;
    title.textContent = btn.dataset.title;
    video.poster = btn.dataset.poster || '';
    video.src = btn.dataset.video;
    dialog.showModal();
    onOpen?.();
    video.play().catch(() => {}); // sem autoplay permitido: fica nos controles
  });
  dialog.querySelector('[data-video-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close()); // clique fora fecha
  dialog.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.removeAttribute('poster'); video.load(); onClose?.(); });
}
