// Grava um app rodando via CDP screencast e gera footage/<nome>.mp4 (30 fps) + folha de contato.
// uso: node record.mjs <nome>   (roteiro em roteiros/<nome>.mjs: export default { url, w, h, dpr, run(page, h) })
import { chromium } from './pw.mjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import FF from 'ffmpeg-static';
const name = process.argv[2];
const cfg = (await import(`./roteiros/${name}.mjs?${Date.now()}`)).default;
const dir = `footage/${name}`;
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr || 1, isMobile: !!cfg.mobile, hasTouch: !!cfg.mobile, locale: 'pt-BR' });
if (cfg.setup) await cfg.setup(ctx);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 160)));
await page.goto(cfg.url, { waitUntil: 'load', timeout: 300000 });
if (cfg.before) await cfg.before(page);
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  const i = frames.length;
  frames.push(f.metadata.timestamp);
  fs.writeFileSync(`${dir}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: cfg.w * (cfg.dpr || 1), maxHeight: cfg.h * (cfg.dpr || 1), everyNthFrame: 1 });
const t0 = Date.now();
// cursor visível desenhado na página (o screencast não mostra o cursor do sistema)
const helpers = {
  wait: (ms) => page.waitForTimeout(ms),
  async move(x, y, steps = 25) { await page.mouse.move(x, y, { steps }); await page.evaluate(([x, y]) => window.__cur?.(x, y), [x, y]); },
  async click(x, y) { await helpers.move(x, y); await page.waitForTimeout(250); await page.evaluate(() => window.__tap?.()); await page.mouse.click(x, y); },
  async drag(x1, y1, x2, y2, steps = 40) { await helpers.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps }); await page.evaluate(([x, y]) => window.__cur?.(x, y), [x2, y2]); await page.mouse.up(); },
  async scroll(dy, steps = 30) { for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await page.waitForTimeout(16); } },
  async tapText(t, exact = false) { const bb = await page.getByText(t, { exact }).last().boundingBox(); await helpers.click(bb.x + bb.width / 2, bb.y + bb.height / 2); },
  async tap(sel) { const bb = await page.locator(sel).first().boundingBox(); await helpers.click(bb.x + bb.width / 2, bb.y + bb.height / 2); },
};
await page.addStyleTag({ content: '#__c{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(0,0,0,.6);pointer-events:none;transition:transform .15s;left:-50px;top:-50px}#__c.t{transform:scale(.6)}' }).catch(() => {});
const injectCursor = () => page.evaluate(() => {
  if (document.getElementById('__c')) return;
  const c = document.createElement('div'); c.id = '__c'; document.documentElement.appendChild(c);
  window.__cur = (x, y) => { c.style.left = x + 'px'; c.style.top = y + 'px'; };
  addEventListener('mousemove', (e) => window.__cur(e.clientX, e.clientY), true);
  window.__tap = () => { c.classList.add('t'); setTimeout(() => c.classList.remove('t'), 180); };
}).catch(() => {});
if (!cfg.noCursor) { await injectCursor(); page.on('load', async () => { await page.addStyleTag({ content: '#__c{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(0,0,0,.6);pointer-events:none;transition:transform .15s}#__c.t{transform:scale(.6)}' }).catch(() => {}); injectCursor(); }); }
await cfg.run(page, helpers);
await page.waitForTimeout(500);
await cdp.send('Page.stopScreencast');
await b.close();
// monta o vídeo respeitando o tempo real de cada quadro
const lines = [];
for (let i = 0; i < frames.length; i++) {
  const d = i + 1 < frames.length ? frames[i + 1] - frames[i] : 0.04;
  lines.push(`file '${name}/${String(i).padStart(5, '0')}.jpg'`, `duration ${Math.max(d, 0.001).toFixed(4)}`);
}
fs.writeFileSync(`footage/${name}.txt`, lines.join('\n'));
const W = cfg.w * (cfg.dpr || 1), H = cfg.h * (cfg.dpr || 1);
execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `footage/${name}.txt`, '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', `footage/${name}.mp4`]);
execFileSync(FF, ['-v', 'error', '-y', '-i', `footage/${name}.mp4`, '-vf', `fps=1/${cfg.sheetEvery || 2},scale=${cfg.w > cfg.h ? 400 : 200}:-1,tile=6x4`, '-frames:v', '1', `footage/${name}-sheet.png`]);
console.log(name, frames.length, 'quadros', ((Date.now() - t0) / 1000).toFixed(1) + 's');
