
// ==================== the shots: every event time comes from a word in the script, so the picture follows the narrator ====================
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);
const W_PATAY = wordT('h2', 'patay'), W_TUMAYO = wordT('h3', 'tumayo'), W_SUMPA = wordT('h4', 'sumpa'), W_MILYON = wordT('s1', 'milyon'),
  W_TRUCK = wordT('s2', 'truck'), W_KIDLAT = wordT('s2', 'kidlat'), W_LINDOL = wordT('s2', 'lindol'), W_BUMANGON = wordT('s2', 'Bumangon'), W_LIGAYA = wordT('s3', 'Ligaya'),
  W_KULUBOT = wordT('s4', 'Kulubot'), W_IKAW4 = wordT('s4', 'Ikaw'), W_SUMUNOD = wordT('s5', 'Sumunod'), W_PUTI = wordT('s6', 'Puti'), W_KALIMUTAN = wordT('L2', 'kakalimutan'),
  W_QUIAPO = wordT('s9', 'Quiapo'), W_BAHAY = wordT('s10', 'bahay'), W_TAGALOG = wordT('s11', 'Tagalog'), W_KUMUKULO = wordT('s13', 'Kumukulo'), W_NILAMON = wordT('s14', 'Nilamon'),
  W_LUMUTANG = wordT('s14', 'lumutang'), W_ISAISA = wordT('s16', 'Isa-isang'), W_DILIM = wordT('s17', 'dilim'), W_LARO = wordT('L3', 'laro'), W_YAKAPIN = wordT('s20', 'yakapin'), W_OO = wordT('cta', 'OO');

const S = {};
// ---------- the hook: falling forty floors past a burning tower; the windows rush up, glass and sparks fall with you ----------
function fallScene(t, k) {
  const sp = 1 + .4 * ss(seg(k, 0, 5)), scroll = k * 900 * sp, rot = .25 * Math.sin(k * .7) - .1 * k;
  setCam({ x: 540, y: 900, z: 1.05, rot: rot * .4, focus: 1, dof: 22, shake: 1.2, t });
  layer(6, () => { g.fillStyle = lg(0, -600, 0, 2600, ['#05070e', '#2a1a20', '#ff8a40']); g.fillRect(-900, -900, 2900, 3800); towers(t, 2600, 9, 3, { lit: .4 }); glow(540, 2400, 1400, C.ember, .5); });
  layer(2.2, () => {      // the burning tower beside you, in steep perspective, its window rows rushing up
    const vx = 1500, vy = 4200;
    for (let r = -2; r < 26; r++) { const yy = ((r * 160 - scroll) % (28 * 160) + 28 * 160) % (28 * 160) - 600, u = (yy + 600) / 4200;
      const x0 = lerp(-500, vx, u * .2), x1 = lerp(360, vx, u * .35), y1 = yy + 150;
      g.fillStyle = '#1a1c24'; g.fillRect(x0, yy, x1 - x0, 160); g.fillStyle = 'rgba(160,180,220,.08)'; g.fillRect(x0, yy, x1 - x0, 6);
      for (let c = 0; c < 4; c++) { const wx = lerp(x0, x1, c / 4) + 14, ww = (x1 - x0) / 4 - 28, burn = hash(r * 7.3 + c) > .55 && r % 28 < 20;
        rr(wx, yy + 30, ww, 100, 4); g.fillStyle = burn ? '#ff9a3a' : hash(r + c * 3.1) > .5 ? '#2a3448' : '#0c0e14'; g.fill();
        if (burn) { fire(wx + ww / 2, yy + 130, ww * .8, 120, t + r, 1); smokeCol(wx + ww / 2, yy + 30, 60, t + r, .5); } } } });
  layer(1, () => { faller(540, 900, 520, t, { rot: Math.sin(k * 1.3) * .2 }); L(540, 900, 600, C.fire, .7, .05); L(540, 700, 500, C.ember, .5, 0); });
  layer(.6, () => { shards(t, 540, 900, 30, 1100, 1); });
  lightPass('#2a1a22'); embersUp(t, 70, .9, 2.2 * sp); flares();
  // speed streaks at the edges, the world rushing up past you
  reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 30; i++) { const x = (hash(i * 3.3) < .5 ? hash(i) * 260 : W - hash(i) * 260), y = H - ((hash(i * 7.1) * H + t * 2600) % H), len = 120 + 260 * hash(i * 2); line([[x, y], [x, y + len]], 2 + 3 * hash(i), `rgba(255,220,180,${.18 + .2 * hash(i * 5)})`); } reset();
}
S.fall = (t, u) => { fallScene(t, u); const imp = ss(seg(t, E('h2') - .35, E('h2') + .05)); if (imp > 0) { reset(); g.fillStyle = `rgba(0,0,0,${imp})`; g.fillRect(0, 0, W, H); } };
S.loop = (t, u) => fallScene(t, u + 1.5);
// ---------- he gets up: the crushed car roof, glass everywhere, the crowd with their phones up; the fire above; low angle, rising ----------
S.rise = (t, u) => { const up = ss(seg(t, W_TUMAYO - .3, W_TUMAYO + 1.6)), dark = 1 - ss(seg(u, 0, .9));
  setCam({ x: 540, y: lerp(1120, 900, up), z: lerp(1.3, 1.05, ss(seg(u, 0, 5))), rot: lerp(-.08, 0, up), focus: 1, dof: 20, t });
  layer(5, () => { g.fillStyle = lg(0, -600, 0, 2000, ['#0a0810', '#3a1c18']); g.fillRect(-900, -900, 2900, 3800); towers(t, 1500, 7, 9, { lit: .3 });
    g.fillStyle = '#16141c'; g.fillRect(600, -600, 500, 2200); for (let r = 0; r < 12; r++) for (let c = 0; c < 3; c++) { const burn = hash(r * 3 + c) > .6; g.fillStyle = burn ? '#ff8a30' : '#0c0e14'; g.fillRect(630 + c * 150, -500 + r * 160, 110, 100); if (burn) fire(685 + c * 150, -400 + r * 160, 90, 120, t + r, .8); } smokeCol(850, -400, 300, t, .7); });
  layer(2.2, () => { for (let i = 0; i < 16; i++) { const x = -200 + i * 95 + hash(i) * 40, y = 1500 + hash(i * 3) * 60, hh = 520 + 120 * hash(i * 5); ell(x, y - hh * .9, hh * .08, hh * .09); g.fillStyle = '#0a0a0e'; g.fill(); rr(x - hh * .14, y - hh * .8, hh * .28, hh * .8, hh * .1); g.fill();
      if (hash(i * 7) > .4) { const px = x + hh * .1, py = y - hh * .95; rr(px - 16, py - 28, 32, 56, 6); g.fillStyle = '#cfe0ff'; g.fill(); L(px, py, 120, '200,220,255', .9, .25); } }
    for (const [x, c] of [[-120, C.red], [1180, '80,120,255']]) { L(x, 1300, 900, c, .45 + .15 * Math.sin(t * 1.6 + x), .1); } });
  layer(1, () => {
    g.fillStyle = '#1a1a20'; g.fillRect(-900, 1720, 2900, 1000); asphalt(() => { g.beginPath(); g.rect(-900, 1720, 2900, 1000); }, .7);
    g.beginPath(); g.moveTo(80, 1800); g.quadraticCurveTo(160, 1560, 360, 1600); g.quadraticCurveTo(540, 1700, 720, 1580); g.quadraticCurveTo(920, 1560, 1000, 1800); g.closePath(); g.fillStyle = lg(0, 1550, 0, 1800, ['#d8d4cc', '#7a7870']); g.fill();
    for (let k = 0; k < 14; k++) line([[540 + (hash(k) - .5) * 600, 1650], [540 + (hash(k * 2) - .5) * 900, 1650 + (hash(k * 3) - .5) * 200]], 2, 'rgba(20,20,24,.6)');
    rr(40, 1790, 1000, 160, 20); fs(lg(0, 1790, 0, 1950, ['#a8a49c', '#3a3832']), 3); for (const wx of [200, 880]) { circ(wx, 1960, 90, '#0c0c0e'); circ(wx, 1960, 45, '#6a6c74'); }
    shards(t * .2, 540, 1750, 40, 1100, .8, 5);
    manReal(540, lerp(2400, 1660, up), 1050 * lerp(.9, 1, up), { t, pose: up > .6 ? 'brush' : 'down', eyes: up > .3 ? 'open' : 'shut', dust: 1, lx: 1, rim: 'rgba(255,140,70,.6)', look: -.2 });
    L(540, 1100, 700, C.fire, .55, .05); });
  lightPass('#2a1a20'); embersUp(t, 50, .7, .5); flares();
  if (dark > 0) { reset(); g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H); }
};
// ---------- viral: a phone in a hand, the video of him on the car, the views rolling up to 40 million, comments flying ----------
const COMMENTS = ['PAANO???', 'FAKE YAN 😂', 'IMMORTAL PINOY', 'nanginig ako', 'CGI to sure', 'saan to? makati?', 'tumayo lang siya bro', 'hindi tao yan', 'SANA ALL'];
S.viral = (t, u) => { const vc = ss(seg(t, T('s1') + .2, W_MILYON + .3));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.12, ss(seg(u, 0, 6))), rot: -.04, focus: 1, dof: 24, t });
  layer(3, () => { g.fillStyle = '#0a0c14'; g.fillRect(-600, -600, 2300, 3200); bokeh(t, 26, 0, 1900, 20, .6, 7); });
  layer(1, () => {
    phone(560, 880, 620, 1240, -.06, (w, h) => {
      g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h);
      g.save(); g.beginPath(); g.rect(0, 90, w, w * 1.1); g.clip(); g.fillStyle = lg(0, 90, 0, 90 + w * 1.1, ['#1a1018', '#4a2418']); g.fillRect(0, 90, w, w * 1.1);
      g.fillStyle = '#2a2830'; g.fillRect(0, 90 + w * .8, w, w * .3); rr(w * .15, 90 + w * .75, w * .7, w * .12, 12); fs('#8a8680', 2);
      manReal(w * .5, 90 + w * .8, w * .62, { t, pose: 'brush', dust: 1, lx: 1 }); for (let k = 0; k < 3; k++) fire(w * (.2 + k * .3), 90 + w * .25, 40, 60, t + k, .7); g.restore();
      const v = Math.round(40000000 * vc); text(`${v.toLocaleString('en-US')} views`, 30, 90 + w * 1.1 + 50, 38, '#fff', 'Anton', 'left');
      text('ANG LALAKING HINDI NAMAMATAY', 30, 90 + w * 1.1 + 105, 34, '#e8e8f0', 'Anton', 'left');
      for (let i = 0; i < 6; i++) { const ci = Math.floor(t * 1.6) + i, cy = h - 60 - i * 70 - ((t * 1.6) % 1) * 70; if (cy < 90 + w * 1.1 + 140) continue; circ(46, cy, 22, `hsl(${hash(ci) * 360},50%,55%)`); text(COMMENTS[ci % COMMENTS.length], 84, cy, 30, '#dfe2ea', 'sans-serif', 'left'); }
      text('❤', w - 60, h * .55, 50, '#ff3a5a', 'sans-serif'); text(`${(Math.round(2.4 * vc * 10) / 10).toFixed(1)}M`, w - 60, h * .55 + 50, 24, '#fff', 'Anton');
    });
    handReal(640, 1560, 420, -Math.PI / 2 - .25, { skin: YOU.skin, curl: .55, sg: 1 }); });
  lightPass('#1a1c28'); flares(); };
