// uso: node render.mjs <id> [--preview 1,4,9]  → prévia em PNG ou vídeo final em out/<id>.mp4
import { chromium } from './pw.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
const [id, flag, list] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.log('pageerror', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
await p.goto(`http://127.0.0.1:8790/estudio/index.html?p=${id}`);
await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const total = await p.evaluate(() => window.TOTAL);
console.log(id, 'duração', total.toFixed(2), 's', await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); }));
if (flag === '--preview') {
  fs.mkdirSync('prev', { recursive: true });
  for (const t of list.split(',').map(Number)) { await p.evaluate((t) => window.renderAt(t), t); await p.screenshot({ path: `prev/${id}-${t}.png` }); }
} else {
  fs.mkdirSync('out', { recursive: true });
  const ff = spawn(ffmpegPath, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `out/${id}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(total * 30); const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.renderAt(t), i / 30);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(id, i, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(id, 'pronto em', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await b.close();
