// uso: node render.mjs <id> [--preview 1,4,9]  → prévia em PNG ou vídeo final em out/<id>.mp4
//      node render.mjs <id> --parte 1 3       → só a 1ª de 3 partes (out/<id>.p1.mp4); com todas prontas, junta em out/<id>.mp4
import { chromium } from './pw.mjs';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
const [id, flag, list] = process.argv.slice(2);
// servidor estático próprio (mesmo do serve.mjs), numa porta livre: não depende de outro terminal
import http from 'node:http'; import path from 'node:path';
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const f = path.join(process.cwd(), decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const porta = srv.address().port;
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.log('pageerror', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
await p.goto(`http://127.0.0.1:${porta}/estudio/index.html?p=${id}`);
await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const total = await p.evaluate(() => window.TOTAL);
console.log(id, 'duração', total.toFixed(2), 's', await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); }));
if (flag === '--preview') {
  fs.mkdirSync('prev', { recursive: true });
  // tempos em segundos ou em % da duração (ex.: 10%,50%)
  for (const t of list.split(',').map((v) => (v.endsWith('%') ? (parseFloat(v) / 100) * total : Number(v)))) { await p.evaluate((t) => window.renderAt(t), t); await p.screenshot({ path: `prev/${id}-${t}.png` }); }
} else {
  fs.mkdirSync('out', { recursive: true });
  // por partes: cada parte é um processo curto (útil quando falta memória)
  const [k, nPartes] = flag === '--parte' ? [Number(list), Number(process.argv[5])] : [1, 1];
  const saida = nPartes > 1 ? `out/${id}.p${k}.mp4` : `out/${id}.mp4`;
  const ff = spawn(ffmpegPath, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(total * 30); const t0 = Date.now();
  const ini = Math.floor((n * (k - 1)) / nPartes), fim = Math.floor((n * k) / nPartes);
  for (let i = ini; i < fim; i++) {
    await p.evaluate((t) => window.renderAt(t), i / 30);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(id, i, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(id, nPartes > 1 ? `parte ${k}/${nPartes}` : '', 'pronto em', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  const partes = Array.from({ length: nPartes }, (_, j) => `out/${id}.p${j + 1}.mp4`);
  if (nPartes > 1 && partes.every((f) => fs.existsSync(f))) {
    fs.writeFileSync(`out/${id}.partes.txt`, partes.map((f) => `file '${f.slice(4)}'`).join('\n'));
    spawnSync(ffmpegPath, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `out/${id}.partes.txt`, '-c', 'copy', '-movflags', '+faststart', `out/${id}.mp4`]);
    for (const f of [...partes, `out/${id}.partes.txt`]) fs.rmSync(f);
    console.log(id, 'partes juntadas em', `out/${id}.mp4`);
  }
}
await b.close();
srv.close();
