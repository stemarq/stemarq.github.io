import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initScene } from './scene.js';
import { initSphere } from './sphere.js';
import { renderFeatured } from './projects.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

renderFeatured(document.getElementById('projectsTrack'));

/* ---------- Smooth scroll ---------- */
const lenis = new Lenis({ lerp: 0.09, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const target = a.getAttribute('href');
    if (target.length < 2 && target !== '#') return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    lenis.scrollTo(target === '#top' ? 0 : target, { duration: 1.6 });
  })
);

/* ---------- Split text em letras ---------- */
document.querySelectorAll('[data-split]').forEach((el) => {
  const text = el.textContent;
  // letras agrupadas por palavra para o navegador não quebrar no meio dela
  el.innerHTML = text
    .split(' ')
    .map((w) => `<span class="wd">${[...w].map((ch) => `<span class="ch">${ch}</span>`).join('')}</span>`)
    .join(' ');
});

/* ---------- Split em palavras ---------- */
document.querySelectorAll('.reveal-words').forEach((el) => {
  el.innerHTML = el.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`)
    .join(' ');
});

/* ---------- Cena 3D ---------- */
const isMobile = window.innerWidth < 900;
const scene3d = initScene(document.getElementById('gl'), isMobile);

/* ---------- Entrada (sem tela de carregamento) ---------- */
gsap
  .timeline({ delay: 0.1 })
  .from('#gl', { opacity: 0, duration: 2, ease: 'power2.out' }, 0)
  .from('.hero__title .ch', { yPercent: 115, rotate: 8, duration: 1.2, stagger: 0.04, ease: 'expo.out' }, 0.1)
  .from('.hero__meta span, .hero__intro, .hero__scroll', { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.5)
  .from('.nav', { yPercent: -100, opacity: 0, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.3);

// o blob nasce "explodindo" e se acalma
scene3d.kick = 0.9;
window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.hero')) scene3d.kick = 0.45;
});

/* ---------- Blob viaja entre as seções ---------- */
// [chave do keyframe, elemento que dispara, início, fim]
const route = [
  ['hero'],
  ['sobre', '#sobre', 'top 75%', 'top 25%'],
  ['projetos', '#projectsPin', 'top 90%', 'top 30%'],
  ['stack', '#stack', 'top 60%', 'top 10%'],
  ['valores', '#valores', 'top 80%', 'top 40%'],
  ['contato', '#contato', 'top 80%', 'top 40%'],
  ['rodape', '.footer', 'top 90%', 'bottom bottom'],
];
for (let i = 1; i < route.length; i++) {
  const [key, trigger, start, end] = route[i];
  gsap.fromTo(scene3d.target, { ...scene3d.frames[route[i - 1][0]] }, {
    ...scene3d.frames[key],
    ease: 'none',
    immediateRender: false,
    scrollTrigger: { trigger, start, end, scrub: true },
  });
}
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (s) => (scene3d.scroll = s.progress),
});

/* ---------- Relógio de SP ---------- */
const clockEl = document.getElementById('clock');
const tickClock = () =>
  (clockEl.textContent = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }));
tickClock();
setInterval(tickClock, 15000);

/* ---------- Hero ao rolar ---------- */
gsap.to('.hero__title .line:first-child', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.hero__title .line--right', { xPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

/* ---------- Nav esconde ao descer ---------- */
let lastY = 0;
lenis.on('scroll', ({ scroll }) => {
  document.body.classList.toggle('nav-hidden', scroll > lastY && scroll > 200);
  document.body.classList.toggle('scrolled', scroll > 50);
  lastY = scroll;
});
document.getElementById('menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));

/* ---------- Marquee com velocidade do scroll ---------- */
const marquee = document.getElementById('marquee');
marquee.innerHTML += marquee.innerHTML;
let mx = 0, mSpeed = 1;
lenis.on('scroll', ({ velocity }) => (mSpeed = 1 + Math.abs(velocity) * 0.25 * Math.sign(velocity || 1)));
let mW = 0, mOn = true;
const measureMarquee = () => (mW = marquee.scrollWidth / 2);
measureMarquee();
window.addEventListener('resize', measureMarquee);
document.fonts?.ready.then(measureMarquee);
new IntersectionObserver(([e]) => (mOn = e.isIntersecting)).observe(marquee);
gsap.ticker.add(() => {
  if (!mOn) return; // fora da tela: não anima
  mx -= mSpeed * 0.9;
  mSpeed += (1 - mSpeed) * 0.05;
  const w = mW;
  if (mx <= -w) mx += w;
  if (mx > 0) mx -= w;
  marquee.style.transform = `translate3d(${mx}px,0,0)`;
});

/* ---------- Títulos grandes revelando ---------- */
gsap.utils.toArray('.big-title, .contact__title').forEach((t) =>
  gsap.from(t.querySelectorAll('.ch'), {
    yPercent: 110,
    duration: 1,
    stagger: 0.025,
    ease: 'expo.out',
    scrollTrigger: { trigger: t, start: 'top 85%' },
  })
);

gsap.utils.toArray('.section-tag').forEach((t) =>
  gsap.from(t, { opacity: 0, x: -30, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 90%' } })
);

/* ---------- Sobre ---------- */
gsap.fromTo(
  '.about__lead .w',
  { opacity: 0.12 },
  { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.about__lead', start: 'top 80%', end: 'bottom 45%', scrub: true } }
);
gsap.fromTo('.about__photo-inner', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.about__photo', start: 'top 80%' } });
gsap.fromTo('.about__photo-inner img', { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.from('.about__cols p, .stat', { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.about__cols', start: 'top 85%' } });

// Contadores
document.querySelectorAll('[data-count]').forEach((el) => {
  const o = { v: 0 };
  gsap.to(o, {
    v: +el.dataset.count,
    duration: 2,
    ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => (el.textContent = Math.round(o.v) + (el.dataset.suffix || '')),
  });
});

// Foto: tilt 3D seguindo o mouse
const photo = document.querySelector('.about__photo');
if (finePointer) {
  photo.addEventListener('pointermove', (e) => {
    const r = photo.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(photo, { rotateY: x * 14, rotateX: -y * 14, duration: 0.6, ease: 'power3.out' });
  });
  photo.addEventListener('pointerleave', () => gsap.to(photo, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1,0.5)' }));
}

/* ---------- Projetos: scroll horizontal ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 900px)', () => {
  const track = document.getElementById('projectsTrack');
  const dist = () => track.scrollWidth - window.innerWidth + 64;
  const tween = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#projectsPin',
      start: 'center center',
      end: () => '+=' + dist(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
  // carrossel curvo: cada card gira em Y e recua em Z conforme se afasta do centro
  // só recalcula quando o trilho anda (sem ler layout a cada quadro: usa offsets guardados)
  const cards = gsap.utils.toArray('.pcard').map((el) => ({ el, set: gsap.quickSetter(el, 'css') }));
  const measure = () => cards.forEach((c) => (c.center = c.el.offsetLeft + c.el.offsetWidth / 2));
  let lastX = null;
  const upd = () => {
    const x = gsap.getProperty(track, 'x');
    if (x === lastX) return;
    lastX = x;
    const W = window.innerWidth;
    for (const c of cards) {
      const off = gsap.utils.clamp(-1.6, 1.6, (c.center + x - W / 2) / W);
      c.set({ rotationY: off * -28, z: -Math.abs(off) * 260, rotationZ: off * 2 });
    }
  };
  measure();
  ScrollTrigger.addEventListener('refresh', () => { measure(); lastX = null; upd(); });
  gsap.ticker.add(upd);
  // cards entram com rotação conforme ficam visíveis
  gsap.utils.toArray('.pcard__cover .cv').forEach((cv) =>
    gsap.fromTo(cv, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: cv, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } })
  );
  return () => gsap.ticker.remove(upd);
});
mm.add('(max-width: 899px)', () => {
  gsap.utils.toArray('.pcard').forEach((c) =>
    gsap.from(c, { y: 80, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } })
  );
});

// Spotlight nos cards
document.querySelectorAll('.pcard').forEach((c) =>
  c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  })
);

/* ---------- Stack ---------- */
initSphere(document.getElementById('sphere'));
gsap.from('.stack__groups > div', { y: 30, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.stack__groups', start: 'top 88%' } });

/* ---------- Valores: pilha de cards ---------- */
const vcards = gsap.utils.toArray('.vcard');
vcards.forEach((card, i) => {
  const next = vcards[i + 1];
  if (!next) return;
  // quando o próximo card sobe, este recua em 3D e escurece.
  // O escurecer é uma película com opacity (só GPU) — `filter` aqui obrigava a redesenhar o card e ele piscava.
  const shade = document.createElement('i');
  shade.className = 'vcard__shade';
  card.appendChild(shade);
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: 0.4 },
  });
  tl.to(card, { scale: 0.9, rotationX: 10, transformPerspective: 1200, force3D: true }, 0).to(shade, { opacity: 0.5 }, 0);
});
gsap.from('.vcard h3', { yPercent: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.vstack', start: 'top 80%' } });

/* ---------- Footer gigante se levanta em 3D ---------- */
gsap.from('.footer__name', {
  rotationX: -80,
  yPercent: 40,
  opacity: 0,
  ease: 'none',
  scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
});

/* ---------- Copiar e-mail ---------- */
document.getElementById('copyEmail').addEventListener('click', async () => {
  const fb = document.getElementById('copyFeedback');
  try {
    await navigator.clipboard.writeText('stemarq.contato@gmail.com');
    fb.textContent = 'copiado ✓';
  } catch {
    fb.textContent = 'ops';
  }
  setTimeout(() => (fb.textContent = '⧉'), 1800);
});

/* ---------- Cursor custom + magnetismo ---------- */
if (finePointer) {
  document.body.classList.add('has-cursor');
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  const label = document.getElementById('cursorLabel');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  window.addEventListener('pointermove', (e) => {
    cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY);
  });

  document.addEventListener('pointerover', (e) => {
    const withLabel = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    if (withLabel) {
      label.textContent = withLabel.dataset.cursor;
      cursor.className = 'cursor is-label';
    } else if (link) {
      cursor.className = 'cursor is-link';
    } else {
      cursor.className = 'cursor';
    }
  });

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

// os gatilhos do blob são criados antes do pin dos projetos: reordenar para os cálculos considerarem o pin
ScrollTrigger.sort();
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
