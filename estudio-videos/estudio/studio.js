// Estúdio dos vídeos de apresentação (v2): tudo é função do tempo t (renderAt), para renderizar quadro a quadro.
// Capítulos: abertura → problema → passos (app rodando, com zoom que segue o cursor e legenda) → por dentro → números → link.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PROJECTS } from './projects.js';

const id = new URLSearchParams(location.search).get('p') || 'xepa';
const P = PROJECTS[id];
const FPS = 30;
const src = P.footage || id;
const info = await (await fetch(`./clips/${id}/info.json`)).json(); // { n: quadros }
const marks = await (await fetch(`/footage/${src}.marks.json`)).json();
const cursor = await (await fetch(`/footage/${src}.cursor.json`)).json(); // { w, h, pts: [[t, x, y, 'm'|'c']] }

// ---------- utilidades ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - x, 4);
const eio = (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2);
const expo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
const back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const $ = (s) => document.querySelector(s);
const el = (s) => $(s).style;
function set(s, o, tr) { const st = typeof s === 'string' ? el(s) : s.style; st.opacity = o; st.transform = tr || ''; st.visibility = o <= 0.001 ? 'hidden' : 'visible'; }
// "grana+1.5" → segundo da gravação a partir dos marcadores
const at = (v) => { if (typeof v === 'number') return v; const m = /^(\w+)([+-][\d.]+)?$/.exec(v); return marks[m[1]] + (m[2] ? +m[2] : 0); };

// ---------- linha do tempo ----------
const T_PROB = 4.6;
const PROB_D = P.problem.dur || 10;
const S0 = T_PROB + PROB_D;
const steps = []; let acc = S0;
for (const s of P.steps) {
  const from = at(s.from), to = at(s.to), sp = s.speed || 1;
  const d = (to - from) / sp;
  steps.push({ ...s, from, to, sp, start: acc, d }); acc += d;
}
const SE = acc;
const A0 = SE + 0.2, A_D = 9.5;
const N0 = A0 + A_D, N_D = 7;
const O0 = N0 + N_D, O_D = 5.5;
const TOTAL = O0 + O_D;
window.TOTAL = TOTAL;

// ---------- textos ----------
const root = document.documentElement.style;
root.setProperty('--a', P.accent); root.setProperty('--a2', P.accent2); root.setProperty('--base', P.base);
if (P.headFont) root.setProperty('--head', P.headFont);
$('#introKicker').textContent = `( ${P.kind} )`;
$('#introTitle').innerHTML = [...P.name].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
if (P.name.length > 9) $('#introTitle').style.fontSize = '190px';
$('#introSub').textContent = P.open;
$('#introYear').textContent = `${P.year} · por Stephany Marques`;

$('#prob').classList.add(`t-${P.theme}`);
$('#probTitle').innerHTML = `<small>${P.problem.kicker || 'O problema'}</small>${P.problem.title}`;
const CARD_POS = [[150, 330, -6], [590, 470, 4], [1030, 320, -3], [1440, 450, 6], [330, 640, 3], [1220, 640, -5]];
$('#cards').innerHTML = P.problem.cards.map((c, i) => {
  const [x, y] = CARD_POS[i];
  return `<div class="card" style="left:${x}px;top:${y}px">${c[0]}${c[1] ? `<small>${c[1]}</small>` : ''}</div>`;
}).join('');
$('#probAnswer').innerHTML = P.problem.answer;

$('#brandName').textContent = P.name;
$('#brandKind').textContent = P.kind;
$('#dots').innerHTML = steps.map(() => '<i><b></b></i>').join('');
if (P.badge) $('#badge span').textContent = P.badge; else $('#badge').style.display = 'none';

