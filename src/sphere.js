// Esfera de tecnologias em DOM 3D, arrastável com inércia
const TECH = [
  'TypeScript', 'JavaScript', 'Python', 'React', 'React Native', 'Expo', 'Next.js', 'Node.js',
  'Express', 'FastAPI', 'PostgreSQL', 'SQLite', 'Supabase', 'HTML5', 'CSS3', 'Sass',
  'Phaser', 'Capacitor', 'Git', 'GitLab CI', 'GitHub Actions', 'Figma', 'Gemini API', 'Shell',
  'REST', 'PWA', 'Jest', 'Vite',
];

export function initSphere(el) {
  const items = TECH.map((t, i) => {
    const s = document.createElement('span');
    s.className = 'tag3d' + (i % 5 === 0 ? ' tag3d--hot' : '');
    s.textContent = t;
    el.appendChild(s);
    // distribuição de Fibonacci na esfera
    const y = 1 - (i / (TECH.length - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    return { el: s, x: Math.cos(th) * r, y, z: Math.sin(th) * r };
  });

  let rx = 0, ry = 0, vx = 0.002, vy = 0.004, dragging = false, lx = 0, ly = 0;
  let radius = 200;
  const resize = () => (radius = Math.min(el.clientWidth, el.clientHeight) * 0.4);
  window.addEventListener('resize', resize);
  resize();

  el.addEventListener('pointerdown', (e) => {
    dragging = true; lx = e.clientX; ly = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    vy = (e.clientX - lx) * 0.0008;
    vx = -(e.clientY - ly) * 0.0008;
    lx = e.clientX; ly = e.clientY;
  });
  const up = () => (dragging = false);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (!dragging) {
      vx += (0.0015 - vx) * 0.02;
      vy += (0.003 - vy) * 0.02;
    }
    rx += vx; ry += vy;
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    for (const it of items) {
      const x1 = it.x * cy + it.z * sy;
      const z1 = -it.x * sy + it.z * cy;
      const y1 = it.y * cx - z1 * sx;
      const z2 = it.y * sx + z1 * cx;
      const scale = (z2 + 2) / 3;
      it.el.style.transform = `translate(-50%,-50%) translate3d(${x1 * radius}px,${y1 * radius}px,0) scale(${scale})`;
      it.el.style.opacity = 0.2 + ((z2 + 1) / 2) * 0.8;
      it.el.style.zIndex = Math.round(z2 * 100) + 100;
    }
  }
  frame();
}