// ---------- accidents: the truck, the lightning, the earthquake; a death counter ticking up; he walks away from all three ----------
S.accidents = (t, u) => { const ph = t < W_KIDLAT - .2 ? 0 : t < W_LINDOL - .2 ? 1 : t < W_BUMANGON - .2 ? 2 : 3, p0 = [T('s2'), W_KIDLAT - .2, W_LINDOL - .2, W_BUMANGON - .2][ph], v = t - p0;
  if (ph === 0) { setCam({ x: 540, y: 900, z: lerp(1, 1.2, ss(seg(v, 0, 3))), focus: 1, dof: 16, shake: 2 * ss(seg(t, W_TRUCK - .3, W_TRUCK)), t });
    layer(4, () => { g.fillStyle = '#06070c'; g.fillRect(-600, -600, 2300, 3200); towers(t, 1300, 8, 21, { lit: .3 }); });
    layer(1.5, () => { g.fillStyle = '#16161c'; g.fillRect(-900, 1300, 2900, 1200); asphalt(() => { g.beginPath(); g.rect(-900, 1300, 2900, 1200); }, .6); const k = ss(seg(t, T('s2') + .2, W_TRUCK)); truckFront(540, lerp(1500, 2100, k), lerp(140, 380, k), t); });
    layer(1, () => { manReal(540, 1800, 900, { t, pose: 'reach', eyes: 'wide', mouth: .4, lx: 1, rim: 'rgba(255,240,200,.8)' }); });
    lightPass('#121420'); flares(); }
  else if (ph === 1) { const b = ss(seg(t, W_KIDLAT - .05, W_KIDLAT + .1)) * (1 - ss(seg(t, W_KIDLAT + .25, W_KIDLAT + .9)));
    setCam({ x: 540, y: 900, z: lerp(1.1, 1.0, ss(seg(v, 0, 2))), focus: 1, dof: 12, t });
    layer(4, () => { nightSky(t, { top: '#04050c', bot: '#1c1e2e' }); g.fillStyle = '#0a0b10'; g.fillRect(-600, 1350, 2300, 1300); });
    layer(1.2, () => { bolt(600, -300, 560, 1180, t, b, 3); manReal(560, 1500, 700, { t, pose: 'down', eyes: 'shut', dust: b, lx: 1, rim: `rgba(200,215,255,${.4 + .5 * b})` }); for (let i = 0; i < 10; i++) { const p = (t * .6 + i / 10) % 1; circ(560 + Math.sin(i * 3 + t) * 60 * p, 1050 - p * 300, 10 + 30 * p, `rgba(160,160,170,${.3 * (1 - p) * clamp((t - W_KIDLAT) * 2)})`); } });
    lightPass(mixHex('#12142a', '#5a6088', b * .6)); rainFx(t, { n: 220, a: .3 }); flares(); }
  else { const shake = ph === 2 ? 4 * (1 - ss(seg(v, 0, 1.6))) : 0, out = ph === 3 ? ss(seg(v, 0, 1.5)) : ss(seg(v, .9, 1.8)) * .35;
    setCam({ x: 540, y: 950, z: lerp(1.15, 1.0, ss(seg(t, W_LINDOL - .2, E('s2') + 1))), focus: 1, dof: 14, shake, t });
    layer(3, () => { g.fillStyle = lg(0, -600, 0, 2000, ['#3a3a40', '#6a6458']); g.fillRect(-600, -600, 2300, 3200); for (let i = 0; i < 6; i++) { g.fillStyle = '#4a4844'; g.save(); g.translate(-200 + i * 260, 1200); g.rotate((hash(i) - .5) * .4); g.fillRect(-90, -700, 180, 700); g.restore(); } dustCloud(t, 540, 1200, 900, .7); });
    layer(1, () => { rubble(-200, 1300, 1300, 2200, t, 4); manReal(540, lerp(1900, 1600, out), 820, { t, pose: out > .5 ? 'brush' : 'reach', dust: 1, eyes: out > .3 ? 'open' : 'shut', lx: -1, rim: 'rgba(255,230,190,.5)' }); rubble(-200, 1700, 1300, 2300, t, 9); });
    L(540, 800, 1600, C.white, .8, 0); lightPass('#5a5450'); reset(); dustCloud(t, 540, 1700, 1100, .4); flares(); }
  const n = ph === 0 ? (t > W_TRUCK + .2 ? 2 : 1) : ph === 1 ? 3 : 4, pop = back(seg(t, [W_TRUCK + .2, W_KIDLAT, W_LINDOL, W_BUMANGON][Math.min(ph, 3)], [W_TRUCK + .2, W_KIDLAT, W_LINDOL, W_BUMANGON][Math.min(ph, 3)] + .25), 2);
  reset(); g.save(); g.translate(CX, 380); g.scale(pop || 1, pop || 1); glass(-300, -80, 600, 160, 26, RED, 4, 'rgba(255,49,80,.8)'); text(`PATAY: ${n} BESES`, 0, 4, 76, '#fff', 'Anton'); g.restore();
};
// ---------- family: a warm living room; over his shoulder, his little girl on the sofa asks why he never gets old ----------
S.family = (t, u) => { const f = ss(seg(t, T('L1') - .4, T('L1') + .3));
  setCam({ x: lerp(560, 600, f), y: lerp(900, 860, f), z: lerp(1.0, 1.2, f), focus: lerp(1.3, 1.0, f), dof: 26, t });
  layer(2.6, () => { homeRoom(t); });
  layer(1.6, () => { sofa(-80, 1150, 1240, 520); manReal(260, 1620, 820, { t, cloth: WIFE, female: 1, pose: 'hands', smile: 1, look: .4, lx: 1, rim: 'rgba(255,200,140,.5)' }); });
  layer(1, () => { const kx = 680, ky = 1560; g.beginPath(); g.moveTo(kx - 150, ky + 500); g.quadraticCurveTo(kx - 160, ky - 40, kx - 60, ky - 80); g.lineTo(kx + 60, ky - 80); g.quadraticCurveTo(kx + 160, ky - 40, kx + 150, ky + 500); g.closePath(); g.fillStyle = lg(kx - 150, 0, kx + 150, 0, KID.dress); g.fill();
    kidFace(kx, ky - 220, 150, { t, eyes: 'open', look: -.6, lookY: -.3, mouth: t > T('L1') && t < E('L1') ? .15 + .15 * Math.abs(Math.sin(t * 9)) : 0, lx: 1 }); });
  layer(.6, () => { ell(-40, 1500, 420, 700); g.fillStyle = lg(-400, 900, 300, 2100, [YOU.shirt[1], YOU.shirt[2], '#2a2826']); g.fill(); ell(80, 820, 200, 240); g.fillStyle = YOU.hair[1]; g.fill(); });
  lightPass('#3a2a26'); flares(); };
