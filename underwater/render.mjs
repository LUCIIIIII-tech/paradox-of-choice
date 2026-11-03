// Render frames with headless Chromium: node render.mjs [--still t1,t2,...] [--from a --to b --out file.mp4]
// Serves this folder over a tiny static server, calls window.renderAt(t) per frame and pipes JPEGs into ffmpeg.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 24;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const f = path.join(HERE, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(HERE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--disable-gpu-vsync', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
const LANG = arg('--lang', 'tl');
await page.goto(`http://localhost:${port}/index.html${LANG === 'tl' ? '' : '?lang=' + LANG}`);
await page.waitForFunction(() => window.renderAt && window.fontsReady);
await page.evaluate(() => window.fontsReady);
const grab = async t => {
  const b64 = await page.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', .93).slice(23); }, t);
  return Buffer.from(b64, 'base64');
};
const stills = arg('--still');
if (stills) {
  fs.mkdirSync(path.join(HERE, 'out/stills'), { recursive: true });
  for (const s of stills.split(',')) { const t = +s; fs.writeFileSync(path.join(HERE, 'out/stills', `t${t.toFixed(2)}.jpg`), await grab(t)); }
  console.log('stills done');
} else {
  const from = +arg('--from', 0), to = +arg('--to', await page.evaluate(() => window.DUR)), out = arg('--out', path.join(HERE, 'out/video.mp4'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS);
  for (let n = n0; n < n1; n++) {
    const buf = await grab(n / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (n % 120 === 0) console.log(out, n, '/', n1);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close(); srv.close();
