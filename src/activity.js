// Seção "Atividade": cidade 3D (CSS) com as contribuições do último ano no GitHub, carregadas ao vivo.
import gsap from 'gsap';

export const GH_USER = 'stemarq';
const CACHE = 'gh-contribs-v1';
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

let pending;
// Uma requisição só, compartilhada com os contadores do "Sobre". Cache de 1h no navegador.
export function getContributions() {
  if (pending) return pending;
  pending = (async () => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (c && Date.now() - c.t < 3600e3) return c.d;
    } catch {}
    const r = await fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw r.status;
    const j = await r.json();
    const d = { total: j.total.lastYear, days: j.contributions.map((x) => [x.date, x.count, x.level]) };
    try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), d })); } catch {}
    return d;
  })();
  pending.catch(() => (pending = null));
  return pending;
}

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${+d} ${MONTHS[+m - 1]} ${y}`;
};

function summarize(days) {
  let longest = 0, run = 0, best = days[0], active = 0;
  for (const day of days) {
    if (day[1] > 0) { active++; run++; longest = Math.max(longest, run); } else run = 0;
    if (day[1] > best[1]) best = day;
  }
  return { longest, best, active };
}

// Cores por nível (0 = sem contribuição): [r, g, b, alpha]
const LEVELS = [[242, 233, 255, 0.07], [74, 31, 122, 1], [123, 44, 191, 1], [199, 125, 255, 1], [214, 255, 61, 1]];
const rgba = ([r, g, b, a], k = 1) => `rgba(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0},${a})`;
const D2R = Math.PI / 180;
const easeOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Cidade desenhada num <canvas> 2D: projeção isométrica feita à mão, e só redesenha quando algo muda.
export function initActivity(root, { finePointer, reduced }) {
  const city = root.querySelector('.city');
  const canvas = root.querySelector('.city__canvas');
  const ctx = canvas.getContext('2d');
  const tip = root.querySelector('.city__tip');

  const view = { rz: -26, rx: 60, trz: -26, trx: 60 };
  let boxes = [], weeks = 0, grow = reduced ? 1 : 0, hover = -1;
  let W = 0, H = 0, dpr = 1, unit = 1, ox = 0, oy = 0;

  function project(x, y, z, cz, sz, cx, sx) {
    const xr = x * cz - y * sz;
    const yr = x * sz + y * cz;
    return [ox + xr * unit, oy + (yr * cx - z * sx) * unit, yr];
  }

  function resize() {
    const r = city.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    // escala que faz a grade caber com folga para os prédios mais altos
    const span = Math.hypot(weeks, 7);
    unit = Math.min((W * 0.92) / (span * 0.95), (H * 0.9) / (span * 0.5 + 9));
    ox = W / 2; oy = H * 0.62;
    draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!boxes.length) return;
    const cz = Math.cos(view.rz * D2R), sz = Math.sin(view.rz * D2R);
    const cx = Math.cos(view.rx * D2R), sx = Math.sin(view.rx * D2R);
    // faces laterais visíveis dependem do giro: frente (+y) ou fundo (-y), esquerda (-x) ou direita (+x)
    const faceY = cz > 0 ? 1 : 0;
    const faceX = sz < 0 ? 0 : 1;
    const half = [weeks / 2, 3.5];
    const S = 0.78;
    for (const b of boxes) {
      const g = reduced ? 1 : easeOut((grow * 1.6 - b.w / weeks * 0.6) * 1.7);
      const h = b.h * Math.max(g, 0);
      const x0 = b.w - half[0], y0 = b.d - half[1];
      const P = (x, y, z) => project(x, y, z, cz, sz, cx, sx);
      const t = [P(x0, y0, h), P(x0 + S, y0, h), P(x0 + S, y0 + S, h), P(x0, y0 + S, h)];
      b.depth = t[0][2] + t[2][2];
      b.faces = [t];
      if (h > 0.01) {
        const yy = faceY ? y0 + S : y0, xx = faceX ? x0 + S : x0;
        b.faces.push([P(x0, yy, 0), P(x0 + S, yy, 0), P(x0 + S, yy, h), P(x0, yy, h)]);
        b.faces.push([P(xx, y0, 0), P(xx, y0 + S, 0), P(xx, y0 + S, h), P(xx, y0, h)]);
      }
    }
    boxes.sort((a, b) => a.depth - b.depth);
    for (const b of boxes) {
      const col = b.i === hover ? [255, 255, 255, 1] : LEVELS[b.l];
      b.paths = b.faces.map((f, k) => {
        const p = new Path2D();
        p.moveTo(f[0][0], f[0][1]);
        for (let j = 1; j < 4; j++) p.lineTo(f[j][0], f[j][1]);
        p.closePath();
        ctx.fillStyle = rgba(col, k === 0 ? 1 : k === 1 ? 0.62 : 0.42);
        ctx.fill(p);
        return p;
      });
    }
  }

  // loop só roda enquanto há animação (prédios crescendo ou câmera se ajeitando)
  let running = false;
  const loop = () => {
    view.rz += (view.trz - view.rz) * 0.08;
    view.rx += (view.trx - view.rx) * 0.08;
    draw();
    if (Math.abs(view.trz - view.rz) < 0.02 && Math.abs(view.trx - view.rx) < 0.02 && !growing) {
      gsap.ticker.remove(loop);
      running = false;
    }
  };
  const wake = () => {
    if (!running) { running = true; gsap.ticker.add(loop); }
  };
  let growing = false;

  getContributions()
    .then(({ total, days }) => {
      const mobile = window.matchMedia('(max-width: 899px)').matches;
      // A semana do GitHub começa no domingo: completa o começo com dias vazios p/ alinhar as colunas.
      const firstDow = new Date(days[0][0] + 'T12:00:00').getDay();
      let cells = [...Array(firstDow).fill(null), ...days];
      if (mobile) cells = cells.slice(-7 * 22); // no celular, só os últimos ~5 meses
      const max = Math.max(1, ...days.map((d) => d[1]));
      weeks = Math.ceil(cells.length / 7);
      boxes = cells
        .map((d, i) => d && { i, w: Math.floor(i / 7), d: i % 7, l: d[2], h: d[1] ? 0.7 + Math.sqrt(d[1] / max) * 11 : 0.08, date: d[0], n: d[1] })
        .filter(Boolean);

      const s = summarize(days);
      root.querySelector('[data-a="total"]').textContent = total;
      root.querySelector('[data-a="active"]').textContent = s.active;
      root.querySelector('[data-a="streak"]').textContent = s.longest;
      root.querySelector('[data-a="best"]').textContent = s.best[1];
      root.querySelector('[data-a="bestday"]').textContent = fmtDate(s.best[0]);
      root.querySelector('[data-a="range"]').textContent = `${fmtDate(cells.find(Boolean)[0])} → ${fmtDate(days.at(-1)[0])}`;
      root.classList.add('is-ready');
      resize();

      // Prédios crescem por semana, da mais antiga para a mais recente
      if (!reduced) {
        const o = { v: 0 };
        gsap.to(o, {
          v: 1,
          duration: 2.4,
          ease: 'none',
          onStart: () => { growing = true; wake(); },
          onUpdate: () => (grow = o.v),
          onComplete: () => { grow = 1; growing = false; },
          scrollTrigger: { trigger: city, start: 'top 75%' },
        });
      }
    })
    .catch(() => root.classList.add('is-error'));

  new ResizeObserver(() => resize()).observe(city);

  // mouse: pointermove; toque: pointerdown (no celular não existe "passar por cima")
  const onPoint = (e) => {
    const r = city.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    // a dica fica sempre dentro da cidade (no celular ela escapava pela borda direita)
    const tx = Math.min(px + 16, r.width - tip.offsetWidth - 8);
    // no toque a dica vai acima do dedo, senão o próprio dedo cobre
    const above = e.pointerType !== 'mouse' || py + 16 + tip.offsetHeight > r.height;
    const ty = above ? Math.max(8, py - tip.offsetHeight - 24) : py + 16;
    tip.style.transform = `translate(${Math.max(8, tx)}px, ${ty}px)`;
    // hit test do mais da frente para o de trás
    let hit = -1;
    for (let k = boxes.length - 1; k >= 0 && hit < 0; k--) {
      if (boxes[k].paths?.some((p) => ctx.isPointInPath(p, px * dpr, py * dpr))) hit = boxes[k].i;
    }
    if (hit !== hover) {
      hover = hit;
      const b = boxes.find((x) => x.i === hit);
      if (b) tip.innerHTML = `<b>${b.n || 'Nenhuma'}</b> ${b.n === 1 ? 'contribuição' : 'contribuições'}<span>${fmtDate(b.date)}</span>`;
      tip.classList.toggle('on', !!b);
      if (!running) draw();
    }
    if (finePointer) {
      view.trz = -26 + (px / r.width - 0.5) * 20;
      view.trx = 60 - (py / r.height - 0.5) * 12;
      wake();
    }
  };
  city.addEventListener('pointermove', onPoint);
  city.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    onPoint(e);
    // repete depois do conteúdo da dica mudar, p/ posicionar com o tamanho certo
    requestAnimationFrame(() => onPoint(e));
  });
  // rolar a página com o mouse parado não dispara pointerleave: some com a dica ao rolar
  window.addEventListener('scroll', () => {
    if (hover < 0) return;
    hover = -1;
    tip.classList.remove('on');
    if (!running) draw();
  }, { passive: true });
  city.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return; // no toque, a dica fica até o próximo toque ou rolagem
    hover = -1;
    tip.classList.remove('on');
    view.trz = -26; view.trx = 60;
    wake();
  });
}