// ---------- the mirror: thirty years go by in a few seconds; her face ages beside his, his doesn't; the calendar flips ----------
S.mirror = (t, u) => { const age = ss(seg(t, T('s4') + .2, W_IKAW4)), yr = Math.round(lerp(2034, 2064, age));
  setCam({ x: 540, y: 880, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 14, t });
  layer(2, () => { g.fillStyle = '#c8d0d4'; g.fillRect(-600, -600, 2300, 3200); for (let y = -600; y < 2600; y += 70) for (let x = -600; x < 1700; x += 70) { g.strokeStyle = 'rgba(80,90,100,.25)'; g.lineWidth = 2; g.strokeRect(x, y, 70, 70); }
    rr(840, 260, 200, 260, 6); fs('#f4f0e6', 3); g.fillStyle = '#b02a2a'; g.fillRect(840, 260, 200, 70); text(String(yr), 940, 296, 46, '#fff', 'Anton'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { g.fillStyle = 'rgba(40,30,20,.5)'; g.fillRect(856 + c * 30, 350 + r * 38, 18, 18); } });
  layer(1, () => { rr(60, 200, 760, 1100, 20); fs('#8a8e94', 10); g.save(); rr(70, 210, 740, 1080, 14); g.clip(); g.fillStyle = '#5a5e64'; g.fillRect(70, 210, 740, 1080);
    const wifeHair = [mixHex('#120d0b', '#e8e6e2', age), mixHex('#261c17', '#c4c0ba', age), mixHex('#3e3028', '#86827c', age)];
    bust(560, 1500, 520, { t, skin: WIFE.skin, hair: wifeHair, shirt: WIFE.dress, collar: 0, female: 1, age, eyes: 'open', look: -.5, lx: 1, hairStyle: age > .6 ? 'bun' : 'long' });
    bust(290, 1520, 600, { t, skin: YOU.skin, hair: YOU.hair, shirt: YOU.shirt, eyes: 'open', look: .1, lx: 1, rim: 'rgba(255,240,220,.4)' });
    g.fillStyle = lg(70, 210, 810, 1290, ['rgba(255,255,255,.12)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.06)']); g.fillRect(70, 210, 740, 1080); g.restore();
    rr(0, 1360, 1080, 80, 6); fs('#e8e8e4', 3); });
  L(440, 300, 1300, C.white, .9, .05); lightPass('#7a7c80'); flares(); };
// ---------- the funerals: a slow dolly along the graves in the rain; first Nanay, then his wife; he never changes ----------
S.funeral = (t, u) => { const px = lerp(-80, 760, ss(seg(t, T('s5'), E('s5') + .6)));
  setCam({ x: 540 + px, y: 900, z: 1.05, focus: 1.2, dof: 14, t });
  layer(4, () => { grad('#5a6070', '#8a8e94', -600, 1800); for (let i = 0; i < 9; i++) { g.fillStyle = '#3a4440'; ell(-600 + i * 400, 1150, 260, 140); g.fill(); } });
  layer(1.6, () => { g.fillStyle = '#3e4a38'; g.fillRect(-900, 1250, 4400, 1400); for (let i = 0; i < 10; i++) tomb(-300 + i * 330, 1380, 170, '', '', t, { flowers: 0, moss: .3 }); });
  layer(1.2, () => { tomb(380, 1700, 300, 'NANAY', '1971 - 2066', t, {}); tomb(1220, 1700, 300, 'MARIA', '2001 - 2071', t, {});
    for (let i = 0; i < 5; i++) { const mx = 120 + i * 220 + px * .2, hh = 640; manReal(mx, 1780, hh, { t, cloth: { skin: OLD.skin, hair: OLD.hair, shirt: ['#2a2a2e', '#1a1a1e', '#0c0c0e'], pants: ['#1a1a1e', '#121214', '#08080a'] }, age: 1, lx: -1, eyes: 'shut' }); } });
  layer(1, () => { manReal(840 + px * .9, 1900, 900, { t, cloth: { ...YOU, shirt: ['#2a2a30', '#18181c', '#0a0a0c'] }, pose: 'hold', lx: -1, look: -.3, tear: 1, rim: 'rgba(220,230,255,.4)' });
    const ux = 840 + px * .9 + 70, uy = 1900 - 900 * .62; line([[ux, uy], [ux, uy - 420]], 8, '#16161a'); g.beginPath(); g.moveTo(ux - 320, uy - 400); g.quadraticCurveTo(ux, uy - 620, ux + 320, uy - 400); g.closePath(); g.fillStyle = '#0c0c10'; g.fill(); });
  L(540 + px, 600, 1700, C.white, .8, 0); lightPass('#4a4e58'); rainFx(t, { n: 200, a: .25, ang: .05 }); flares(); };
// ---------- the deathbed: an old, old hand in his young one; the focus pulls to her face, then to his ----------
S.deathbed = (t, u) => { const fh = ss(seg(t, T('L2') - .5, T('L2') + .2)), fm = ss(seg(t, E('L2') + .1, E('L2') + .9)), flat = ss(seg(t, E('L2') + .4, E('L2') + 1.4));
  setCam({ x: 540, y: lerp(lerp(1350, 760, fh), 720, fm), z: lerp(1.25, 1.05, fh), focus: fh > .5 && fm < .5 ? 1.4 : 1, dof: 26, t });
  layer(2.6, () => { g.fillStyle = lg(0, -600, 0, 2600, ['#2a3438', '#14181c']); g.fillRect(-600, -600, 2300, 3200); rr(760, 300, 260, 200, 10); fs('#0a0c0e', 4);
    const tr = []; for (let x = 0; x < 240; x += 4) { const p = (x / 240 + t * .5) % 1, beat = flat > .9 ? 0 : (1 - flat) * (Math.exp(-(((p - .5) / .02) ** 2)) * 60 - Math.exp(-(((p - .55) / .02) ** 2)) * 25); tr.push([770 + x, 420 - beat]); } line(tr, 4, `rgba(110,255,160,${.9})`); L(890, 400, 300, '110,255,160', .7, .15);
    rr(-200, 980, 1500, 600, 40); fs(lg(0, 980, 0, 1580, ['#e8eef0', '#a8b0b4']), 3); });
  layer(1.4, () => { g.save(); g.translate(500, 920); g.rotate(-.15); faceReal(0, 0, 210, { t, skin: OLD.skin, hair: OLD.hair, female: 1, age: 1, eyes: fm > .6 ? 'shut' : 'open', look: .4, tear: 1, lx: 1, hairStyle: 'long', mouth: t > T('L2') && t < E('L2') ? .1 + .1 * Math.abs(Math.sin(t * 8)) : 0 }); g.restore(); });
  layer(1, () => { const hx = 520, hy = 1420; handReal(hx - 240, hy + 40, 300, -.1, { skin: OLD.skin, curl: .45, sg: 1 }); for (let i = 0; i < 30; i++) curve([hx - 200 + hash(i) * 200, hy - 20 + hash(i * 2) * 100], [hx - 190 + hash(i) * 200, hy + hash(i * 3) * 100], [hx - 180 + hash(i) * 200, hy - 10 + hash(i * 2) * 100], 1.5, 'rgba(80,50,40,.35)');
    handReal(hx + 300, hy - 20, 330, Math.PI + .15, { skin: YOU.skin, curl: .5, sg: -1 });
    g.save(); g.globalAlpha = fm; faceReal(840, 760, 200, { t, skin: YOU.skin, hair: YOU.hair, eyes: 'open', look: -.5, lookY: .3, tear: 1, lx: -1, rim: 'rgba(200,220,255,.4)' }); g.restore(); });
  L(540, 900, 1300, '220,230,240', .75, .04); lightPass('#3a4246'); flares(); };
// ---------- the graves: him alone in a field of stones; the seasons and the days turn over him (slowly), moss climbs the stones ----------
S.graves = (t, u) => { const d = seg(u, 0, span('s7') + 1.2), day = .5 + .5 * Math.sin(u * 1.4);
  setCam({ x: 540, y: lerp(820, 900, d), z: lerp(1.0, 1.15, ss(d)), focus: 1, dof: 10, t });
  layer(5, () => { grad(mixHex('#0c1424', '#7a9ab8', day), mixHex('#1a2030', '#e8c8a0', day), -600, 1600); });
  layer(2, () => { g.fillStyle = mixHex('#1a2418', '#4a6a3a', day); g.fillRect(-900, 1200, 2900, 1500); for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) tomb(-100 + i * 200 + (r % 2) * 100, 1260 + r * 120, 70 + r * 25, '', '', t, { moss: d, flowers: 0 }); });
  layer(1, () => { manReal(540, 1900, 820, { t, cloth: { ...YOU, shirt: ['#3a3a40', '#26262c', '#121216'] }, lx: -1, look: 0, eyes: 'open', rim: 'rgba(255,220,180,.4)' }); for (let i = 0; i < 40; i++) { const x = hash(i * 2.2) * 1300 - 100; line([[x, 2000], [x + Math.sin(t + i) * 10, 2000 - 60 - 120 * d * hash(i)]], 4, mixHex('#1a2a14', '#5a8a3a', day)); } });
  L(540, 400, 1800, C.gold, .4 + .5 * day, .05); lightPass(mixHex('#1a2030', '#9a9a98', day)); flares(); };
