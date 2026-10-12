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

// os gatilhos do blob são criados antes do pin dos projetos: reordenar para os cálculos considerarem o pin
ScrollTrigger.sort();
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
