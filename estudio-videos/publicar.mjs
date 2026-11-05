// Copia os vídeos prontos (out/) para o site, em ../public/videos, com a capa ao lado.
// O vídeo é recomprimido para o site (o de out/ é a matriz) e a capa sai do meio do 2º passo (zoom e legenda inteiros).
// uso: node publicar.mjs [id ...]   (sem id: todos os que estiverem em out/)
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import FF from 'ffmpeg-static';
import { PROJECTS } from './estudio/projects.js';
// mesma conta da linha do tempo do estúdio (studio.js): abertura 4,6 s + problema, depois os passos
function tempoDaCapa(id) {
  const P = PROJECTS[id]; const marks = JSON.parse(fs.readFileSync(`footage/${P.footage || id}.marks.json`, 'utf8'));
  const at = (v) => { if (typeof v === 'number') return v; const m = /^(\w+)([+-][\d.]+)?$/.exec(v); return marks[m[1]] + (m[2] ? +m[2] : 0); };
  let t = 4.6 + (P.problem.dur || 10);
  const ds = P.steps.map((s) => (at(s.to) - at(s.from)) / (s.speed || 1));
  const k = P.capa ?? 1;
  for (let i = 0; i < k; i++) t += ds[i];
  return t + ds[k] * 0.55;
}
const NOMES = { gene: 'genetools' }; // id do estúdio → id do card no site (src/projects.js)
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync('out').filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4));
fs.mkdirSync('../public/videos', { recursive: true });
for (const id of ids) {
  const src = `out/${id}.mp4`, dst = `../public/videos/${NOMES[id] || id}`;
  const info = spawnSync(FF, ['-i', src], { encoding: 'utf8' }).stderr;
  const [, h, m, s] = /Duration: (\d+):(\d+):([\d.]+)/.exec(info);
  const dur = +h * 3600 + +m * 60 + +s;
  const capa = tempoDaCapa(id);
  execFileSync(FF, ['-v', 'error', '-y', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${dst}.mp4`]);
  execFileSync(FF, ['-v', 'error', '-y', '-ss', capa.toFixed(2), '-i', src, '-frames:v', '1', '-vf', 'scale=1280:-1', '-q:v', '4', `${dst}.jpg`]);
  console.log('publicado', `${dst}.mp4`, (fs.statSync(`${dst}.mp4`).size / 1e6).toFixed(1) + ' MB', dur.toFixed(1) + ' s');
}