// ---------- new names: his ID cards over two centuries, same face, different names, dropping onto the table ----------
const NAMES = [['JUAN DELA CRUZ', 2026], ['MIGUEL SANTOS', 2046], ['RAFAEL REYES', 2066], ['ANDRES BAUTISTA', 2086], ['LUIS MENDOZA', 2106], ['ELIAS RAMOS', 2126], ['CARLOS VILLANUEVA', 2146], ['NOEL AQUINO', 2166], ['TOMAS GARCIA', 2186]];
S.names = (t, u) => { const n = clamp(Math.floor(seg(u, 0, span('s8')) * 9.99), 0, 8);
  setCam({ x: 540, y: lerp(900, 1000, ss(seg(u, 0, 7))), z: lerp(1.0, 1.15, ss(seg(u, 0, 7))), rot: .04 - u * .01, focus: 1, dof: 12, t });
  layer(1.3, () => { g.save(); g.fillStyle = pat(TEX.wood); g.fillRect(-600, -600, 2300, 3200); g.restore(); g.fillStyle = 'rgba(30,20,10,.3)'; g.fillRect(-600, -600, 2300, 3200); });
  layer(1, () => { for (let i = 0; i <= n; i++) { const k = i === n ? eo(seg(u, i * span('s8') / 10, i * span('s8') / 10 + .3)) : 1; idCard(540 + (hash(i * 3.3) - .5) * 260, lerp(300, 950, k) + (hash(i * 5.1) - .5) * 300 + i * 20, 620, (hash(i * 7.7) - .5) * .5, NAMES[i][0], NAMES[i][1], t + i); } });
  L(540, 800, 1300, C.gold, .9, .05); lightPass('#3a2c22'); flares(); };
