// Subtitles -> spotlight-effect.srt (same cards and timings as the burned-in ones in story.js)
import fs from 'node:fs';
import { SUBS, warp } from './story.js';
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const body = SUBS.map(([a, b, t], i) => `${i + 1}\n${ts(warp(a))} --> ${ts(warp(b))}\n${t.split('|').join('\n')}\n`).join('\n');
fs.writeFileSync(new URL('./spotlight-effect.srt', import.meta.url), body);
console.log('wrote spotlight-effect.srt,', SUBS.length, 'cards');
