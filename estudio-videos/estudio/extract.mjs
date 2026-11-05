// Corta os trechos escolhidos de cada gravação em sequências JPG de 30 fps para o estúdio.
import { PROJECTS } from './projects.js';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import FF from 'ffmpeg-static';
for (const id of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PROJECTS)) {
  const p = PROJECTS[id]; const counts = [];
  fs.rmSync(`clips/${id}`, { recursive: true, force: true });
  p.clips.forEach(([s, e], k) => {
    const dir = `clips/${id}/${k}`; fs.mkdirSync(dir, { recursive: true });
    execFileSync(FF, ['-v', 'error', '-ss', String(s), '-t', String(e - s), '-i', `../footage/${id}.mp4`, '-vf', `fps=30,scale=${p.fw}:${p.fh}`, '-q:v', '3', `${dir}/%05d.jpg`]);
    counts.push(fs.readdirSync(dir).length);
  });
  fs.writeFileSync(`clips/${id}/counts.json`, JSON.stringify(counts));
  console.log(id, counts);
}
