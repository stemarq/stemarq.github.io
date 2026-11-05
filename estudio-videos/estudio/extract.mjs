// Converte a gravação inteira de cada app em quadros JPG de 30 fps para o estúdio (clips/<id>/f).
// O estúdio escolhe os trechos pela linha do tempo de projects.js (steps), então não é preciso cortar antes.
import { PROJECTS } from './projects.js';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import FF from 'ffmpeg-static';
for (const id of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PROJECTS)) {
  const p = PROJECTS[id]; const dir = `clips/${id}/f`;
  fs.rmSync(`clips/${id}`, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  execFileSync(FF, ['-v', 'error', '-i', `../footage/${p.footage || id}.mp4`, '-vf', `fps=30,scale=${p.fw}:${p.fh}:flags=lanczos`, '-q:v', '3', `${dir}/%05d.jpg`]);
  const n = fs.readdirSync(dir).length;
  fs.writeFileSync(`clips/${id}/info.json`, JSON.stringify({ n }));
  console.log(id, n, 'quadros');
}
