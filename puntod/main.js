// Huwag Kang Lilingon sa Puntod (Undas special, 60-90 s, 1080x1920, three.js). SETUP SKELETON: the cemetery blockout, the shot table,
// a slow camera per shot, candle lights, fog, dust, the cards and word captions. The story shots, Lola's ghost and the hero character come next.
// renderAt(t) builds the frame from t alone: pick the shot from timeline.json, pose the scene, render through the post chain, then the 2D text on top.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { lerp, clamp, seg, ss, hash, wob, paintTex, toon, std, basic, box, add, group, dust, fogSheets, wisps } from './kit.js';

const W = 1080, H = 1920;
const TL = await (await fetch('timeline.json')).json(), LN = Object.fromEntries(TL.lines.map(l => [l.id, l])), DUR = TL.dur; window.DUR = DUR;
// shots: consecutive lines with the same shot name; a cut sits in the middle of the silence between two lines
const SHOTS = [];
TL.lines.forEach((l, i) => { const prev = TL.lines[i - 1]; if (!prev || prev.shot !== l.shot) { const a = prev ? (prev.t1 + l.t0) / 2 : 0; if (SHOTS.length) SHOTS[SHOTS.length - 1].b = a; SHOTS.push({ name: l.shot, a, b: DUR, card: l.card }); } });
const SH = Object.fromEntries(SHOTS.map(s => [s.name, s])); window.SHOTS = SHOTS;
const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

// ---------- renderer ----------
const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); gl.setPixelRatio(1); gl.setSize(W, H); gl.domElement.style.display = 'none'; document.body.appendChild(gl.domElement);
gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
const out = document.getElementById('c'), cx = out.getContext('2d');
const S = new THREE.Scene(); S.background = new THREE.Color(0x06080e); S.fog = new THREE.FogExp2(0x0b1018, .055);
const cam = new THREE.PerspectiveCamera(38, W / H, .05, 120);

// ---------- the cemetery (blockout: painterly toon materials, same look as the other 3D reels) ----------
const ground = add(S, new THREE.PlaneGeometry(80, 80), std(0x1d1f1a, .95, { map: paintTex('#2a2b22', { n: 900, grime: 400, rx: 12, ry: 12, seed: 4 }) }), 0, 0, 0, false); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
const stone = toon(0xb9b3a4, { map: paintTex('#b6b0a2', { grime: 260, seed: 2 }) }), old = toon(0x8f8a7e, { map: paintTex('#8c877b', { grime: 420, seed: 5 }) });
function nitso(x, z, ry = 0, s = 1) { const g = group(S, x, 0, z, ry); add(g, box(.9 * s, .5 * s, 1.9 * s), old, 0, .25 * s, 0); add(g, box(.95 * s, .95 * s, .14), stone, 0, .48 * s, -.95 * s); return g; }
function cross(x, z, h = 1.4) { const g = group(S, x, 0, z, (hash(x * z) - .5) * .3); const m = toon(0x3a3028); add(g, box(.09, h, .09), m, 0, h / 2, 0); add(g, box(.6, .08, .08), m, 0, h * .72, 0); g.rotation.z = (hash(x + z) - .5) * .14; return g; }
function apartment(x, z, cols = 4, rows = 3) { const g = group(S, x, 0, z); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) add(g, box(.95, .7, .9), hash(r * 9 + c) > .3 ? stone : old, (c - (cols - 1) / 2) * 1.0, .38 + r * .74, 0); return g; }
for (let row = 0; row < 5; row++) for (let i = -4; i <= 4; i++) if (hash(row * 31 + i) > .18) nitso(i * 1.6 + (hash(i + row) - .5) * .3, -row * 3.2 - 2, (hash(i * row) - .5) * .15);
for (let i = 0; i < 9; i++) cross(-7 + hash(i * 3) * 14, -3 - hash(i * 7) * 14);
apartment(-5.5, -18, 5, 3); apartment(5.5, -16, 4, 4);
const LOLA = nitso(0, 0, 0, 1.05);                                                   // Lola's tomb: the hero tomb at the origin
// the moon, the far lamp post, a tree line that moves in the wind
const moon = add(S, new THREE.SphereGeometry(1.6, 24, 16), basic(0xe8e4d4), -9, 16, -45, false);
const moonL = new THREE.DirectionalLight(0x8fa6c8, .55); moonL.position.set(-9, 16, -20); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); S.add(moonL); S.add(new THREE.HemisphereLight(0x2a3550, 0x0a0806, .35));
const post = group(S, 9, 0, -24); add(post, box(.12, 6, .12), toon(0x222222), 0, 3, 0); add(post, new THREE.SphereGeometry(.25, 12, 8), basic(0xffd59a), 0, 6, 0, false);
const postL = new THREE.PointLight(0xffc98a, 6, 18, 1.6); postL.position.set(9, 5.8, -24); S.add(postL);
const trees = []; for (let i = 0; i < 7; i++) { const g = group(S, -14 + i * 4.6, 0, -30 - hash(i) * 4); add(g, new THREE.CylinderGeometry(.18, .3, 4, 8), toon(0x15120e), 0, 2, 0); const top = add(g, new THREE.SphereGeometry(2.2, 10, 8), toon(0x0f1a14), 0, 5, 0); trees.push({ g, top, k: i }); }
// candles: real point lights with soft shadows, a flame sprite each, wax pooled at the base; they go out one by one from s2
const CANDLES = []; const flameMat = basic(0xffb347, { opacity: 1 });
function candle(x, z, k) { const g = group(S, x, 0, z); add(g, new THREE.CylinderGeometry(.035, .04, .22, 10), toon(0xf1ead8), 0, .11, 0); add(g, new THREE.CylinderGeometry(.09, .1, .015, 14), toon(0xe8dfc8), 0, .008, 0);
  const f = add(g, new THREE.SphereGeometry(.022, 10, 8), flameMat.clone(), 0, .255, 0, false); f.scale.y = 2.2;
  const l = new THREE.PointLight(0xffa850, 1.6, 4.5, 1.8); l.position.set(0, .3, 0); g.add(l); const c = { g, f, l, k, out: 1e9 }; CANDLES.push(c); return c; }
