// Estúdio dos vídeos de apresentação: tudo é função do tempo t (renderAt), para renderizar quadro a quadro.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PROJECTS } from './projects.js';

const id = new URLSearchParams(location.search).get('p') || 'xepa';
const P = PROJECTS[id];
const FPS = 30;
const counts = await (await fetch(`./clips/${id}/counts.json`)).json();

// ---------- linha do tempo ----------
const D = counts.reduce((a, n) => a + n, 0) / FPS; // duração da demo = soma dos trechos
const DS = 5.0; // início da demo
const DE = DS + D; // fim da demo
const ST = DE; // "feito com"
const OT = DE + 3.6; // encerramento
const TOTAL = OT + 3.9;
window.TOTAL = TOTAL;

// ---------- utilidades ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - x, 4); // ease out
const eio = (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2);
const expo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
const back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const $ = (s) => document.querySelector(s);

// ---------- textos ----------
const root = document.documentElement.style;
root.setProperty('--a', P.accent); root.setProperty('--a2', P.accent2); root.setProperty('--base', P.base);
$('#introKicker').textContent = `( ${P.kind} )`;
$('#introTitle').innerHTML = [...P.name].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
$('#introYear').textContent = `${P.year} · por Stephany Marques`;
if (P.name.length > 9) $('#introTitle').style.fontSize = '190px';
$('#headName').textContent = P.name;
$('#headKind').textContent = P.kind;
$('#tagline').innerHTML = P.tagline.map((l) => `<span class="l"><span>${l}</span></span>`).join('');
$('#callouts').innerHTML = P.callouts.map((c, i) => `<div class="co"><b>0${i + 1}</b><span>${c}</span></div>`).join('');
$('#stack').innerHTML = P.stack.map((s) => `<span>${s}</span>`).join('');
$('#outroName').textContent = P.name;
if (P.name.length > 9) $('#outroName').style.fontSize = '160px';
$('#outroCtaL').textContent = P.cta[0];
$('#outroCta').textContent = P.cta[1] + ' ↗';
if (P.badge) $('#badge span').textContent = P.badge; else $('#badge').style.display = 'none';

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
const camera = new THREE.PerspectiveCamera(30, 1920 / 1080, 0.1, 100);

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
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });

const device = new THREE.Group(); scene.add(device);
const aspect = P.fw / P.fh;
let devX = 2.0, devY = -0.05;
if (P.device === 'phone') {
  const H = 3.95, W = H * aspect;
  device.add(slab(W + 0.2, H + 0.2, 0.2, 0.42, bodyMat));
  const bez = screenPlane(W + 0.06, H + 0.06, 0.3, bezelMat); bez.position.z = 0.101; device.add(bez);
  const scr = screenPlane(W, H, 0.27, screenMat); scr.position.z = 0.103; device.add(scr);
  const island = screenPlane(0.5, 0.13, 0.065, bezelMat); island.position.set(0, H / 2 - 0.14, 0.105); device.add(island);
  devX = 2.15;
} else if (P.device === 'tablet') {
  const W = 4.3, H = W / aspect;
  device.add(slab(W + 0.32, H + 0.32, 0.16, 0.3, bodyMat));
  const bez = screenPlane(W + 0.12, H + 0.12, 0.16, bezelMat); bez.position.z = 0.081; device.add(bez);
  const scr = screenPlane(W, H, 0.08, screenMat); scr.position.z = 0.083; device.add(scr);
  devX = 1.95;
} else {
  // notebook: tampa (tela) + base com teclado
  const W = 4.2, H = W / aspect;
  const lid = new THREE.Group(); device.add(lid);
  const lidBody = slab(W + 0.24, H + 0.3, 0.09, 0.14, bodyMat); lidBody.position.y = 0.03; lid.add(lidBody);
  const bez = screenPlane(W + 0.16, H + 0.24, 0.1, bezelMat); bez.position.set(0, 0.03, 0.046); lid.add(bez);
  const scr = screenPlane(W, H, 0.03, screenMat); scr.position.set(0, 0.05, 0.048); lid.add(scr);
  lid.position.y = 0.1;
  const base = new THREE.Group(); device.add(base);
  const bW = W + 0.4, bD = H * 0.72;
  const baseBody = slab(bW, bD, 0.12, 0.14, bodyMat); baseBody.rotation.x = -Math.PI / 2; base.add(baseBody);
  const kb = screenPlane(bW * 0.86, bD * 0.42, 0.05, bezelMat); kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.061, -bD * 0.16); base.add(kb);
  const pad = screenPlane(bW * 0.3, bD * 0.3, 0.05, new THREE.MeshStandardMaterial({ color: 0x2a2633, roughness: 0.3, metalness: 0.6 })); pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.061, bD * 0.27); base.add(pad);
  base.position.set(0, -H / 2 - 0.12, bD / 2 - 0.05);
  lid.rotation.x = -0.12;
  devX = 1.92;
}

