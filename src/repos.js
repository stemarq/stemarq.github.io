// Contador de repositórios públicos no rodapé. Sempre consulta a API (sem cache),
// para que um repositório criado ou excluído apareça no próximo carregamento.
import gsap from 'gsap';
import { GH_USER } from './activity.js';

const LABEL = 'repositórios públicos no GitHub';
const REFRESH_MS = 60e3; // ao voltar para a aba, consulta de novo se já passou 1 min

let pending;
// Uma requisição por vez, compartilhada com o contador do "Sobre".
export function getRepoCount() {
  if (pending) return pending;
  // no-store: a API manda max-age=60 e o navegador serviria o número antigo
  pending = fetch(`https://api.github.com/users/${GH_USER}`, { signal: AbortSignal.timeout(6000), cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((u) => (Number.isFinite(u.public_repos) ? u.public_repos : Promise.reject('formato')))
    .finally(() => (pending = null));
  return pending;
}

// 403/429 = limite de consultas da API; qualquer outra falha (timeout, rede, 5xx) = fora do ar
const errorText = (e) =>
  e === 403 || e === 429 ? 'Limite de consultas ao GitHub atingido, tente em alguns minutos' : 'API do GitHub fora do ar, não foi possível contar os repositórios';

export function initRepoCounter(el, { reduced }) {
  const num = el.querySelector('.repos__n');
  const label = el.querySelector('.repos__label');
  const o = { v: 0 };
  let value = null, seen = false, lastFetch = 0;

  const show = () => {
    if (!seen || value === null) return;
    gsap.to(o, { v: value, duration: reduced ? 0 : 1.2, ease: 'expo.out', overwrite: true, onUpdate: () => (num.textContent = Math.round(o.v)) });
  };

  const load = () => {
    lastFetch = Date.now();
    el.dataset.state = value === null ? 'loading' : el.dataset.state;
    getRepoCount()
      .then((v) => {
        value = v;
        el.dataset.state = 'ok';
        label.textContent = LABEL;
        show();
      })
      .catch((e) => {
        value = null;
        o.v = 0;
        el.dataset.state = 'error';
        num.textContent = '!';
        label.textContent = errorText(e);
      });
  };

  // a contagem só anima quando o rodapé aparece na tela
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !seen) { seen = true; show(); }
  }).observe(el);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastFetch > REFRESH_MS) load();
  });

  load();
}
