import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

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

// os gatilhos do blob são criados antes do pin dos projetos: reordenar para os cálculos considerarem o pin
ScrollTrigger.sort();
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