for (let i = 0; i < 10; i++) candle(-6 + hash(i * 5) * 12, -2 - hash(i * 11) * 10, i);
const HERO = candle(.18, -.68, 99); HERO.l.castShadow = true; HERO.l.shadow.mapSize.set(1024, 1024); HERO.l.shadow.radius = 6;
const fog = fogSheets(S, 4, 30, 30, .12, 0x8a96a8, .1, 3), motes = dust(S, 260, 6, 3, 6, 0, .2, -2, .015, 0xffe6c0, .35), smoke = wisps(S, 6, .18, .3, -.68, .5, 0xd8d0c4, .12, .05);

// ---------- post: bloom for the flames, a filmic output ----------
const composer = new EffectComposer(gl); composer.addPass(new RenderPass(S, cam));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .55, .6, .82)); composer.addPass(new OutputPass());

// ---------- cameras per shot: slow, weighted moves only (dolly-in, low angle, over-the-shoulder); a gentle handheld wander, never a jump ----------
const CAMS = {
  hook: [[0, .35, 2.6], [0, .55, 1.6], [0, .3, -.6]], alone: [[3, 2.4, 7], [2.2, 2.0, 5.4], [0, .6, -4]], candles_die: [[-2, 1.2, 3], [-1.4, 1.1, 2.2], [-1, .3, -5]],
  approach: [[.6, 1.5, 3.2], [.3, 1.2, 1.8], [0, .4, -.6]], sampaguita: [[.5, .45, .7], [.35, .4, .45], [.1, .3, -.7]], whisper1: [[.9, 1.45, 1.4], [.8, 1.4, 1.1], [0, .5, -.7]],
  default: [[0, 1.4, 4], [0, 1.2, 3], [0, .5, -1]] };
function camAt(t, s) { const c = CAMS[s.name] || CAMS.default, u = ss(seg(t, s.a, s.b)), hh = .006;
  cam.position.set(lerp(c[0][0], c[1][0], u) + wob(t, 1, .5) * hh, lerp(c[0][1], c[1][1], u) + wob(t, 2, .4) * hh, lerp(c[0][2], c[1][2], u));
  cam.lookAt(c[2][0] + wob(t, 3, .3) * hh, c[2][1], c[2][2]); }