// ---------- the question: an hourglass, its sand running upward ----------
S.cta = (t, u) => { setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 18, t });
  layer(3, () => { g.fillStyle = '#0a0a10'; g.fillRect(-600, -600, 2300, 3200); starfield(t, 160, .6, 3); });
  layer(1, () => { hourglass(540, 1050, 420, t, seg(u, 0, 8)); });
  lightPass('#1a1820'); flares();
  const k1 = back(seg(t, T('cta') + .2, T('cta') + .5), 1.8), k2 = back(seg(t, W_OO - .1, W_OO + .2), 2); if (k1 > 0) { reset(); g.save(); g.translate(CX, 380); g.scale(k1, k1); glass(-460, -150, 920, 300, 40, 'rgba(255,255,255,.6)', 4, 'rgba(255,200,120,.5)'); text('GUGUSTUHIN MO PA BA', 0, -60, 70, '#fff', 'Anton', 'center', 10); text('NA HINDI MAMATAY?', 0, 30, 84, '#ffd27a', 'Anton', 'center', 10);
    if (k2 > 0) { g.save(); g.translate(0, 110); g.scale(k2, k2); text('COMMENT: OO o HINDI', 0, 0, 46, '#ff8a96', 'Anton'); g.restore(); } g.restore(); } };
// ---------- a thousand years: Manila under the sea; Quiapo's dome and cross above the water; a little boat; then down into the water to the old house ----------
S.flood = (t, u) => { const dive = ss(seg(t, W_BAHAY - 1.6, W_BAHAY + .4));
  setCam({ x: 540, y: lerp(880, 2700, dive), z: lerp(1.0, 1.1, ss(seg(u, 0, 4))), focus: 1, dof: 10, t });
  layer(5, () => { grad('#2a1a3a', '#ff9a5a', -600, 1300); glow(540, 1150, 500, C.sun, .7); circ(540, 1200, 140, '#ffd08a'); L(540, 1150, 1600, C.gold, .9, .2); });
  layer(2.4, () => { for (const [x, h] of [[-100, 380], [120, 520], [930, 460], [1140, 300]]) { g.fillStyle = '#2a2026'; g.fillRect(x - 60, 1250 - h, 120, h + 40); for (let k = 0; k < h / 40; k++) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 50, 1250 - h + 10 + k * 40, 100, 14); } g.fillStyle = 'rgba(140,70,40,.35)'; g.fillRect(x - 60, 1250 - h, 20, h); } quiapo(540, 1260, 230, t); });
  layer(1.6, () => { sea(t, 1250, { sunX: 540 }); bangka(380, 1420, 160, t); manReal(380, 1400, 260, { t, pose: 'reach', lx: 1, rim: 'rgba(255,190,120,.7)', look: -.5 });
    g.fillStyle = lg(0, 1700, 0, 4200, ['#0e3a52', '#062030', '#020a10']); g.fillRect(-900, 1700, 2900, 2600);
    g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 9; i++) { const x = 100 + i * 120 + Math.sin(t * .4 + i) * 40; beam([[x - 20, 1700], [x + 20, 1700], [x + 160, 3600], [x - 120, 3600]], x, 1700, x, 3600, C.sea, .12); } g.restore();
    const hx = 540, hy = 3300; g.fillStyle = '#2a3a3a'; g.fillRect(hx - 340, hy - 300, 680, 600); path([[hx - 400, hy - 300], [hx, hy - 560], [hx + 400, hy - 300]]); g.closePath(); g.fillStyle = '#3a2a24'; g.fill();
    rr(hx - 230, hy - 220, 460, 90, 8); fs('#c8a050', 3); text('SARI-SARI STORE', hx, hy - 175, 48, '#3a2a10', 'Anton'); for (const wx of [-180, 60]) { rr(hx + wx, hy - 90, 130, 150, 6); fs('#0a1418', 4); } rr(hx - 60, hy + 60, 120, 240, 6); fs('#1a1410', 3);
    for (let i = 0; i < 40; i++) { const c = ((t * .2 + hash(i)) % 1); circ(hx + (hash(i * 3) - .5) * 900, hy - 400 - c * 1100, 3 + 4 * hash(i), `rgba(200,240,255,${.4 * (1 - c)})`); }
    for (let i = 0; i < 6; i++) { const fx = ((t * 40 * (1 + hash(i)) + hash(i) * 1600) % 1600) - 300, fy = 2700 + hash(i * 2) * 500; ell(fx, fy, 22, 9); g.fillStyle = '#5a8aa0'; g.fill(); path([[fx - 22, fy], [fx - 38, fy - 10], [fx - 38, fy + 10]]); g.closePath(); g.fill(); }
    L(hx, hy - 300, 900, C.sea, .7 * dive, .05); });
  lightPass(mixHex('#3a2a40', '#0a2a3a', dive)); flares(); };