// brilho atrás do aparelho
function glowTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex(P.accent), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
glow.position.z = -2.5; scene.add(glow);

// formas flutuantes
const shapes = [];
const mats = [P.accent, P.accent2, '#f4efff', P.accent].map((c) => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c), roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }));
const geos = [new THREE.TorusGeometry(0.42, 0.16, 32, 96), new THREE.IcosahedronGeometry(0.42, 0), new THREE.SphereGeometry(0.3, 48, 32), new THREE.TorusKnotGeometry(0.3, 0.1, 160, 24), new THREE.CapsuleGeometry(0.18, 0.5, 8, 24), new THREE.OctahedronGeometry(0.34, 0)];
// longe da coluna de textos (esquerda): cantos, topo e base
const spots = [[-0.6, 2.35, -1.8], [4.3, 2.0, -2.2], [-4.2, -2.35, -0.8], [4.4, -2.0, -1], [0.9, 2.6, -3.5], [-1.2, -2.55, -2.5], [1.0, -2.75, -2.5]];
spots.forEach((p, i) => {
  const m = new THREE.Mesh(geos[i % geos.length], mats[i % mats.length]);
  m.userData = { base: new THREE.Vector3(...p), sp: 0.3 + (i % 3) * 0.17, ph: i * 1.7, s: 0.7 + ((i * 37) % 5) / 10 };
  scene.add(m); shapes.push(m);
});

// partículas
const N = 260, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3), seeds = [];
for (let i = 0; i < N; i++) { const s = [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.1 % 1, Math.sin(i * 39.425) * 3758.3 % 1].map(Math.abs); seeds.push(s); }
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: new THREE.Color(P.accent), size: 0.028, transparent: true, opacity: 0.7, depthWrite: false }));
scene.add(points);

// ---------- quadros da gravação ----------
const cache = new Map();
function frameUrl(k, n) { return `./clips/${id}/${k}/${String(n).padStart(5, '0')}.jpg`; }
async function img(url) {
  if (cache.has(url)) return cache.get(url);
  const im = new Image(); im.src = url; await im.decode();
  cache.set(url, im); if (cache.size > 12) cache.delete(cache.keys().next().value);
  return im;
}
async function drawScreen(t) {
  const tt = clamp(t - DS, 0, D - 1 / FPS);
  let f = Math.floor(tt * FPS), k = 0;
  while (k < counts.length - 1 && f >= counts[k]) { f -= counts[k]; k++; }
  f = Math.min(f, counts[k] - 1);
  const cur = await img(frameUrl(k, f + 1));
  sctx.globalAlpha = 1; sctx.drawImage(cur, 0, 0, P.fw, P.fh);
  // transição entre trechos: o anterior some em 8 quadros
  if (k > 0 && f < 8 && t > DS) { const prev = await img(frameUrl(k - 1, counts[k - 1])); sctx.globalAlpha = 1 - f / 8; sctx.drawImage(prev, 0, 0, P.fw, P.fh); sctx.globalAlpha = 1; }
  screenTex.needsUpdate = true;
}