function frame(t) {
  const s = shotAt(t); camAt(t, s);
  // candles die one by one through "candles_die", the hero candle on "huling kandila" (s7)
  const die0 = SH.candles_die ? SH.candles_die.a + .6 : 1e9, heroOut = LN.s7 ? LN.s7.t1 - .4 : 1e9;
  CANDLES.forEach(c => { const tOut = c === HERO ? heroOut : die0 + c.k * .45; const on = 1 - ss(seg(t, tOut, tOut + .5)); const fl = 1 + .12 * wob(t, c.k, 9) + .05 * wob(t, c.k + 4, 23);
    c.l.intensity = (c === HERO ? 2.4 : 1.4) * fl * on; c.f.visible = on > .02; c.f.scale.set(on, 2.2 * on * fl, on); });
  trees.forEach(r => { r.top.position.x = .12 * wob(t, r.k, .6); r.top.rotation.z = .03 * wob(t, r.k + 2, .5); });
  fog.update(t); motes.update(t); smoke.update(t, 1 - ss(seg(t, heroOut, heroOut + .5))); postL.intensity = 6 * (1 + .03 * wob(t, 9, 1.3));
  composer.render();
}

// ---------- 2D: the cards and the word captions (Anton), a soft fade at every cut and at the end ----------
function card(lines, a, y) { if (a <= .01) return; cx.save(); cx.globalAlpha = a; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  lines.forEach(([s, px, col, glow, dy]) => { cx.font = `${px}px Anton`; cx.shadowColor = glow || 'rgba(0,0,0,.8)'; cx.shadowBlur = glow ? 36 : 14; cx.fillStyle = col; cx.fillText(s, W / 2, y + dy); }); cx.restore(); }
function captions(t) { const l = TL.lines.find(l => l.words && t >= l.t0 - .05 && t <= l.t1 + .25); if (!l) return;
  const ws = l.words, i = ws.findIndex(w => t < w[2]); const k = i < 0 ? ws.length - 1 : i; const a0 = Math.floor(k / 3) * 3, chunk = ws.slice(a0, a0 + 3);
  cx.save(); cx.font = '78px Anton'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.shadowColor = 'rgba(0,0,0,.9)'; cx.shadowBlur = 12;
  const txt = chunk.map(w => w[0].toUpperCase()).join(' '), wTot = cx.measureText(txt).width; let x = W / 2 - wTot / 2;
  chunk.forEach(w => { const s = w[0].toUpperCase() + ' ', ww = cx.measureText(s).width, key = (l.key || []).includes(w[0]), on = t >= w[1];
    cx.fillStyle = l.voice === 'lola' ? (on ? '#cfe3ff' : 'rgba(207,227,255,.35)') : key && on ? '#ffb347' : on ? '#f4f1ea' : 'rgba(244,241,234,.4)'; cx.textAlign = 'left'; cx.fillText(s, x, 1420); x += ww; }); cx.restore(); }
window.renderAt = t => {
  frame(t); cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
  let dip = 1; for (const x of SHOTS) if (x.a > .1) dip = Math.min(dip, 1 - .85 * Math.exp(-(((t - x.a) / .18) ** 2)));   // a soft breath of dark at a cut, never a flash
  const end = SH.black ? 1 - ss(seg(t, SH.black.a, SH.black.a + .8)) : 1;
  cx.globalAlpha = dip * end * ss(seg(t, 0, .4)); cx.drawImage(gl.domElement, 0, 0); cx.globalAlpha = 1;
  for (const s of SHOTS) if (s.card && t >= s.a && t < s.b) card([[s.card, s.name === 'cta' ? 84 : 112, s.name === 'tomb' ? '#f4f1ea' : '#ff5a3c', 'rgba(255,90,60,.45)', 0]], ss(seg(t, s.a + .2, s.a + .9)) * (1 - ss(seg(t, s.b - .5, s.b))), 420);
  if (!SH.black || t < SH.black.a) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('40px Caveat')]).then(() => true);