// ---------- a million years: tall, pale people of the far future in a strange city; they look at him; then him alone by a fire, a photo in his hand ----------
S.future = (t, u) => { const alone = ss(seg(t, T('s12') - .3, T('s12') + .5));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 8))), focus: alone > .5 ? 1 : 1.5, dof: 14, t });
  if (alone < 1) { layer(5, () => { grad('#1a1440', '#6a4a8a', -600, 1800); nebula(t, 540, 300, 700, '180,120,255', '120,200,255', .4); for (let i = 0; i < 7; i++) { const x = -100 + i * 200, hh = 900 + 500 * hash(i); g.fillStyle = lg(0, 1300 - hh, 0, 1300, ['rgba(200,220,255,.5)', 'rgba(60,40,120,.8)']); g.beginPath(); g.moveTo(x - 50, 1300); g.quadraticCurveTo(x - 10, 1300 - hh * .6, x, 1300 - hh); g.quadraticCurveTo(x + 10, 1300 - hh * .6, x + 50, 1300); g.closePath(); g.fill(); circ(x, 1300 - hh, 20, '#e8f0ff'); L(x, 1300 - hh, 200, '200,220,255', .8, .3); } });
    layer(1.5, () => { g.fillStyle = '#2a2040'; g.fillRect(-900, 1300, 2900, 1300); for (let i = 0; i < 5; i++) { const x = 120 + i * 210, y = 1700, hh = 1050; g.save(); g.globalAlpha = 1 - alone; ell(x, y - hh * .92, hh * .045, hh * .07); g.fillStyle = '#c8d0e8'; g.fill(); for (const sg of [-1, 1]) { ell(x + sg * hh * .015, y - hh * .92, hh * .01, hh * .016); g.fillStyle = '#0a0a20'; g.fill(); circ(x + sg * hh * .015, y - hh * .92, 2, '#aaf'); } rr(x - hh * .05, y - hh * .85, hh * .1, hh * .85, hh * .04); g.fillStyle = lg(x - hh * .05, 0, x + hh * .05, 0, ['#e8ecf8', '#9aa0c0']); g.fill(); L(x, y - hh * .5, 300, '200,210,255', .6, .1); g.restore(); } });
    layer(1, () => { g.save(); g.globalAlpha = 1 - alone; manReal(560, 1900, 760, { t, cloth: { ...YOU, shirt: ['#6a5a4a', '#4a3e32', '#2a221a'] }, lx: 1, look: -.3, rim: 'rgba(200,180,255,.5)' }); g.restore(); }); }
  if (alone > 0) { g.save(); g.globalAlpha = alone; layer(3, () => { g.fillStyle = '#05060c'; g.fillRect(-600, -600, 2300, 3200); starfield(t, 300, 1, 9); });
    layer(1, () => { g.fillStyle = '#100c0a'; g.fillRect(-600, 1600, 2300, 1000); for (let k = 0; k < 5; k++) { g.save(); g.translate(700, 1640); g.rotate(-1 + k * .5); g.fillStyle = '#3a2618'; g.fillRect(-10, -80, 20, 100); g.restore(); } fire(700, 1640, 120, 220, t, 1);
      bust(400, 1900, 640, { t, skin: YOU.skin, hair: YOU.hair, shirt: ['#5a4a3a', '#3e3228', '#1e1814'], eyes: 'open', look: .6, lookY: .4, tear: 1, lx: 1, rim: 'rgba(255,150,70,.7)', mouth: .1 + .08 * Math.abs(Math.sin(t * 6)) });
      rr(520, 1640, 110, 140, 6); fs('#e8e2d0', 3); g.save(); rr(530, 1650, 90, 110, 4); g.clip(); kidFace(575, 1700, 40, { t, eyes: 'open', smile: 1, lx: -1 }); g.restore(); handReal(540, 1840, 160, -1.3, { skin: YOU.skin, curl: .5 }); });
    g.restore(); }
  lightPass(alone > .5 ? '#1a1214' : '#2a2240'); embersUp(t, alone > .5 ? 20 : 0, .6, .3); flares(); };
// ---------- a billion years: the sun fills the sky, the sea boils to steam, the ground cracks; the air shimmers; he is the last thing alive ----------
S.sun = (t, u) => { const boil = ss(seg(t, W_KUMUKULO - .3, W_KUMUKULO + 1.5));
  setCam({ x: 540, y: lerp(900, 980, ss(seg(u, 0, 7))), z: lerp(1.05, 1.0, ss(seg(u, 0, 7))), focus: 1.2, dof: 0, t });
  layer(6, () => { grad('#2a0604', '#ff6a20', -600, 1500); redSun(540, 760, lerp(420, 520, ss(seg(u, 0, 8))), t); });
  layer(2, () => { g.fillStyle = lg(0, 1300, 0, 2600, ['#6a2a14', '#2a0a04']); g.fillRect(-900, 1300, 2900, 1500); for (let i = 0; i < 40; i++) { const x = hash(i * 2.2) * 1800 - 400, y = 1350 + hash(i * 3.3) ** 2 * 1100; line([[x, y], [x + 40 + 80 * hash(i), y + (hash(i) - .5) * 30], [x + 70 + 140 * hash(i), y + (hash(i * 5) - .5) * 40]], 2 + 3 * hash(i), 'rgba(255,120,40,.5)'); }
    for (let i = 0; i < 18; i++) { const p = ((t * .15 + i / 18) % 1), x = hash(i * 7.1) * 1400 - 160; circ(x + Math.sin(p * 4 + i) * 40, 1320 - p * 600, 30 + 120 * p, `rgba(255,230,210,${.35 * boil * (1 - p)})`); } });
  layer(1, () => { manReal(540, 1950, 600, { t, cloth: { ...YOU, shirt: ['#4a3a30', '#2a2018', '#120c08'] }, lx: 0, rim: 'rgba(255,140,60,.8)', eyes: 'open', look: 0, lookY: -.6 }); });
  lightPass('#5a1a10'); shimmer(t, 1, 800, H); embersUp(t, 40, .6, .3); flares(); };