// ---------- cena por tempo ----------
const el = (s) => $(s).style;
function set(s, o, tr) { const st = el(s); st.opacity = o; st.transform = tr || ''; st.visibility = o <= 0.001 ? 'hidden' : 'visible'; }

window.renderAt = async (t) => {
  // fundo
  el('#grid').transform = `perspective(900px) rotateX(62deg) translateY(${(t * 40) % 80}px)`;
  el('#stage').opacity = 1 - prog(t, TOTAL - 0.35, TOTAL);

  // intro
  const outI = eio(prog(t, 2.7, 3.4));
  set('#intro', 1 - outI, `translateY(${-outI * 120}px) scale(${1 - outI * 0.25})`);
  set('#introKicker', eo(prog(t, 0.1, 0.7)), `translateY(${(1 - eo(prog(t, 0.1, 0.7))) * 20}px)`);
  [...$('#introTitle').children].forEach((s, i) => {
    const p = expo(prog(t, 0.2 + i * 0.05, 1.1 + i * 0.05));
    s.style.transform = `translateY(${(1 - p) * 70}%) rotateX(${(1 - p) * -95}deg)`; s.style.opacity = p;
  });
  set('#introYear', eo(prog(t, 1.0, 1.6)));

  // cabeçalho, frase e destaques
  const outD = eio(prog(t, DE - 0.3, DE + 0.3));
  const hIn = eo(prog(t, 3.2, 3.9));
  set('#head', hIn * (1 - outD), `translateX(${(1 - hIn) * -80 - outD * 60}px)`);
  const tagLines = $('#tagline').querySelectorAll('.l span');
  tagLines.forEach((s, i) => { const p = expo(prog(t, 3.5 + i * 0.18, 4.4 + i * 0.18)); s.style.transform = `translateY(${(1 - p) * 110}%)`; });
  set('#tagline', 1 - outD, `translateX(${-outD * 60}px)`);
  const cos = $('#callouts').children; const gap = (D - 2.2) / 3;
  [...cos].forEach((c, i) => {
    const t0 = DS + 0.9 + i * gap; const p = back(clamp(prog(t, t0, t0 + 0.7)));
    c.style.opacity = clamp(prog(t, t0, t0 + 0.4)) * (1 - outD);
    c.style.transform = `perspective(900px) translateX(${(1 - p) * -70}px) rotateY(${(1 - p) * 35}deg)`;
    c.classList.toggle('on', t >= t0 && (i === cos.length - 1 || t < DS + 0.9 + (i + 1) * gap));
  });
  set('#callouts', 1);
  if (P.badge) {
    const b = eo(prog(t, DS + 0.5, DS + 1.1)) * (1 - outD);
    set('#badge', b); const bs = el('#badge'); bs.left = (P.device === 'phone' ? 1335 : 1265) + 'px'; bs.top = '1000px';
  }

  // feito com
  const sIn = prog(t, ST + 0.1, ST + 0.8), sOut = eio(prog(t, OT - 0.3, OT + 0.2));
  set('#stackWrap', (sIn > 0 ? 1 : 0) * (1 - sOut), `translateY(${-sOut * 40}px)`);
  el('#stackTitle').opacity = eo(sIn);
  [...$('#stack').children].forEach((s, i) => {
    const p = back(clamp(prog(t, ST + 0.3 + i * 0.09, ST + 0.95 + i * 0.09)));
    s.style.opacity = clamp(prog(t, ST + 0.3 + i * 0.09, ST + 0.6 + i * 0.09));
    s.style.transform = `translateY(${(1 - p) * 60}px) rotateX(${(1 - p) * -80}deg)`;
  });

  // encerramento
  const oIn = expo(prog(t, OT + 0.1, OT + 1.0));
  set('#outro', prog(t, OT, OT + 0.3), '');
  el('#outroName').transform = `translateY(${(1 - oIn) * 80}px) scale(${0.9 + oIn * 0.1})`; el('#outroName').opacity = oIn;
  const c2 = back(clamp(prog(t, OT + 0.5, OT + 1.2)));
  el('#outroCtaL').opacity = clamp(prog(t, OT + 0.4, OT + 0.9));
  el('#outroCta').transform = `scale(${c2})`; el('#outroCta').opacity = clamp(prog(t, OT + 0.5, OT + 0.8));
  el('#outroBy').opacity = clamp(prog(t, OT + 1.0, OT + 1.5)); el('#outroBy').transform = `translateY(${(1 - eo(prog(t, OT + 1.0, OT + 1.6))) * 30}px)`;

  // ---------- 3D ----------
  camera.position.set(Math.sin(t * 0.21) * 0.25, 0.75 + Math.sin(t * 0.17) * 0.08, 10.5 - eio(prog(t, 0, TOTAL)) * 0.8);
  camera.lookAt(0, 0, 0);

  // aparelho: entra voando, flutua durante a demo, sobe no "feito com" e sai no fim
  const inP = eio(prog(t, 2.9, 4.9));
  const sway = Math.sin(t * 0.55) * 0.06;
  let x = lerp(devX + 5, devX, inP), y = lerp(devY - 3.2, devY, inP), z = lerp(-7, 0, inP);
  let ry = lerp(1.6, -0.3 + sway, inP), rx = lerp(0.6, 0.04 + Math.sin(t * 0.4) * 0.025, inP), rz = lerp(-0.4, 0, inP), sc = 1;
  const toStack = eio(prog(t, ST - 0.2, ST + 0.9));
  x = lerp(x, 0, toStack); y = lerp(y, 1.05, toStack); z = lerp(z, -1.2, toStack); sc = lerp(sc, P.device === 'phone' ? 0.62 : 0.6, toStack);
  ry = lerp(ry, Math.sin((t - ST) * 0.9) * 0.35 * toStack, toStack); rx = lerp(rx, 0.12, toStack);
  const out = eio(prog(t, OT - 0.25, OT + 0.7));
  z = lerp(z, -9, out); y = lerp(y, 2.6, out); ry += out * 2.2;
  device.position.set(x, y + Math.sin(t * 1.1) * 0.04, z); device.rotation.set(rx, ry, rz); device.scale.setScalar(sc);
  device.visible = t > 2.85 && out < 0.999;
  glow.position.set(x * 0.9, y, -2.5); glow.material.opacity = 0.32 * inP * (1 - out) + 0.18 * prog(t, OT, OT + 1);

  shapes.forEach((m, i) => {
    const u = m.userData; const enter = eo(prog(t, 0.1 + i * 0.12, 1.6 + i * 0.12));
    m.position.set(u.base.x + Math.sin(t * u.sp + u.ph) * 0.25, u.base.y + Math.cos(t * u.sp * 0.8 + u.ph) * 0.2 + (1 - enter) * -3, u.base.z);
    m.rotation.set(t * u.sp * 0.7 + u.ph, t * u.sp + u.ph, 0);
    m.scale.setScalar(u.s * enter);
  });
  for (let i = 0; i < N; i++) {
    const s = seeds[i];
    pp[i * 3] = (s[0] - 0.5) * 14 + Math.sin(t * 0.2 + i) * 0.2;
    pp[i * 3 + 1] = ((s[1] * 8 + t * (0.08 + s[2] * 0.12)) % 8) - 4;
    pp[i * 3 + 2] = -1 - s[2] * 6;
  }
  pg.attributes.position.needsUpdate = true;

  await drawScreen(t);
  renderer.render(scene, camera);
  return true;
};

await document.fonts.ready;
await img(frameUrl(0, 1));
window.ready = true;
