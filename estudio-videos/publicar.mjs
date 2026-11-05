// Copia os vídeos prontos (out/) para o site, em ../public/videos, com a capa (quadro dos 12 s) ao lado.
// uso: node publicar.mjs [id ...]   (sem id: todos os que estiverem em out/)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import FF from 'ffmpeg-static';
const NOMES = { gene: 'genetools' }; // id do estúdio → id do card no site (src/projects.js)
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync('out').filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4));
fs.mkdirSync('../public/videos', { recursive: true });
for (const id of ids) {
  const dst = `../public/videos/${NOMES[id] || id}`;
  fs.copyFileSync(`out/${id}.mp4`, `${dst}.mp4`);
  execFileSync(FF, ['-v', 'error', '-y', '-ss', '12', '-i', `out/${id}.mp4`, '-frames:v', '1', '-vf', 'scale=1280:-1', '-q:v', '4', `${dst}.jpg`]);
  console.log('publicado', `${dst}.mp4`);
}