// ---------- five billion years: the swollen sun swallows the Earth; he floats in the foreground, alive ----------
S.swallow = (t, u) => { const k = ss(seg(t, W_NILAMON - .5, W_NILAMON + 1.6)), fl = ss(seg(t, W_LUMUTANG - .4, W_LUMUTANG + .8));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.08, ss(seg(u, 0, 7))), focus: lerp(3, 1, fl), dof: 8, t });
  layer(8, () => { g.fillStyle = '#020206'; g.fillRect(-900, -900, 2900, 3800); starfield(t, 300, .9, 1); nebula(t, 900, 300, 600, '255,100,60', '120,60,200', .25); });
  layer(3, () => { redSun(lerp(-60, 160, k), 820, lerp(380, 640, k), t); const ex = lerp(760, 640, k); g.save(); g.globalAlpha = 1 - ss(seg(k, .75, 1)); earth(ex, 900, 120 * (1 - .3 * k), t, { burn: k, lit: -1 }); g.restore(); if (k > .7) glow(ex, 900, 300, C.ember, (k - .7) * 2); });
  layer(1, () => { g.save(); g.globalAlpha = fl; g.translate(700, 1450); g.rotate(-.4 + Math.sin(t * .3) * .1); manReal(0, 400, 820, { t, cloth: { ...YOU, shirt: ['#3a2e26', '#22201a', '#100c08'] }, pose: 'reach', lx: -1, rim: 'rgba(255,120,60,.8)', eyes: 'open', look: -.6 }); g.restore(); });
  lightPass('#1a0c10'); flares(); };
// ---------- drifting: his face close, eyes open, no breath, no sound; stars wheel slowly behind ----------
S.drift = (t, u) => { setCam({ x: 540, y: 900, z: lerp(1.0, 1.12, ss(seg(u, 0, 6))), rot: u * .03, focus: 1, dof: 14, t });
  layer(4, () => { g.fillStyle = '#010104'; g.fillRect(-900, -900, 2900, 3800); g.save(); g.translate(540, 900); g.rotate(t * .02); g.translate(-540, -900); starfield(t, 400, 1, 5); g.restore(); });
  layer(1, () => { bust(540, 1700, 760, { t, skin: YOU.skin, hair: YOU.hair, shirt: ['#2a2420', '#1a1612', '#0a0806'], eyes: 'open', look: .1, lookY: -.1, lx: 1, breathe: 0, rim: 'rgba(170,190,255,.5)' });
    for (let i = 0; i < 20; i++) circ(400 + hash(i * 2) * 280, 760 + hash(i * 3) * 120, 2 + 2 * hash(i), 'rgba(220,235,255,.6)'); });
  L(1000, 600, 1200, '170,190,255', .6, .05); lightPass('#0c0e18'); flares(); };
// ---------- a hundred trillion years: the stars go out one by one ----------
S.stars = (t, u) => { const die = ss(seg(t, W_ISAISA - .3, E('s16') + 1.5));
  setCam({ x: 540, y: 900, z: lerp(1.15, 1.0, ss(seg(u, 0, 6))), focus: 1, dof: 0, t });
  layer(1, () => { g.fillStyle = '#000003'; g.fillRect(-900, -900, 2900, 3800); nebula(t, 540, 900, 900, '120,90,200', '60,120,200', .35 * (1 - die)); starfield(t, 900, 1, 2, die * .97);
    g.save(); g.translate(540, 900); g.rotate(.4); for (let i = 0; i < 400; i++) { const a = i * .15, d = 20 + i * 1.4; circ(Math.cos(a) * d * 1.6, Math.sin(a) * d * .5, 1.5, `rgba(220,210,255,${.5 * (1 - die) * (1 - i / 400)})`); } g.restore(); });
  lightPass('#0c0c18'); flares(); };
// ---------- the dark: one last ember of light on his face, and then nothing; a slow drift of dust ----------
S.dark = (t, u) => { const k = ss(seg(t, W_DILIM - 1.2, W_DILIM + 1.2));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 10, t });
  layer(1, () => { g.fillStyle = '#000'; g.fillRect(-900, -900, 2900, 3800); g.save(); g.globalAlpha = 1 - k; bust(540, 1700, 700, { t, skin: YOU.skin, hair: YOU.hair, shirt: ['#1a1612', '#100c0a', '#060404'], eyes: 'open', look: 0, lx: 1, breathe: 0, rim: 'rgba(255,180,120,.6)' }); g.restore(); L(700, 900, 500, C.ember, .5 * (1 - k), .05 * (1 - k)); });
  lightPass('#000000'); reset(); for (let i = 0; i < 30; i++) circ(hash(i * 3.3) * W, ((hash(i) * H + t * 8) % H), 1.2, `rgba(140,140,160,${.25 * (1 - k * .5)})`); };
// ---------- a memory: out of the dark, a warm afternoon; his little girl running to him across the grass, laughing ----------
S.memory = (t, u) => { const k = ss(seg(t, T('L3') - 1.4, T('L3') + .2)), run = seg(t, T('L3') - 1.2, E('L3') + 1.2);
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 30, t });
  layer(1, () => { g.fillStyle = '#000'; g.fillRect(-900, -900, 2900, 3800); });
  g.save(); g.globalAlpha = k;
  layer(4, () => { grad('#ffd8a0', '#ffb070', -600, 1300); glow(820, 500, 600, C.gold, .8); for (let i = 0; i < 5; i++) palm(-100 + i * 300, 1350, 700 + 100 * hash(i), t, i, '#5a7a3a'); });
  layer(1.6, () => { g.fillStyle = lg(0, 1300, 0, 2600, ['#8ab060', '#4a7a30']); g.fillRect(-900, 1300, 2900, 1400); for (let i = 0; i < 120; i++) { const x = hash(i * 2.7) * 1400 - 160, y = 1320 + hash(i * 3.1) * 900; line([[x, y], [x + Math.sin(t + i) * 6, y - 20 - 30 * hash(i)]], 3, '#3a6a24'); } });
  layer(1, () => { const kx = lerp(900, 560, ss(run)), ky = 1700, bob = Math.abs(Math.sin(t * 8)) * 20; g.beginPath(); g.moveTo(kx - 110, ky - bob); g.quadraticCurveTo(kx - 120, ky - 300 - bob, kx - 40, ky - 330 - bob); g.lineTo(kx + 40, ky - 330 - bob); g.quadraticCurveTo(kx + 120, ky - 300 - bob, kx + 110, ky - bob); g.closePath(); g.fillStyle = lg(kx - 110, 0, kx + 110, 0, KID.dress); g.fill();
    for (const sg of [-1, 1]) limb([[kx + sg * 50, ky - bob], [kx + sg * 60 + Math.sin(t * 8 + sg) * 30, ky + 100], [kx + sg * 55 + Math.sin(t * 8 + sg) * 40, ky + 190]], 34, KID.skin);
    kidFace(kx, ky - 430 - bob, 110, { t, eyes: 'open', smile: 1, mouth: .35, look: -.5, lx: 1 }); });
  g.restore();
  lightPass(mixHex('#000000', '#c8a888', k)); leaks(t, k); };