$('#archTitle span').innerHTML = P.arch.title;
$('#archRow').innerHTML = P.arch.nodes.map((n, i) => `${i ? '<div class="link"><i></i></div>' : ''}<div class="node">${n[0] ? `<em>${n[0]}</em>` : ''}<b>${n[1]}</b><span>${n[2]}</span></div>`).join('');
$('#archNote').innerHTML = P.arch.note;
$('#nums').innerHTML = P.numbers.map((n) => `<div class="num"><b data-v="${n[0]}">${n[0]}</b><span>${n[1]}</span></div>`).join('');
$('#stack').innerHTML = P.stack.map((s) => `<span>${s}</span>`).join('');
$('#outroName').textContent = P.name;
if (P.name.length > 9) $('#outroName').style.fontSize = '160px';
$('#outroLine').textContent = P.outro;
$('#outroCtaL').textContent = P.cta[0];
$('#outroCta').textContent = P.cta[1] + ' ↗';

// legenda do passo atual (troca o HTML só quando muda de passo)
let capFor = -1;
function fillCaption(i) {
  if (capFor === i) return; capFor = i;
  const s = steps[i];
  $('#capN span').textContent = `${String(i + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  $('#capT').innerHTML = s.title.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
  $('#capX').innerHTML = s.text;
}

// ---------- 3D ----------
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1920, 1080, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const FOV = 30, TAN = Math.tan((FOV / 2) * Math.PI / 180), ASP = 1920 / 1080;
const camera = new THREE.PerspectiveCamera(FOV, ASP, 0.05, 100);

const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-4, 6, 8); scene.add(key);
const rim = new THREE.PointLight(new THREE.Color(P.accent), 40, 30); rim.position.set(5, 2, -3); scene.add(rim);
const rim2 = new THREE.PointLight(new THREE.Color(P.accent2), 25, 30); rim2.position.set(-5, -3, 2); scene.add(rim2);

function roundedShape(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function slab(w, h, d, r, mat) {
  const bevel = Math.min(0.04, d / 3);
  const g = new THREE.ExtrudeGeometry(roundedShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), { depth: d - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: 24 });
  g.translate(0, 0, -(d - bevel * 2) / 2); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function screenPlane(w, h, r, mat) {
  const g = new THREE.ShapeGeometry(roundedShape(w, h, r), 24);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return new THREE.Mesh(g, mat);
}

const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x1b1824, metalness: 0.75, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
const bezelMat = new THREE.MeshStandardMaterial({ color: 0x050407, roughness: 0.4 });
const screenCanvas = document.createElement('canvas'); screenCanvas.width = P.fw; screenCanvas.height = P.fh;
const sctx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); screenTex.minFilter = THREE.LinearMipmapLinearFilter;
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });

const device = new THREE.Group(); scene.add(device);
const aspect = P.fw / P.fh;
let scr, SW, SH, lid = null;
if (P.device === 'phone') {
  SH = 3.95; SW = SH * aspect;
  device.add(slab(SW + 0.2, SH + 0.2, 0.2, 0.42, bodyMat));
  const bez = screenPlane(SW + 0.06, SH + 0.06, 0.3, bezelMat); bez.position.z = 0.101; device.add(bez);
  scr = screenPlane(SW, SH, 0.27, screenMat); scr.position.z = 0.103; device.add(scr);
  const island = screenPlane(0.5, 0.13, 0.065, bezelMat); island.position.set(0, SH / 2 - 0.14, 0.105); device.add(island);
} else if (P.device === 'tablet') {
  SW = 4.3; SH = SW / aspect;
  device.add(slab(SW + 0.32, SH + 0.32, 0.16, 0.3, bodyMat));
  const bez = screenPlane(SW + 0.12, SH + 0.12, 0.16, bezelMat); bez.position.z = 0.081; device.add(bez);
  scr = screenPlane(SW, SH, 0.08, screenMat); scr.position.z = 0.083; device.add(scr);
} else {
  SW = 4.2; SH = SW / aspect;
  lid = new THREE.Group(); device.add(lid);
  const lidBody = slab(SW + 0.24, SH + 0.3, 0.09, 0.14, bodyMat); lidBody.position.y = 0.03; lid.add(lidBody);
  const bez = screenPlane(SW + 0.16, SH + 0.24, 0.1, bezelMat); bez.position.set(0, 0.03, 0.046); lid.add(bez);
  scr = screenPlane(SW, SH, 0.03, screenMat); scr.position.set(0, 0.05, 0.048); lid.add(scr);
  lid.position.y = 0.1;
  const base = new THREE.Group(); device.add(base);
  const bW = SW + 0.4, bD = SH * 0.72;
  const baseBody = slab(bW, bD, 0.12, 0.14, bodyMat); baseBody.rotation.x = -Math.PI / 2; base.add(baseBody);
  const kb = screenPlane(bW * 0.86, bD * 0.42, 0.05, bezelMat); kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.061, -bD * 0.16); base.add(kb);
  const pad = screenPlane(bW * 0.3, bD * 0.3, 0.05, new THREE.MeshStandardMaterial({ color: 0x2a2633, roughness: 0.3, metalness: 0.6 })); pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.061, bD * 0.27); base.add(pad);
  base.position.set(0, -SH / 2 - 0.12, bD / 2 - 0.05);
}

function glowTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: glowTex(P.accent), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
glow.position.z = -2.5; scene.add(glow);

// ---------- motivo 3D de cada projeto (objetos flutuando no fundo) ----------
const physical = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c), roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1, ...o });
const MOTIFS = {
  // Xepa: caixas da despensa, moedas, livros e um cesto de roupa
  notas: () => [new THREE.BoxGeometry(0.62, 0.62, 0.62), new THREE.CylinderGeometry(0.36, 0.36, 0.09, 48), new THREE.BoxGeometry(0.75, 0.14, 0.55), new THREE.CylinderGeometry(0.34, 0.26, 0.5, 40, 1, true), new THREE.CylinderGeometry(0.36, 0.36, 0.09, 48), new THREE.SphereGeometry(0.3, 40, 24)],
  // dashGit: cartões de kanban e colunas de gráfico
  kanban: () => [new THREE.BoxGeometry(0.8, 0.5, 0.05), new THREE.BoxGeometry(0.22, 0.9, 0.22), new THREE.BoxGeometry(0.8, 0.5, 0.05), new THREE.BoxGeometry(0.22, 0.55, 0.22), new THREE.BoxGeometry(0.22, 1.2, 0.22), new THREE.BoxGeometry(0.8, 0.5, 0.05)],
  // GItIA: folhas de anotação e cartões de issue
  terminal: () => [new THREE.BoxGeometry(0.7, 0.9, 0.03), new THREE.TorusGeometry(0.36, 0.12, 24, 80), new THREE.BoxGeometry(0.9, 0.55, 0.05), new THREE.OctahedronGeometry(0.34, 0), new THREE.BoxGeometry(0.7, 0.9, 0.03), new THREE.BoxGeometry(0.9, 0.55, 0.05)],
  // Cielo: blocos de pixel
  pixel: () => [new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.BoxGeometry(0.52, 0.52, 0.52), new THREE.BoxGeometry(0.26, 0.26, 0.26), new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.BoxGeometry(0.34, 0.34, 0.34)],
  // Dudy: bolas e balões
  bolhas: () => [new THREE.SphereGeometry(0.38, 48, 32), new THREE.CapsuleGeometry(0.2, 0.45, 8, 24), new THREE.SphereGeometry(0.26, 48, 32), new THREE.TorusGeometry(0.32, 0.14, 24, 64), new THREE.SphereGeometry(0.32, 48, 32), new THREE.IcosahedronGeometry(0.36, 1)],
  // GeneTools: moléculas
  papel: () => [new THREE.SphereGeometry(0.28, 40, 24), new THREE.IcosahedronGeometry(0.34, 0), new THREE.SphereGeometry(0.2, 40, 24), new THREE.TorusKnotGeometry(0.28, 0.09, 160, 24), new THREE.SphereGeometry(0.3, 40, 24), new THREE.OctahedronGeometry(0.3, 0)],
};
const geos = MOTIFS[P.theme]();
const mats = [P.accent, P.accent2, '#f4efff', P.accent].map((c) => physical(c, P.theme === 'pixel' ? { roughness: 0.6, clearcoat: 0 } : {}));
// longe do centro de cima, onde ficam os títulos
const spots = [[-6.4, -0.9, -2.4], [4.9, 2.2, -2.2], [-4.4, -2.3, -0.8], [4.5, -2.1, -1], [5.8, 0.2, -3.5], [-1.3, -2.6, -2.5], [1.2, -2.8, -2.5], [-6.2, 0.1, -3]];
const shapes = spots.map((p, i) => {
  const m = new THREE.Mesh(geos[i % geos.length], mats[i % mats.length]);
  m.userData = { base: new THREE.Vector3(...p), sp: 0.3 + (i % 3) * 0.17, ph: i * 1.7, s: 0.7 + ((i * 37) % 5) / 10 };
  scene.add(m); return m;
});
// GeneTools ganha uma dupla hélice grande ao fundo
let helix = null;
if (P.theme === 'papel') {
  helix = new THREE.Group(); scene.add(helix);
  const sg = new THREE.SphereGeometry(0.09, 20, 14), rg = new THREE.CylinderGeometry(0.025, 0.025, 1, 10);
  for (let i = 0; i < 40; i++) {
    const a = i * 0.42, y = (i - 20) * 0.2;
    const p1 = new THREE.Vector3(Math.cos(a) * 0.6, y, Math.sin(a) * 0.6), p2 = p1.clone().multiply(new THREE.Vector3(-1, 1, -1));
    const s1 = new THREE.Mesh(sg, mats[0]); s1.position.copy(p1); helix.add(s1);
    const s2 = new THREE.Mesh(sg, mats[1]); s2.position.copy(p2); helix.add(s2);
    const r = new THREE.Mesh(rg, mats[2]); r.position.set(0, y, 0); r.scale.y = 1.2; r.rotation.set(0, -a, Math.PI / 2); helix.add(r);
  }
  helix.position.set(-7.2, 0, -4); helix.rotation.z = 0.3;
}

const N = 240, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3), seeds = [];
for (let i = 0; i < N; i++) seeds.push([Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.1 % 1, Math.sin(i * 39.425) * 3758.3 % 1].map(Math.abs));
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: new THREE.Color(P.accent), size: 0.028, transparent: true, opacity: 0.7, depthWrite: false }));
scene.add(points);

// ---------- cursor suavizado (para onde o zoom olha) ----------
const pts = cursor.pts;
const NF = info.n;
function rawCursor(ft) {
  if (!pts.length) return [cursor.w / 2, cursor.h / 2];
  if (ft <= pts[0][0]) return [pts[0][1], pts[0][2]];
  for (let i = 1; i < pts.length; i++) {
    if (ft <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; const k = (ft - a[0]) / Math.max(1e-3, b[0] - a[0]); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  }
  const l = pts[pts.length - 1]; return [l[1], l[2]];
}
// suavização de fase zero: média de uma passada para frente e outra para trás
const smooth = (() => {
  const raw = Array.from({ length: NF }, (_, i) => rawCursor(i / FPS));
  const f = raw.map((p) => [...p]), b = raw.map((p) => [...p]); const k = 0.07;
  for (let i = 1; i < NF; i++) for (const j of [0, 1]) f[i][j] = f[i - 1][j] + (raw[i][j] - f[i - 1][j]) * k;
  for (let i = NF - 2; i >= 0; i--) for (const j of [0, 1]) b[i][j] = b[i + 1][j] + (raw[i][j] - b[i + 1][j]) * k;
  return raw.map((_, i) => [(f[i][0] + b[i][0]) / 2, (f[i][1] + b[i][1]) / 2]);
})();
const clicks = pts.filter((p) => p[3] === 'c');

// ---------- quadros da gravação ----------
const cache = new Map();
async function img(n) {
  n = clamp(n, 1, NF);
  if (cache.has(n)) return cache.get(n);
  const im = new Image(); im.src = `./clips/${id}/f/${String(n).padStart(5, '0')}.jpg`; await im.decode();
  cache.set(n, im); if (cache.size > 8) cache.delete(cache.keys().next().value);
  return im;
}
let lastFrame = -1;
async function drawScreen(ft) {
  const n = Math.floor(ft * FPS) + 1;
  const kx = P.fw / cursor.w, ky = P.fh / cursor.h;
  const hasRipple = clicks.some((c) => ft - c[0] >= 0 && ft - c[0] < 0.7);
  if (n === lastFrame && !hasRipple) return;
  lastFrame = n;
  sctx.drawImage(await img(n), 0, 0, P.fw, P.fh);
  // onda no ponto do clique
  for (const c of clicks) {
    const d = ft - c[0]; if (d < 0 || d >= 0.7) continue;
    const p = d / 0.7, r = (14 + 46 * eo(p)) * kx;
    sctx.lineWidth = 5 * kx * (1 - p) + 1; sctx.strokeStyle = P.accent; sctx.globalAlpha = 1 - p;
    sctx.beginPath(); sctx.arc(c[1] * kx, c[2] * ky, r, 0, Math.PI * 2); sctx.stroke();
    sctx.globalAlpha = 1;
  }
  screenTex.needsUpdate = true;
}

// ---------- câmera ----------
// a área à direita da legenda (61% da largura, 86% da altura) é onde o aparelho aparece
const WIN_W = 0.6, WIN_H = 0.86, WIN_SHIFT = 300;
const D0 = Math.max(SH / (WIN_H * 2 * TAN), SW / (WIN_W * 2 * TAN * ASP)) * 1.04;
const v3 = new THREE.Vector3(), camPos = new THREE.Vector3(), lookAt = new THREE.Vector3();
function stepCamera(z, cx, cy, out) {
  const dist = D0 / z;
  const wh = WIN_H * 2 * dist * TAN, ww = WIN_W * 2 * dist * TAN * ASP;
  let lx = (cx / cursor.w - 0.5) * SW, ly = (0.5 - cy / cursor.h) * SH;
  lx = ww >= SW ? 0 : clamp(lx, -SW / 2 + ww / 2, SW / 2 - ww / 2);
  ly = wh >= SH ? 0 : clamp(ly, -SH / 2 + wh / 2, SH / 2 - wh / 2);
  v3.set(lx, ly, 0); scr.localToWorld(v3);
  out.look.copy(v3); out.pos.set(v3.x, v3.y, v3.z + dist);
}
const stepCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

window.renderAt = async (t) => {
  el('#grid').transform = `perspective(900px) rotateX(62deg) translateY(${(t * 40) % 80}px)`;
  el('#stage').opacity = Math.min(prog(t, 0, 0.3), 1 - prog(t, TOTAL - 0.4, TOTAL));

  // ---- abertura ----
  const outI = eio(prog(t, 3.9, 4.6));
  set('#intro', 1 - outI, `translateY(${-outI * 120}px) scale(${1 - outI * 0.2})`);
  set('#introKicker', eo(prog(t, 0.1, 0.7)), `translateY(${(1 - eo(prog(t, 0.1, 0.7))) * 20}px)`);
  [...$('#introTitle').children].forEach((s, i) => {
    const p = expo(prog(t, 0.2 + i * 0.05, 1.1 + i * 0.05));
    s.style.transform = `translateY(${(1 - p) * 70}%) rotateX(${(1 - p) * -95}deg)`; s.style.opacity = p;
  });
  set('#introSub', eo(prog(t, 1.3, 2.0)), `translateY(${(1 - eo(prog(t, 1.3, 2.0))) * 30}px)`);
  set('#introYear', eo(prog(t, 1.8, 2.4)));

  // ---- problema ----
  const pe = S0; // fim do capítulo
  const pIn = prog(t, T_PROB, T_PROB + 0.2), pOut = eio(prog(t, pe - 0.8, pe));
  set('#prob', pIn > 0 && pOut < 1 ? 1 : 0);
  const pt = eo(prog(t, T_PROB + 0.2, T_PROB + 0.9));
  set('#probTitle', pt * (1 - eio(prog(t, pe - 3.6, pe - 3.0))), `translateY(${(1 - pt) * 40}px)`);
  const cards = [...$('#cards').children];
  const flyA = pe - 2.4, flyB = pe - 1.3;
  cards.forEach((c, i) => {
    const [x, y, r] = CARD_POS[i];
    const t0 = T_PROB + 1.0 + i * ((PROB_D - 5.2) / cards.length);
    const p = back(clamp(prog(t, t0, t0 + 0.55)));
    const dim = 1 - 0.8 * eio(prog(t, pe - 3.6, pe - 3.0));
    const fly = eio(prog(t, flyA + i * 0.08, flyB + i * 0.08));
    // os cartões voam para dentro da tela do aparelho
    const tx = (1260 - (x + 200)) * fly, ty = (540 - (y + 90)) * fly;
    c.style.opacity = clamp(prog(t, t0, t0 + 0.25)) * dim * (1 - prog(t, flyB - 0.3 + i * 0.08, flyB + i * 0.08));
    c.style.transform = `translate(${tx}px, ${ty}px) rotate(${r * (1 - fly) + (1 - p) * 20}deg) scale(${(0.3 + 0.7 * p) * (1 - fly * 0.8)})`;
  });
  const ans = eo(prog(t, pe - 3.4, pe - 2.8)) * (1 - eio(prog(t, pe - 1.0, pe - 0.4)));
  set('#probAnswer', ans, `translateY(${(1 - ans) * 30 - 380 * eio(prog(t, pe - 3.0, pe - 2.3))}px) scale(${1 + 0.15 * eio(prog(t, pe - 3.0, pe - 2.3))})`);

  // ---- passos ----
  let si = steps.findIndex((s) => t < s.start + s.d); if (si < 0) si = steps.length - 1;
  const st = steps[si]; const lt = t - st.start;
  fillCaption(si);
  const inSteps = t >= S0 - 0.6 && t < SE + 0.6;
  const capIn = eo(prog(lt, 0.15, 0.7)), capOut = eio(prog(lt, st.d - 0.45, st.d - 0.05));
  const capVis = inSteps ? capIn * (si === steps.length - 1 ? 1 - eio(prog(t, SE - 0.45, SE)) : 1 - capOut) : 0;
  set('#cap', inSteps ? 1 : 0);
  el('#capN').opacity = capVis;
  [...$('#capT').querySelectorAll('.w span')].forEach((w, i) => {
    const p = expo(prog(lt, 0.15 + i * 0.05, 0.8 + i * 0.05));
    w.style.transform = `translateY(${(1 - p) * 110 + capOut * -110}%)`;
  });
  el('#capT').opacity = inSteps ? (si === steps.length - 1 ? 1 - prog(t, SE - 0.4, SE) : 1) : 0;
  set('#capX', clamp(prog(lt, 0.5, 1.0)) * (1 - capOut) * (inSteps ? 1 : 0) * (si === steps.length - 1 ? 1 - prog(t, SE - 0.4, SE) : 1), `translateY(${(1 - eo(prog(lt, 0.5, 1.1))) * 26}px)`);
  const chrome = eo(prog(t, S0 - 0.4, S0 + 0.4)) * (1 - eio(prog(t, SE - 0.3, SE + 0.3)));
  set('#capPanel', P.device === 'phone' ? 0 : chrome);
  set('#brand', chrome, `translateY(${(1 - chrome) * -20}px)`);
  set('#dots', chrome);
  [...$('#dots').children].forEach((d, i) => { const s = steps[i]; d.firstChild.style.transform = `scaleX(${prog(t, s.start, s.start + s.d)})`; });
  if (P.badge) { set('#badge', chrome); const bs = el('#badge'); bs.right = '60px'; bs.top = '1010px'; }

  // ---- por dentro ----
  const aIn = prog(t, A0, A0 + 0.3), aOut = eio(prog(t, A0 + A_D - 0.6, A0 + A_D));
  set('#arch', aIn > 0 && aOut < 1 ? 1 - aOut : 0, `translateY(${-aOut * 40}px)`);
  const at1 = eo(prog(t, A0 + 0.2, A0 + 0.9));
  set('#archTitle', at1, `translateY(${(1 - at1) * 40}px)`);
  const nodes = [...$('#archRow').querySelectorAll('.node')], links = [...$('#archRow').querySelectorAll('.link')];
  const nodeGap = Math.min(0.9, 4.2 / nodes.length);
  nodes.forEach((n, i) => {
    const t0 = A0 + 0.9 + i * nodeGap; const p = back(clamp(prog(t, t0, t0 + 0.6)));
    n.style.opacity = clamp(prog(t, t0, t0 + 0.3));
    n.style.transform = `translateY(${(1 - p) * 80}px) rotateY(${(1 - p) * -40}deg)`;
    const lit = t > t0 + 0.4 ? 1 : 0;
    n.style.borderColor = lit ? `color-mix(in srgb, ${P.accent} ${40 + 40 * Math.max(0, Math.sin((t - t0) * 2.2 - i))}%, transparent)` : '';
  });
  links.forEach((l, i) => {
    const t0 = A0 + 0.9 + (i + 1) * nodeGap - 0.3;
    l.style.opacity = clamp(prog(t, t0, t0 + 0.3));
    l.style.setProperty('--off', `${(t * 40) % 20}px`);
    l.firstChild.style.left = `${((t - t0) * 70) % 100}%`;
  });
  set('#archNote', eo(prog(t, A0 + 1.2 + nodes.length * nodeGap, A0 + 1.8 + nodes.length * nodeGap)));

  // ---- números + tecnologias ----
  const nIn = prog(t, N0, N0 + 0.3), nOut = eio(prog(t, N0 + N_D - 0.5, N0 + N_D));
  [...$('#nums').children].forEach((n, i) => {
    const t0 = N0 + 0.2 + i * 0.35; const p = back(clamp(prog(t, t0, t0 + 0.6)));
    n.style.opacity = clamp(prog(t, t0, t0 + 0.3)); n.style.transform = `translateY(${(1 - p) * 60}px) scale(${0.85 + 0.15 * p})`;
    const b = n.firstChild; const raw = b.dataset.v; const m = /^(\d+)(.*)$/.exec(raw);
    if (m) b.textContent = Math.round(+m[1] * eo(prog(t, t0, t0 + 1.4))) + m[2];
  });
  set('#nums', nIn > 0 ? 1 - nOut : 0, `translateY(${-nOut * 40}px)`);
  const sIn = prog(t, N0 + 1.4, N0 + 2.0);
  set('#stackWrap', (sIn > 0 ? 1 : 0) * (1 - nOut), `translateY(${-nOut * 40}px)`);
  el('#stackTitle').opacity = eo(sIn);
  [...$('#stack').children].forEach((s, i) => {
    const t0 = N0 + 1.6 + i * 0.1; const p = back(clamp(prog(t, t0, t0 + 0.6)));
    s.style.opacity = clamp(prog(t, t0, t0 + 0.3));
    s.style.transform = `translateY(${(1 - p) * 60}px) rotateX(${(1 - p) * -80}deg)`;
  });

  // ---- encerramento ----
  const oIn = expo(prog(t, O0 + 0.1, O0 + 1.0));
  set('#outro', prog(t, O0, O0 + 0.3));
  el('#outroName').transform = `translateY(${(1 - oIn) * 80}px) scale(${0.9 + oIn * 0.1})`; el('#outroName').opacity = oIn;
  set('#outroLine', clamp(prog(t, O0 + 0.5, O0 + 1.0)), `translateY(${(1 - eo(prog(t, O0 + 0.5, O0 + 1.1))) * 24}px)`);
  const c2 = back(clamp(prog(t, O0 + 0.8, O0 + 1.5)));
  el('#outroCtaL').opacity = clamp(prog(t, O0 + 0.7, O0 + 1.2));
  el('#outroCta').transform = `scale(${c2})`; el('#outroCta').opacity = clamp(prog(t, O0 + 0.8, O0 + 1.1));
  el('#outroBy').opacity = clamp(prog(t, O0 + 1.3, O0 + 1.8)); el('#outroBy').transform = `translateY(${(1 - eo(prog(t, O0 + 1.3, O0 + 1.9))) * 30}px)`;

  // ---------- 3D ----------
  // aparelho: entra no fim do problema, fica de frente nos passos e sai antes do "por dentro"
  const devIn = eio(prog(t, S0 - 2.4, S0 - 0.6));
  const devOut = eio(prog(t, SE - 0.2, SE + 1.0));
  const sway = Math.sin(t * 0.5) * 0.035;
  device.position.set(0, lerp(-7, 0, devIn) + devOut * 3.5, lerp(-4, 0, devIn) - devOut * 10);
  device.rotation.set(lerp(0.5, 0.02, devIn) + devOut * 0.3, lerp(-1.2, -0.07 + sway, devIn) + devOut * 1.6, lerp(0.3, 0, devIn));
  if (lid) lid.rotation.x = -0.05;
  device.visible = devIn > 0.001 && devOut < 0.999;
  device.updateMatrixWorld(true);

  // câmera: geral (abertura, problema, por dentro…) ↔ câmera dos passos (zoom no ponto da ação)
  const genPos = new THREE.Vector3(Math.sin(t * 0.21) * 0.3, 0.5 + Math.sin(t * 0.17) * 0.1, 11.5);
  const kS = eio(prog(t, S0 - 1.4, S0 + 0.2)) * (1 - eio(prog(t, SE - 0.2, SE + 0.9)));
  let ft = st.from;
  if (inSteps) ft = clamp(st.from + clamp(lt, 0, st.d) * st.sp, 0, (NF - 1) / FPS);
  const fi = clamp(Math.floor(ft * FPS), 0, NF - 1);
  let [cx, cy] = smooth[fi];
  if (st.focus) { const k = eio(prog(lt, 0, 0.6)); cx = lerp(cx, st.focus[0], k); cy = lerp(cy, st.focus[1], k); }
  const zIn = eio(prog(lt, 0.55, 1.6)), zOut = eio(prog(lt, st.d - 0.9, st.d - 0.05));
  const z = 1 + ((st.zoom || P.zoom || 1.6) - 1) * zIn * (si === steps.length - 1 ? 1 : 1 - zOut);
  stepCamera(z, cx, cy, stepCam);
  camPos.copy(genPos).lerp(stepCam.pos, kS);
  lookAt.set(0, 0, 0).lerp(stepCam.look, kS);
  camera.position.copy(camPos); camera.lookAt(lookAt);
  camera.setViewOffset(1920, 1080, -WIN_SHIFT * kS, 0, 1920, 1080);
  glow.position.set(device.position.x, device.position.y, -2.5); glow.material.opacity = 0.3 * devIn * (1 - devOut) + 0.15 * prog(t, O0, O0 + 1);

  // no diagrama e nos números as formas se afastam para as bordas
  const spread = 1 + 0.7 * eio(prog(t, A0 - 0.5, A0 + 0.5)) * (1 - eio(prog(t, O0 - 0.3, O0 + 0.7)));
  shapes.forEach((m, i) => {
    const u = m.userData; const enter = eo(prog(t, 0.1 + i * 0.12, 1.6 + i * 0.12));
    m.position.set(u.base.x * spread + Math.sin(t * u.sp + u.ph) * 0.25, u.base.y + Math.cos(t * u.sp * 0.8 + u.ph) * 0.2 + (1 - enter) * -3, u.base.z);
    m.rotation.set(t * u.sp * 0.7 + u.ph, t * u.sp + u.ph, 0);
    m.scale.setScalar(u.s * enter * (1 - kS)); // somem nos passos: o foco é o app
  });
  // a hélice fica só na abertura e no encerramento, longe dos textos
  if (helix) { helix.rotation.y = t * 0.35; helix.scale.setScalar(Math.max(1e-3, (1 - eio(prog(t, T_PROB - 0.6, T_PROB + 0.4))) + eio(prog(t, O0, O0 + 0.8)))); }
  for (let i = 0; i < N; i++) {
    const s = seeds[i];
    pp[i * 3] = (s[0] - 0.5) * 14 + Math.sin(t * 0.2 + i) * 0.2;
    pp[i * 3 + 1] = ((s[1] * 8 + t * (0.08 + s[2] * 0.12)) % 8) - 4;
    pp[i * 3 + 2] = -1 - s[2] * 6;
  }
  pg.attributes.position.needsUpdate = true;

  if (device.visible) await drawScreen(ft);
  renderer.render(scene, camera);
  return true;
};

await document.fonts.ready;
await img(1);
window.ready = true;
