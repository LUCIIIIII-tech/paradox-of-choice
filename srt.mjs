// Subtitles: reads window.SUBS through the page timing rules and writes paradox-of-choice.srt
// Usage: node srt.mjs   (after voice.py; uses the same lines, voice durations and cut rules as main.js)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const LINES = JSON.parse(readFileSync(join(HERE, 'lines.json'), 'utf8'));
const DURS = JSON.parse(readFileSync(join(HERE, 'voices/dur.json'), 'utf8'));
const src = readFileSync(join(HERE, 'story.js'), 'utf8');
const VO = Function(`${src.match(/export const VO = (\{[\s\S]*?\});/)[1].replace(/^/, 'return ')}`)();
const CUTS = JSON.parse(readFileSync(join(HERE, 'main.js'), 'utf8').match(/const CUTS = (\[[^\]]*\]);/)[1]);
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
const subs = Object.entries(VO).map(([id, t0]) => {
  const L = LINE[id], text = L.sub || L.text, d = DURS[id];
  let t1 = t0 + Math.max(d + .35, .9 + text.length / 17);
  const cut = CUTS.find(c => c > t0 + .1); if (cut && t1 > cut) t1 = Math.max(cut - .02, t0 + d + .2);
  return { t0, t1, text: `${L.who === 'OONA' ? 'Oona' : 'Benny'}: ${text}` };
}).sort((a, b) => a.t0 - b.t0);
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
writeFileSync(join(HERE, 'paradox-of-choice.srt'), subs.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${s.text}\n`).join('\n'));
console.log('srt', subs.length, 'cues');