// ---------- the end: back to the beginning of it all, the living room; he holds his little girl tight; YAKAPIN MO SILA NGAYON ----------
S.end = (t, u) => { const hug = ss(seg(t, T('s19'), T('s19') + 1.2));
  setCam({ x: 540, y: lerp(900, 840, ss(seg(u, 0, 9))), z: lerp(1.05, 1.25, ss(seg(u, 0, 9))), focus: 1, dof: 24, t });
  layer(2.4, () => { homeRoom(t); });
  layer(1, () => { const x = 540; bust(x - 120, 2100, 900, { t, skin: YOU.skin, hair: YOU.hair, shirt: YOU.shirt, eyes: 'shut', tear: 1, smile: 1, lx: 1, rim: 'rgba(255,200,140,.5)' });
    g.beginPath(); g.moveTo(x + 40, 2100); g.quadraticCurveTo(x + 30, 1600, x + 160, 1560); g.lineTo(x + 320, 1560); g.quadraticCurveTo(x + 440, 1600, x + 430, 2100); g.closePath(); g.fillStyle = lg(x, 0, x + 440, 0, KID.dress); g.fill();
    kidFace(x + 240, 1380, 140, { t, eyes: 'shut', smile: 1, lx: -1, turn: -.3 });
    for (const sg of [-1, 1]) { limb([[x - 120 + sg * 280, 1750], [x + 40 + sg * 40, 1820], [x + 230 + sg * 80, 1700]], 90, YOU.shirt, 1); } handReal(x + 330, 1690, 200, -.6, { skin: YOU.skin, curl: .5 }); });
  lightPass('#4a3428'); leaks(t, .6); flares();
  const a = back(seg(t, W_YAKAPIN - .1, W_YAKAPIN + .25), 1.6); if (a > 0) { reset(); g.save(); g.translate(CX, 420); g.scale(a, a); g.shadowColor = 'rgba(255,190,120,.9)'; g.shadowBlur = 36; text('YAKAPIN MO SILA', 0, -60, 100, '#fff', 'Anton', 'center', 12); text('NGAYON.', 0, 60, 150, '#ffd27a', 'Anton', 'center', 14); g.restore(); } };

// ---------- the year counter (an odometer: the digits roll up between shots) ----------
const YEAR = { fall: 1, rise: 1, viral: 1, accidents: 4, family: 9, mirror: 30, funeral: 62, deathbed: 91, graves: 92, names: 260, flood: 1000, future: 1e6, sun: 1e9, swallow: 5e9, drift: 5e9, stars: 1e14, dark: -1, loop: 1 };
function yearCounter(t, sh, u) {
  const v = YEAR[sh[2]]; if (v === undefined) return; const prevSh = SHOTS[SHOTS.indexOf(sh) - 1], pv = prevSh && YEAR[prevSh[2]] > 0 ? YEAR[prevSh[2]] : v;
  const k = ss(seg(u, .05, 1.1)), a = ss(seg(u, 0, .25));
  let s; if (v < 0) s = '∞'; else { const val = Math.exp(lerp(Math.log(pv + 1), Math.log(v + 1), k)) - 1; s = Math.round(val).toLocaleString('en-US'); }
  reset(); g.globalAlpha = a; g.save(); g.translate(CX, 200);
  g.font = '120px Anton'; const w = Math.min(980, g.measureText(s).width + 80), sc = Math.min(1, 900 / g.measureText(s).width);
  glass(-w / 2, -95, w, 190, 28, 'rgba(255,210,122,.5)', 3, 'rgba(255,170,80,.5)'); text('TAON', 0, -60, 34, '#ffd27a', 'Anton');
  g.save(); g.translate(0, 20); g.scale(sc, sc); if (k < 1 && k > 0) { g.filter = `blur(${(Math.sin(k * Math.PI) * 3).toFixed(1)}px)`; } g.shadowColor = 'rgba(255,170,80,.8)'; g.shadowBlur = 26; text(s, 0, 0, 120, '#fff', 'Anton', 'center', 10); g.restore();
  g.restore(); g.globalAlpha = 1;
}
function titleCard(t, a) {
  if (a <= 0) return; reset(); g.globalAlpha = a; g.save(); g.translate(CX, 470);
  glass(-480, -160, 960, 320, 36, 'rgba(255,120,60,.6)', 3, 'rgba(255,120,60,.6)');
  text('PAANO KUNG', 0, -80, 80, '#f4f1ea', 'Anton', 'center', 12);
  g.font = '130px Anton'; const s2 = Math.min(1, 900 / g.measureText('HINDI KA NAMAMATAY?').width); g.save(); g.translate(0, 45); g.scale(s2, s2); g.shadowColor = 'rgba(255,90,40,.9)'; g.shadowBlur = 34; text('HINDI KA NAMAMATAY?', 0, 0, 130, '#ff7a4a', 'Anton', 'center', 14); g.restore();
  g.restore(); g.globalAlpha = 1;
}
function grain(t) { reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .09; const f = Math.floor(t * 24), ox = -hash(f) * 300, oy = -hash(f * 1.7) * 300; g.drawImage(TEX.paper, ox, oy, W + 300, H + 300); reset(); }
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .28; g.filter = 'blur(18px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .2, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
function bokeh(t, n, y0, y1, sp = 30, a = .7, seed = 0) { for (let i = 0; i < n; i++) { const c = [C.sodium || '255,150,60', C.warm, C.red, C.cyan, C.mag, C.grn][Math.floor(hash(i * 3.3 + seed) * 6)], x = ((hash(i * 1.7 + seed) * 1600 + t * sp * (.5 + hash(i))) % 1600) - 260, y = lerp(y0, y1, hash(i * 5.9 + seed)), r = 20 + 60 * hash(i * 2.2 + seed); g.fillStyle = rg(x, y, r * .5, r, [`rgba(${c},${a * .5})`, `rgba(${c},${a * .35})`, `rgba(${c},0)`]); g.fillRect(x - r, y - r, 2 * r, 2 * r); L(x, y, r * 1.5, null, .5); } }

const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = []; FLARES.length = 0;
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1; S[sh[2]](t, u);
  bloom(); vignette(.6); grain(t); reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5; g.drawImage(TEX.brush, 0, 0); reset();
  if (sh[0] > 0 && sh[2] !== 'rise') { const d = 1 - ss(seg(u, 0, .22)); if (d > 0) { reset(); g.fillStyle = `rgba(0,0,0,${.75 * d})`; g.fillRect(0, 0, W, H); } }
  const nx = SHOTS[SHOTS.indexOf(sh) + 1]; if (nx && sh[2] !== 'fall') { const d = ss(seg(t, sh[1] - .14, sh[1])); if (d > 0) { reset(); g.fillStyle = `rgba(0,0,0,${.6 * d})`; g.fillRect(0, 0, W, H); } }
  yearCounter(t, sh, u);
  if (sh[2] === 'rise') titleCard(t, ss(seg(t, W_SUMPA - .4, W_SUMPA + .1)) * (1 - ss(seg(t, sh[1] - .4, sh[1]))));
  if (sh[2] === 'loop') titleCard(t, ss(seg(u, .3, .8)));
  if (sh[2] !== 'loop' && sh[2] !== 'end') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);
