
// ---------- places ----------
const S = {};
C.candle = '255,170,70'; C.aur = '90,255,170'; C.aur2 = '255,90,140'; C.sun = '255,190,90';
const RIMC = 'rgba(190,210,255,.5)';
// the skyline at night: lit windows that go dark column by column (dark(k) = 0..1 for column k)
function skyline(t, o = {}) {
  const { dark = () => 0, stars = .4, moonA = 1 } = o;
  g.fillStyle = lg(0, -400, 0, 1500, ['#03040e', '#0b1030', '#1c1a44', '#2a1e44']); g.fillRect(-600, -600, 2300, 2300);
  for (let i = 0; i < 160; i++) star(-400 + hash(i * 3.1) * 1900, -300 + hash(i * 7.3) * 1100, 1.2 + 2.4 * hash(i), `rgba(255,255,255,${stars * (.4 + .5 * Math.sin(t * 1.4 + i))})`);
  if (moonA) { g.save(); g.globalAlpha = moonA; fullMoon(820, 140, 46); g.restore(); }
  g.drawImage(TEX.city, 0, 0, 2400, 900, -500, 520, 2100, 900);
  g.drawImage(TEX.city, 700, 100, 1700, 800, -560, 760, 2200, 1000);
  for (let k = 0; k < 18; k++) { const d = dark(k); if (d <= 0) continue; g.save(); g.globalAlpha = d * .9; g.fillStyle = '#04050c'; g.fillRect(-560 + k * 125, 520, 126, 1300); g.restore(); }
  g.fillStyle = lg(0, 1500, 0, 1800, ['rgba(4,4,12,0)', 'rgba(4,4,12,1)']); g.fillRect(-600, 1500, 2300, 500);
}
// a dark room wall with a window onto the dead city
function roomWall(t, o = {}) {
  const { win = 1, lit = 0 } = o, back_ = keep();
  g.drawImage(TEX.wall, -500, -500); g.fillStyle = '#2a3150'; g.fillRect(-500, 1260, 2100, 900);
  if (win) {
    g.save(); rr(300, 260, 520, 640, 10); g.clip(); g.translate(300, 260); g.scale(.5, .5); skyline(t, { dark: () => 1 - lit, stars: .8 }); g.restore();
    rr(300, 260, 520, 640, 10); g.strokeStyle = OL; g.lineWidth = 28; g.stroke(); g.strokeStyle = '#4a4058'; g.lineWidth = 18; g.stroke(); line([[560, 260], [560, 900]], 14, '#4a4058'); line([[300, 580], [820, 580]], 12, '#4a4058');
  }
  return back_;
}
function candle(x, y, s, t, o = {}) {
  const fl = 1 + .08 * Math.sin(t * 13) + .05 * Math.sin(t * 29);
  rr(x - 16 * s, y - 70 * s, 32 * s, 70 * s, 6 * s); fs(lg(x - 16 * s, 0, x + 16 * s, 0, ['#f4ecd8', '#c8bca0']), 3);
  line([[x, y - 70 * s], [x, y - 82 * s]], 3, '#2a2420');
  L(x, y - 100 * s, 420 * s * fl, C.candle, .95, .3);
  return () => { g.save(); g.translate(x, y - 96 * s); g.scale(fl, fl); g.beginPath(); g.moveTo(0, -30 * s); g.quadraticCurveTo(13 * s, -4 * s, 0, 12 * s); g.quadraticCurveTo(-13 * s, -4 * s, 0, -30 * s); g.fillStyle = lg(0, -30 * s, 0, 12 * s, ['#fff6d0', '#ffb040', '#ff7020']); g.fill(); g.restore(); glow(x, y - 96 * s, 160 * s, C.candle, .6); };
}
function phoneHeld(x, y, s, scr, o = {}) {   // a phone seen from the front, screen colour scr (null = off)
  g.save(); g.translate(x, y); g.scale(s, s); rr(-70, -140, 140, 280, 20); fs('#101016', 4); rr(-60, -128, 120, 256, 12); g.fillStyle = scr || '#05050a'; g.fill();
  if (o.text) { text(o.text, 0, -10, o.size || 22, o.col || '#ff6a7a', 'Anton'); }
  g.restore();
}
// ---------- shots ----------
// 1. the hook: the city at night... every light goes out, block by block
S.hook = (t, u) => {
  const tm = wordT('l01b', 'mamamatay');
  cam(540, 900, lerp(1.18, 1.0, eo(seg(u, 0, 1.6))) * (t > tm ? 1 + .06 * eo(seg(t, tm, tm + .5)) : 1), 0, t > tm && t < tm + .8 ? 12 * (1 - seg(t, tm, tm + .8)) : 0, t);
  const dark = k => ss(seg(t, tm + .04 * Math.abs(k - 8) * 1.4, tm + .1 + .04 * Math.abs(k - 8) * 1.4)), back_ = keep();
  skyline(t, { dark });
  const lit = 1 - ss(seg(t, tm, tm + .8)), pulse = .5 + .5 * Math.sin(t * 9);
  person(540, 2080, 1150, { t, arms: 'phone', eyes: t > tm ? 'wide' : 'open', look: .35, lookY: .2, sweat: t > LN.l01b.t0 ? .6 : 0, tired: .2, lx: 1, rim: t > tm ? 'rgba(140,170,255,.5)' : 'rgba(255,90,110,.6)' });
  L(540, 1050, 1500, C.amb, .95 * lit + .08, .2 * lit); L(540, 700, 1100, '255,150,110', .5 * lit, .1);
  if (t < tm + .3) L(640, 1180, 420, C.red, (.6 + .4 * pulse) * lit, .3 * lit); else L(820, 140, 900, C.moon, .5, .1);
  L(820, 140, 600, C.moon, .8, .12);
  lightPass('#2c2c5a'); back_();
  if (t > tm - .05 && t < tm + .5) { const p = seg(t, tm - .05, tm + .5); glow(540, 1150, 900, '160,200,255', .7 * (1 - p)); }
  // frame 1: an emergency alert slides down over the city, pulsing red
  const ak = eo(seg(t, 0, .35)) * (1 - ss(seg(t, tm + .6, tm + 1.0)));
  if (ak > 0) { reset(); g.save(); g.translate(CX, lerp(420, 640, ak)); g.globalAlpha = ak; glass(-470, -110, 940, 220, 36, `rgba(255,49,80,${.6 + .4 * pulse})`, 5, `rgba(255,49,80,${.5 + .5 * pulse})`);
    g.save(); g.translate(-370, 0); path([[0, -62], [64, 52], [-64, 52]]); g.closePath(); g.fillStyle = RED; g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 30 * pulse; g.fill(); g.shadowBlur = 0; text('!', 0, 14, 72, '#1a0006', 'Anton'); g.restore();
    text(TX.alert[0], 60, -40, 46, '#ff8a96', 'Anton'); text(TX.alert[1], 60, 30, 66, '#fff', 'Anton'); g.restore(); }
  if (t > tm) { reset(); g.fillStyle = `rgba(80,0,10,${.25 * (1 - seg(t, tm, tm + 1.5))})`; g.fillRect(0, 0, W, H); }
};
// 2. it almost happened: a file, a red stamp
S.stamp = (t, u) => {
  const tmu = wordT('l02', 'Muntik'), k = t > tmu ? eo(seg(t, tmu, tmu + .14)) : 0;
  cam(540, 960, lerp(1.05, 1.15, seg(u, 0, span('l02'))), 0, t > tmu && t < tmu + .4 ? 8 * (1 - seg(t, tmu, tmu + .4)) : 0, t);
  const back_ = keep(); g.fillStyle = '#2a1c16'; g.fillRect(-600, -600, 2300, 2400);
  for (let i = 0; i < 9; i++) line([[-600, -200 + i * 260], [1700, -150 + i * 260]], 4, 'rgba(0,0,0,.3)');
  g.save(); g.translate(540, 980); g.rotate(-.04); cshadow(20, 30, 420, 560, .6); rr(-380, -520, 760, 1040, 8); fs('#e8dcc0', 4);
  rr(-380, -560, 260, 60, 8); fs('#d8c8a0', 3); text('NASA · 2012', 0, -440, 54, '#3a2a20', 'Anton');
  for (let i = 0; i < 12; i++) { rr(-300, -340 + i * 58, 520 + 80 * hash(i), 14, 7); g.fillStyle = 'rgba(40,30,20,.45)'; g.fill(); }
  circ(0, 380, 120, 'rgba(255,170,60,.2)'); for (let k2 = 0; k2 < 12; k2++) { const a = k2 / 12 * TAU; line([[Math.cos(a) * 130, 380 + Math.sin(a) * 130], [Math.cos(a) * 170, 380 + Math.sin(a) * 170]], 6, 'rgba(255,150,50,.5)'); } circ(0, 380, 90, 'rgba(255,180,70,.6)');
  if (k > 0) { g.save(); g.translate(0, -60); g.rotate(-.18); g.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); g.globalAlpha = k * .92; rr(-330, -80, 660, 160, 10); g.strokeStyle = '#d42a38'; g.lineWidth = 12; g.stroke(); text(TX.stamp, 0, 6, 76, '#d42a38', 'Anton'); g.restore(); }
  g.restore();
  L(540, 700, 900, C.amb, 1, .2); lightPass('#3a2a3a'); back_();
  const red = ss(seg(t, wordT('l02', 'ulit') - .2, wordT('l02', 'ulit') + .5)); if (red) { reset(); g.fillStyle = `rgba(120,0,20,${.35 * red})`; g.fillRect(0, 0, W, H); }
};
// 3. 9 PM: you on your phone in bed... the screen dies
S.phone = (t, u) => {
  const tw = wordT('l03', 'wala'), off = t > tw - .25;
  cam(540, 900, lerp(1.0, 1.12, seg(u, 0, span('l03'))));
  const back_ = roomWall(t, { lit: off ? 0 : 1 });
  person(540, 1500, 900, { t, sit: 1, arms: 'phone', eyes: off ? 'wide' : 'open', look: .3, tired: .3, lx: 1, rim: RIMC });
  if (!off) { L(640, 620, 520, C.cyan, .9, .25); L(560, 580, 1500, null, .45); } else L(560, 580, 500, C.moon, .25);
  lightPass('#262a4a'); back_();
  if (!off) glow(650, 640, 140, C.cyan, .4);
  BLACK = off ? .55 * (1 - seg(t, tw + .3, tw + 1.2)) + .25 : 0;
};
// 4. no lights, no signal: the whole city is dead
S.dark = (t, u) => {
  cam(540, 900, lerp(1.12, 1.0, eo(seg(u, 0, 1.5))));
  const back_ = roomWall(t, { lit: 0 });
  person(540, 1560, 1000, { t, arms: 'phone', eyes: 'wide', look: .4, sweat: .6, tired: .2, lx: 1, rim: 'rgba(140,170,255,.55)' });
  L(650, 560, 420, C.cyan, .6, .2); L(560, 600, 500, C.moon, .4, .08);
  lightPass('#1e2242'); back_();
  reset(); const k = back(seg(u, .3, .6), 1.8); g.save(); g.translate(CX, 380); g.scale(k, k); glass(-300, -80, 600, 160, 30, 'rgba(255,49,80,.8)', 4, 'rgba(255,49,80,.8)');
  for (let i = 0; i < 4; i++) { rr(-240 + i * 30, 30 - i * 22, 20, 22 + i * 22, 4); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill(); } line([[-250, -50], [-120, 40]], 6, '#ff5068'); text(TX.nosvc, 60, 4, 64, '#ff6a7a', 'Anton'); g.restore();
};
// 5. the cause: a solar storm leaps off the sun toward the Earth
S.sun = (t, u) => {
  const ts = wordT('l05', 'Solar'), th = wordT('l05', 'diretso'), fly = seg(t, ts, th + .3);
  cam(540, 900, lerp(1.0, 1.08, seg(u, 0, span('l05'))), 0, t > th && t < th + .6 ? 8 * (1 - seg(t, th, th + .6)) : 0, t);
  grad('#02020a', '#060418', -600, 2400); for (let i = 0; i < 200; i++) circ(-400 + hash(i * 3.3) * 1900, -500 + hash(i * 1.7) * 2700, 1 + 1.8 * hash(i), `rgba(255,255,255,${.3 + .4 * hash(i + 2)})`);
  const sx = 260, sy = 420; glow(sx, sy, 900, C.sun, .5); circ(sx, sy, 300, rg(sx - 60, sy - 60, 40, 300, ['#fff6c8', '#ffb040', '#e85a10']));
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + t * .05, r0 = 300, h_ = 30 + 40 * Math.sin(t * 2 + i * 1.7) ** 2; curve([sx + Math.cos(a) * r0, sy + Math.sin(a) * r0], [sx + Math.cos(a + .05) * (r0 + h_ * 1.6), sy + Math.sin(a + .05) * (r0 + h_ * 1.6)], [sx + Math.cos(a + .1) * r0, sy + Math.sin(a + .1) * r0], 8, `rgba(255,${150 + 60 * hash(i)},60,.6)`); }
  if (t > ts - .4) { const p = eo(fly); g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 5; k++) { const r = 300 + p * 1250 - k * 60; if (r < 300) continue; g.beginPath(); g.arc(sx, sy, r, .55, 1.25); g.strokeStyle = `rgba(255,${160 - k * 20},${80 - k * 10},${(.7 - k * .12) * (1 - .4 * p)})`; g.lineWidth = 40 - k * 6; g.stroke(); } for (let k = 0; k < 60; k++) { const a = .55 + hash(k) * .7, r = 300 + (p * 1250) * hash(k * 3); circ(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 3 + 4 * hash(k + 1), 'rgba(255,200,120,.7)'); } g.restore(); }
  const ex = 760, ey = 1460, hit = t > th ? seg(t, th, th + 1.2) : 0;
  for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(ex - 40, ey, 160 + k * 46, 110 + k * 30, 0, Math.PI * .55, Math.PI * 1.45); g.strokeStyle = `rgba(${hit ? '255,120,160' : '120,170,255'},${.25 + .3 * hit})`; g.lineWidth = 4; g.stroke(); }
  circ(ex, ey, 130, rg(ex - 40, ey - 40, 10, 130, ['#8ac8ff', '#2a6ab0', '#0a2a5a'])); for (const [a, b, r] of [[-.4, -.3, .5], [.3, .2, .4], [-.1, .5, .3]]) { ell(ex + a * 130, ey + b * 130, r * 100, r * 60, a); g.fillStyle = 'rgba(80,160,90,.85)'; g.fill(); }
  g.save(); g.beginPath(); g.arc(ex, ey, 130, 0, TAU); g.clip(); g.fillStyle = 'rgba(0,0,10,.55)'; g.beginPath(); g.arc(ex + 80, ey + 40, 160, 0, TAU); g.fill(); g.restore();
  if (hit) glow(ex, ey, 380, C.aur, .5 * Math.sin(Math.PI * hit));
  reset(); tag(TX.storm, 540, 860, AMB, C.amb, back(seg(t, ts, ts + .3), 1.8) * (1 - ss(seg(t, th, th + .3))), 1);
};
// 6. day 1: candlelight; no internet; you can't reach your family
S.day1 = (t, u) => {
  const tp = wordT('l06', 'pamilya');
  cam(540, 920, lerp(1.0, 1.15, seg(u, 0, span('l06'))));
  const back_ = roomWall(t, { lit: 0 }); rr(120, 1180, 840, 40, 8); fs('#5a3a28', 4); const c1 = candle(220, 1180, 1.3, t);
  person(560, 1640, 1050, { t, arms: 'phone', eyes: t > tp ? 'wide' : 'open', look: -.3, sweat: .4, tired: .4, lx: -1, rim: 'rgba(255,170,90,.6)' });
  L(660, 560, 300, C.cyan, .5, .15);
  lightPass('#1c1a30'); back_(); c1();
  reset(); const pk = back(seg(u, .4, .7), 1.6); if (pk > 0) { g.save(); g.translate(800, 560); g.scale(pk, pk); glass(-180, -110, 360, 220, 30, t > tp ? 'rgba(255,49,80,.8)' : 'rgba(82,216,255,.7)', 4, t > tp ? 'rgba(255,49,80,.8)' : 'rgba(82,216,255,.7)'); circ(0, -45, 32, t > tp ? '#5a1a24' : '#2a4a6a'); text(TX.mom, 0, 18, 42, '#fff', 'Anton'); text(t > tp ? TX.fail : TX.calling, 0, 70, 32, t > tp ? '#ff6a7a' : '#9fe8ff', 'Anton'); g.restore(); }
};
// 7. the ATMs are dead
S.atm = (t, u) => {
  const tm = wordT('l07', 'mailabas');
  cam(540, 900, lerp(1.1, 1.0, eo(seg(u, 0, 1.4))));
  const back_ = keep(); g.drawImage(TEX.brick, -400, -300, 1900, 2300); g.fillStyle = 'rgba(10,8,20,.45)'; g.fillRect(-400, -300, 1900, 2300);
  g.fillStyle = '#1a1a22'; g.fillRect(-400, 1450, 1900, 600);
  rr(330, 420, 420, 760, 20); fs(lg(330, 0, 750, 0, ['#5a5e68', '#8a8e98', '#4a4e58']), 6); rr(380, 480, 320, 240, 10); fs('#0a0c10', 5); text(TX.atm, 540, 600, 56, '#ff5068', 'Anton');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rr(420 + c * 90, 790 + r * 70, 70, 50, 8); fs('#3a3e48', 3); }
  rr(400, 1080, 280, 20, 6); fs('#0a0a10', 2);
  for (let i = 0; i < 7; i++) { const x = -120 + i * 200 + (i > 2 ? 200 : 0), h = 760 + 120 * hash(i); if (x > 250 && x < 830) continue; runner(x, 1600 + 20 * hash(i), h, 0, { alpha: .9, dir: x < 540 ? 1 : -1, lean: 0, rim: 'rgba(255,170,90,.35)' }); }
  person(540, 1720, 980, { t, arms: 'reach', eyes: 'wide', look: 0, lookY: -.3, sweat: .6, tired: .3, lx: 1, rim: 'rgba(255,170,90,.5)' });
  L(200, 300, 500, C.amb, .6, .2); L(540, 600, 300, C.red, .5 + .2 * Math.sin(t * 4), .2);
  lightPass('#22202e'); back_();
};
// 8. day 2: the fridge drips in the dark; the shops roll their shutters down
S.day2 = (t, u) => {
  const tn = wordT('l08', 'Sarado'), shop = t > tn - .2;
  cam(540, 900, shop ? lerp(1.0, 1.06, seg(t, tn, tn + 3)) : lerp(1.15, 1.0, eo(seg(u, 0, 1.2))));
  const back_ = keep();
  if (!shop) {
    g.drawImage(TEX.tiles, -300, -300, 1700, 1300); g.fillStyle = '#2a2a30'; g.fillRect(-300, 1000, 1700, 1200);
    rr(230, 120, 620, 1300, 30); fs(lg(230, 0, 850, 0, ['#b8c0c6', '#e8ecef', '#9aa2a8']), 6); rr(260, 150, 560, 600, 16); fs('#20262c', 4);
    for (let k = 0; k < 3; k++) { rr(280, 280 + k * 160, 520, 12, 4); fs('#8a9298', 0); } rr(300, 420, 120, 100, 14); fs('#7a8a6a', 3); rr(470, 400, 90, 120, 10); fs('#e8d0a0', 3); rr(600, 430, 160, 90, 20); fs('#c06a5a', 3);
    for (let k = 0; k < 4; k++) { const p = ((t * .7 + k / 4) % 1); circ(400 + k * 90, 760 + p * 640, 9 * (1 - p * .3), `rgba(170,210,255,${.8 * (1 - p)})`); } ell(540, 1460, 360, 40); g.fillStyle = 'rgba(140,180,220,.35)'; g.fill();
    L(540, 450, 600, null, .5); L(820, 200, 500, C.moon, .5, .1);
  } else {
    g.drawImage(TEX.brick, -400, -300, 1900, 2300); g.fillStyle = 'rgba(10,8,20,.4)'; g.fillRect(-400, -300, 1900, 2300);
    rr(140, 240, 800, 120, 10); fs('#3a2a5a', 5); text(TX.closed, 540, 302, 80, '#ffb357', 'Anton');
    const sh = eo(seg(t, tn - .1, tn + 1.4)); rr(160, 400, 760, 1000, 6); fs('#141018', 4);
    g.save(); rr(160, 400, 760, 1000, 6); g.clip(); for (let k = 0; k < 40; k++) { const y = 400 - 1000 + sh * 1000 + k * 25; rr(160, y, 760, 22, 4); fs(lg(0, y, 0, y + 22, ['#8a8e98', '#5a5e68']), 0); } g.restore();
    g.fillStyle = '#1a1a22'; g.fillRect(-400, 1400, 1900, 700);
    L(540, 300, 700, C.amb, .7, .2); L(540, 900, 900, null, .4);
  }
  lightPass('#22222e'); back_();
};
// 9. no water either: the pumps run on electricity
S.faucet = (t, u) => {
  cam(540, 900, lerp(1.0, 1.1, seg(u, 0, span('l09'))));
  const back_ = keep(); g.drawImage(TEX.tiles, -300, -300, 1700, 2300); g.fillStyle = '#c8ccd0'; g.fillRect(-300, 1150, 1700, 80); rr(160, 1230, 760, 300, 30); fs('#e8ecef', 5); ell(540, 1280, 300, 60); fs('#9aa2a8', 4);
  rr(500, 640, 80, 220, 20); fs(lg(500, 0, 580, 0, ['#9aa2a8', '#f0f4f6', '#8a9298']), 5); rr(380, 600, 320, 70, 30); fs(lg(0, 600, 0, 670, ['#f0f4f6', '#9aa2a8']), 5); path([[540, 860], [540, 980], [620, 1000]]); g.strokeStyle = OL; g.lineWidth = 60; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#c8d0d6'; g.lineWidth = 46; g.stroke();
  const dry = seg(u, .2, 2.2), drops = Math.floor(u * 1.4);
  if (dry < 1) { const p = (u * 1.4) % 1; circ(620, 1010 + p * 260, 12, `rgba(170,210,255,${.9 * (1 - dry)})`); }
  person(260, 1900, 900, { t, arms: 'reach', eyes: 'open', look: .8, lookY: .5, tired: .4, lx: 1, rim: RIMC });
  L(820, 200, 700, C.moon, .7, .12); L(540, 900, 700, null, .4);
  lightPass('#262a40'); back_();
};
// 10. day 3: lines for water and fuel; signs say sold out
S.day3 = (t, u) => {
  cam(lerp(500, 620, seg(u, 0, span('l10'))), 900, 1.0);
  const back_ = keep(); g.fillStyle = lg(0, -400, 0, 1200, ['#0a0c1a', '#3a2a3a', '#6a4048']); g.fillRect(-500, -500, 2200, 1800);
  g.drawImage(TEX.city, 0, 0, 2400, 900, -600, 300, 2400, 800); g.fillStyle = 'rgba(6,6,14,.7)'; g.fillRect(-600, 300, 2400, 900);
  g.fillStyle = '#2a2830'; g.fillRect(-600, 1150, 2400, 1000);
  rr(780, 500, 300, 520, 14); fs('#4a1a24', 6); text(TX.fuel, 930, 580, 56, '#fff', 'Anton'); rr(810, 640, 240, 120, 10); fs('#0a0a10', 4); text(TX.sold, 930, 702, 52, '#ff5068', 'Anton'); line([[930, 1020], [930, 1300]], 20, '#3a3a40');
  for (let i = 0; i < 12; i++) { const x = 720 - i * 130 + 20 * Math.sin(i), h = 520 + 80 * hash(i); runner(x, 1300 + 40 * hash(i * 3), h, 0, { alpha: .95, dir: 1, lean: .05, rim: 'rgba(255,150,100,.35)' }); rr(x + 30, 1300 + 40 * hash(i * 3) - h * .32, 50, 70, 8); fs(['#3a6ab0', '#c8a040', '#5a8a5a'][i % 3], 2); }
  L(930, 650, 400, C.red, .7, .25); L(400, 600, 1300, '255,140,100', .5, .12);
  lightPass('#2a1e2c'); back_();
};
// 11. the hospitals run on their last generators
S.hospital = (t, u) => {
  const fuel = 1 - .9 * seg(u, 0, span('l11') + .5);
  cam(540, 900, lerp(1.05, 1.15, seg(u, 0, span('l11'))));
  const back_ = keep(); g.fillStyle = '#c8d0cc'; g.fillRect(-400, -400, 1900, 1500); g.drawImage(TEX.lino, -400, 1100, 1900, 900);
  for (let k = 0; k < 4; k++) { const z = 1 - k * .2; rr(540 - 520 * z, 300 + k * 60, 1040 * z, 860 - k * 120, 4); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; g.stroke(); }
  rr(120, 1100, 420, 120, 16); fs('#e8ecef', 4); rr(110, 1060, 140, 70, 20); fs('#f8f8f8', 3); rr(150, 1200, 20, 200, 4); fs('#8a9298', 2); rr(480, 1200, 20, 200, 4); fs('#8a9298', 2);
  rr(640, 820, 300, 220, 14); fs('#1a1e24', 5); g.save(); rr(660, 840, 260, 180, 8); g.clip(); g.fillStyle = '#04100a'; g.fillRect(660, 840, 260, 180); const ph = (t * .8) % 1; path(Array.from({ length: 27 }, (_, i) => { const x = 660 + i * 10, q = ((i / 26 + 1 - ph) % 1); return [x, 930 - (q > .45 && q < .5 ? 60 : q > .5 && q < .53 ? -30 : 0)]; })); g.strokeStyle = GRN; g.lineWidth = 4; g.stroke(); g.restore();
  rr(700, 1250, 300, 220, 16); fs('#c8a020', 5); text(TX.gen, 850, 1300, 40, '#2a2010', 'Anton'); rr(730, 1340, 240, 40, 10); fs('#2a2010', 3); rr(736, 1346, 228 * fuel, 28, 8); g.fillStyle = fuel < .3 ? '#ff5068' : '#7dffb0'; g.fill(); text(TX.fuel, 850, 1420, 32, '#2a2010', 'Anton');
  const em = .5 + .5 * Math.sin(t * 5);
  L(540, 160, 800, C.red, .6 + .3 * em, .3 * em); L(790, 930, 300, C.grn, .5, .15);
  lightPass('#2a1c26'); back_(); circ(540, 160, 30, `rgba(255,40,60,${.6 + .4 * em})`); glow(540, 160, 300, C.red, .5 * em);
};
// 12. day 7: a silent city... and every star
S.day7 = (t, u) => {
  cam(540, lerp(980, 820, ss(seg(u, 0, span('l12') + .5))), lerp(1.05, 1.0, seg(u, 0, 4)));
  const back_ = keep(); skyline(t, { dark: () => 1, stars: 1, moonA: 0 });
  g.fillStyle = '#5a5a62'; g.fillRect(-500, 1480, 2100, 600); g.fillStyle = '#8a8a92'; g.fillRect(-500, 1470, 2100, 20);
  person(540, 1760, 700, { t, sit: 1, arms: 'lap', eyes: 'open', lookY: -1, look: .2, tired: .3, lx: 1, rim: 'rgba(170,190,255,.6)' });
  L(540, 400, 1400, C.moon, .6, .1); lightPass('#262a4c'); back_();
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 500; i++) { const x = -300 + hash(i * 4.1) * 1700, y = -500 + hash(i * 2.7) * 1400, band = Math.exp(-((((x - 540) * .6 - (y - 200)) / 260) ** 2)); circ(x, y, .8 + 1.6 * hash(i), `rgba(255,255,255,${(.25 + .6 * band) * (.6 + .4 * Math.sin(t * 2 + i))})`); } g.fillStyle = 'rgba(140,120,220,.08)'; g.beginPath(); g.ellipse(540, 200, 1100, 160, -1.0, 0, TAU); g.fill(); g.restore();
};
// 13. the scary truth: an old radio crackles in the dark
S.radio = (t, u) => {
  cam(540, 960, lerp(1.15, 1.0, eo(seg(u, 0, 1.2))));
  const back_ = keep(); g.fillStyle = '#1a1210'; g.fillRect(-400, -400, 1900, 2800); rr(-200, 1300, 1500, 60, 10); fs('#4a3020', 4);
  rr(160, 820, 760, 500, 40); fs(lg(160, 0, 920, 0, ['#6a4028', '#9a6038', '#5a3420']), 8); rr(220, 880, 360, 380, 20); fs('#2a1c14', 5); for (let k = 0; k < 9; k++) line([[240, 900 + k * 40], [560, 900 + k * 40]], 8, '#4a3020');
  rr(620, 890, 250, 110, 12); fs('#e8c870', 5); for (let k = 0; k < 9; k++) line([[640 + k * 26, 910], [640 + k * 26, 930]], 3, '#5a4020'); const nd = 640 + ((Math.sin(t * .8) + 1) / 2) * 210; line([[nd, 900], [nd, 990]], 5, '#c82020');
  for (const kx of [680, 810]) { circ(kx, 1130, 50, '#3a2418'); circ(kx, 1130, 50, OL, 5); line([[kx, 1130], [kx + 30 * Math.cos(t + kx), 1130 + 30 * Math.sin(t + kx)]], 6, '#c8a060'); }
  L(745, 945, 420, C.amb, .9, .35); lightPass('#1e1418'); back_();
  g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 4; k++) { const p = (u * .9 + k / 4) % 1; g.beginPath(); g.arc(400, 1070, 120 + p * 600, -2.6, -.5); g.strokeStyle = `rgba(255,180,90,${.4 * (1 - p)})`; g.lineWidth = 5; g.stroke(); } g.restore();
  reset(); tag(TX.truth, 540, 520, RED, C.red, back(seg(u, .3, .6), 1.8), 1);
};
// 14. 1859: the Carrington Event: telegraph wires catch fire; the aurora reaches the Caribbean
S.carrington = (t, u) => {
  const tf = wordT('l14', 'Umapoy'), ta = wordT('l14', 'aurora');
  cam(540, 900, lerp(1.0, 1.08, seg(u, 0, span('l14'))));
  const back_ = keep(); const au = ss(seg(t, ta - .5, ta + .8));
  g.fillStyle = lg(0, -400, 0, 1300, ['#03050e', '#0a1424', '#1a2a3a']); g.fillRect(-400, -400, 1900, 1800);
  g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 7; k++) { const x0 = -200 + k * 220; g.beginPath(); for (let y = -300; y < 900; y += 30) g.lineTo(x0 + Math.sin(y * .006 + t * .6 + k) * 90, y); for (let y = 900; y > -300; y -= 30) g.lineTo(x0 + 120 + Math.sin(y * .006 + t * .6 + k + .5) * 90, y); g.closePath(); g.fillStyle = lg(0, -300, 0, 900, [`rgba(255,90,140,${.35 * au})`, `rgba(90,255,170,${.55 * au})`, 'rgba(90,255,170,0)']); g.fill(); } g.restore();
  g.fillStyle = '#2a1c14'; g.fillRect(-400, 900, 1900, 1400); for (let x = -400; x < 1500; x += 140) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, 900, 6, 1400); }
  for (const px of [120, 960]) { line([[px, 260], [px, 920]], 24, '#3a2414'); line([[px - 90, 300], [px + 90, 300]], 14, '#3a2414'); }
  for (let k = 0; k < 3; k++) curve([30, 300 + k * 10], [540, 380 + k * 14], [1050, 300 + k * 10], 4, '#141010');
  rr(260, 1040, 560, 60, 10); fs('#5a3a20', 4); rr(420, 960, 240, 80, 10); fs('#8a6a3a', 4); line([[540, 960], [640, 900]], 14, '#c8a060'); circ(640, 900, 22, '#2a1c14');
  text('1859', 540, 1260, 150, '#e8d8b0', 'Anton', 'center', 10, .9);
  L(540, 400, 1400, C.aur, .8 * au, .2 * au); L(540, 1100, 900, C.amb, .5, .1);
  if (t > tf) { const fl = .7 + .3 * Math.sin(t * 17); L(540, 360, 500, C.fire, fl, .35); L(640, 900, 300, C.fire, fl, .3); }
  lightPass('#1e2032'); back_();
  if (t > tf) { g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 30; k++) { const p = ((t - tf) * 1.2 + hash(k)) % 1, x = 100 + hash(k * 3) * 880, y = 330 + Math.sin(x / 1080 * Math.PI) * 60 + p * 300; circ(x, y, 4 * (1 - p), `rgba(255,${180 + 60 * hash(k)},90,${1 - p})`); } for (let k = 0; k < 5; k++) { const x = 200 + k * 170, fh = 60 + 40 * Math.sin(t * 9 + k) ** 2, y = 330 + Math.sin(x / 1080 * Math.PI) * 60; path([[x - 20, y], [x + Math.sin(t * 7 + k) * 8, y - fh], [x + 20, y]]); g.closePath(); g.fillStyle = 'rgba(255,150,50,.85)'; g.fill(); } g.restore(); }
};
// 15. 1989: Quebec goes dark: six million people, nine hours
S.quebec = (t, u) => {
  const ts = wordT('l15', 'anim');
  cam(540, 900, lerp(1.0, 1.06, seg(u, 0, span('l15'))));
  const back_ = keep(); const mid = LN.l15.t0 + span('l15') * .3;
  skyline(t, { dark: k => ss(seg(t, mid + .05 * k, mid + .15 + .05 * k)), stars: .5 });
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 150; i++) { const p = (hash(i * 3) + t * .05 * (1 + hash(i))) % 1; circ(-300 + hash(i * 7.7) * 1700 + Math.sin(t + i) * 20, -300 + p * 2200, 2 + 3 * hash(i), 'rgba(255,255,255,.7)'); } g.restore();
  text('1989', 540, 1300, 150, '#e8f0ff', 'Anton', 'center', 10, .9);
  L(540, 1100, 1400, C.amb, .6 * (1 - seg(t, mid, mid + 1.2)) + .1, .12); lightPass('#26304e'); back_();
  if (t > ts) { reset(); const n = Math.min(60, Math.floor((t - ts) * 40)); for (let i = 0; i < 60; i++) { const x = 160 + (i % 12) * 68, y = 620 + Math.floor(i / 12) * 80, on = i < n; g.save(); g.globalAlpha = on ? 1 : .2; circ(x, y - 14, 11, on ? '#9fb8ff' : '#555'); rr(x - 13, y, 26, 30, 10); g.fillStyle = on ? '#9fb8ff' : '#555'; g.fill(); g.restore(); } }
};
// 16. 2012: a Carrington-class storm crossed Earth's orbit... nine days after we passed
S.miss = (t, u) => {
  const tm = wordT('l16', 'na-miss'), tn = wordT('l16', 'siyam');
  cam(540, 900, lerp(1.05, 1.0, eo(seg(u, 0, 1.2))));
  grad('#02020a', '#080418', -600, 2400); for (let i = 0; i < 160; i++) circ(-400 + hash(i * 3.3) * 1900, -500 + hash(i * 1.7) * 2700, 1 + 1.5 * hash(i), 'rgba(255,255,255,.5)');
  const ox = 540, oy = 1000, R = 420; glow(ox, oy, 360, C.sun, .5); circ(ox, oy, 70, rg(ox - 20, oy - 20, 5, 70, ['#fff6c8', '#ffb040', '#e85a10']));
  g.setLineDash([10, 12]); circ(ox, oy, R, 'rgba(140,180,255,.5)', 3); g.setLineDash([]);
  const ea = -Math.PI / 2 + seg(t, LN.l16.t0, tn + 1) * .9, hitA = ea - .9 * .155 * (t > tm ? 1 : 0) - .14;
  const cone = seg(t, LN.l16.t0 + .4, tm + .2);
  g.save(); g.globalCompositeOperation = 'screen'; g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, R * 1.4 * cone + 70, hitA - .18, hitA + .18); g.closePath(); g.fillStyle = rg(ox, oy, 60, R * 1.4, ['rgba(255,170,80,.6)', 'rgba(255,90,60,0)']); g.fill(); g.restore();
  const ex = ox + Math.cos(ea) * R, ey = oy + Math.sin(ea) * R; circ(ex, ey, 34, rg(ex - 10, ey - 10, 3, 34, ['#8ac8ff', '#2a6ab0'])); text(TX.earth, ex + 80, ey - 30, 40, '#9fd0ff', 'Anton', 'left');
  if (t > tn - .2) { const k = back(seg(t, tn - .2, tn + .2), 1.7); g.beginPath(); g.arc(ox, oy, R + 60, hitA, ea); g.strokeStyle = YEL; g.lineWidth = 8; g.stroke(); g.save(); const mx = ox + Math.cos((hitA + ea) / 2) * (R + 150), my = oy + Math.sin((hitA + ea) / 2) * (R + 150); g.translate(mx, my); g.scale(k, k); text(TX.nine, 0, 0, 90, YEL, 'Anton', 'center', 12); g.restore(); }
};
// 17. about a 12% chance every ten years
S.chance = (t, u) => {
  const t12 = wordT('l17', 'walo');
  cam(540, 900, 1); grad('#06060e', '#141024', -600, 2400); reset();
  const p = .125 * eo(seg(t, t12 - .3, t12 + .9));
  for (let i = 0; i < 8; i++) { const k = back(seg(t, LN.l17.t0 + .2 + i * .1, LN.l17.t0 + .5 + i * .1), 1.7), x = 200 + (i % 4) * 227, y = 1380 + Math.floor(i / 4) * 170, red = i === 5 && t > t12; if (k <= 0) continue; g.save(); g.translate(x, y); g.scale(k, k); if (red) { g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 30; } circ(0, -40, 30, red ? RED : '#6a6e80'); rr(-36, -2, 72, 90, 30); g.fillStyle = red ? RED : '#6a6e80'; g.fill(); g.restore(); }
  g.save(); g.translate(CX, 900); circ(0, 0, 300, 'rgba(255,255,255,.06)'); circ(0, 0, 300, 'rgba(255,255,255,.12)', 40);
  g.beginPath(); g.arc(0, 0, 300, -Math.PI / 2, -Math.PI / 2 + TAU * p); g.strokeStyle = RED; g.lineWidth = 40; g.lineCap = 'round'; g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 40; g.stroke(); g.shadowBlur = 0;
  text(t > t12 ? TX.one8 : `${Math.round(p * 100)}%`, 0, 10, t > t12 ? 150 : 200, '#fff', 'Anton'); text(TX.years, 0, 170, 52, '#c9cde0', 'Anton'); g.restore();
};
// 18. get ready: water, a flashlight, canned food, cash
const KITW = { tl: ['Tubig', 'flashlight', 'de-lata', 'cash'], en: ['Water', 'flashlight', 'canned', 'cash'] };
S.kit = (t, u) => {
  cam(540, 900, 1); const back_ = keep(); g.fillStyle = '#1e1814'; g.fillRect(-400, -400, 1900, 2800); for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,230,200,.03)'; g.fillRect(-400, -400 + k * 300, 1900, 300); }
  const c1 = candle(140, 1600, 1.5, t); L(540, 900, 1400, null, .35);
  lightPass('#2a2028'); back_(); c1();
  (KITW[LANG] || KITW.en).forEach((w, i) => {
    const tw = wordT('l18', w), k = back(seg(t, tw - .15, tw + .2), 1.8); if (k <= 0) return;
    const x = 290 + (i % 2) * 500, y = 640 + Math.floor(i / 2) * 520; g.save(); g.translate(x, y); g.scale(k, k);
    glass(-210, -210, 420, 420, 40, AMB, 4, 'rgba(255,170,80,.6)');
    if (i === 0) { rr(-60, -150, 120, 240, 30); fs('rgba(120,190,255,.8)', 5); rr(-40, -190, 80, 50, 10); fs('#3a6ab0', 4); }
    if (i === 1) { g.save(); g.rotate(-.5); rr(-50, -150, 100, 220, 20); fs('#2a2a30', 5); rr(-70, -180, 140, 60, 16); fs('#4a4a50', 4); g.restore(); beam([[-40, -120], [40, -150], [200, -220], [60, -260]], 0, -130, 140, -240, C.warm, .6); }
    if (i === 2) { for (const dx of [-70, 70]) { rr(dx - 60, -100, 120, 170, 14); fs('#b8bcc4', 5); rr(dx - 60, -60, 120, 80, 4); fs(dx < 0 ? '#c8402a' : '#2a6a3a', 0); } }
    if (i === 3) { for (let k2 = 0; k2 < 3; k2++) { g.save(); g.rotate(-.2 + k2 * .15); rr(-130, -70 + k2 * 10, 260, 130, 10); fs('#7ab07a', 4); circ(0, k2 * 10, 36, '#5a8a5a'); g.restore(); } }
    text((TX.kit[i]), 0, 160, 48, '#fff', 'Anton', 'center', 8); g.restore();
  });
};
// 19. agree on where to meet when there's no signal
S.meet = (t, u) => {
  const tm = wordT('l19', 'magkikita'); cam(540, 900, lerp(1.06, 1.0, eo(seg(u, 0, 1)))); reset();
  g.fillStyle = '#d8ccae'; g.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { line([[0, 200 + i * 200 + 30 * Math.sin(i)], [W, 260 + i * 190]], 26, '#f4ecd8'); line([[100 + i * 130, 0], [60 + i * 140, H]], 20, '#f4ecd8'); }
  for (let i = 0; i < 14; i++) { rr(hash(i * 3) * 900, hash(i * 7) * 1700, 90 + 60 * hash(i), 70 + 50 * hash(i + 1), 6); g.fillStyle = 'rgba(140,120,90,.3)'; g.fill(); }
  ell(780, 300, 220, 160); g.fillStyle = 'rgba(120,170,200,.6)'; g.fill();
  g.fillStyle = 'rgba(10,8,20,.35)'; g.fillRect(0, 0, W, H);
  const P = [540, 960], pk = back(seg(t, tm - .3, tm + .1), 1.7);
  [[180, 400], [900, 620], [260, 1500], [880, 1400]].forEach(([x, y], i) => { const p = eo(seg(t, LN.l19.t0 + .2 + i * .15, tm + .4)), cx = lerp(x, P[0] + (i - 1.5) * 50, p), cy = lerp(y, P[1] + 120, p); g.setLineDash([16, 14]); line([[x, y], [cx, cy]], 6, `rgba(${BCOLX[i]},.8)`); g.setLineDash([]); circ(cx, cy - 22, 18, `rgb(${BCOLX[i]})`); rr(cx - 20, cy - 2, 40, 46, 14); g.fillStyle = `rgb(${BCOLX[i]})`; g.fill(); });
  if (pk > 0) { g.save(); g.translate(P[0], P[1]); g.scale(pk, pk); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-70, -90, -70, -170, 0, -170); g.bezierCurveTo(70, -170, 70, -90, 0, 0); g.fillStyle = RED; g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0; circ(0, -115, 26, '#fff'); g.restore(); tag(TX.meet, P[0], P[1] - 260, YEL, C.amb, pk, 1); }
};
const BCOLX = ['255,179,87', '82,216,255', '255,79,154', '109,255,168'];
// 20. POV: look at your battery
S.battery = (t, u) => {
  cam(540, 900, 1); grad('#05060e', '#0e1020', -600, 2400); reset();
  const lvl = lerp(.62, .23, eo(seg(u, .2, span('l20')))), pk = back(seg(u, 0, .3), 1.5);
  g.save(); g.translate(CX, 860); g.scale(pk, pk); rr(-240, -480, 480, 960, 60); fs('#101016', 8); rr(-222, -462, 444, 924, 46); g.fillStyle = '#0a0c14'; g.fill();
  rr(-140, -260, 260, 480, 40); g.strokeStyle = '#e8ecef'; g.lineWidth = 14; g.stroke(); rr(-40, -300, 60, 40, 10); g.fillStyle = '#e8ecef'; g.fill();
  const col = lvl < .3 ? RED : lvl < .5 ? YEL : GRN; rr(-120, -240 + 440 * (1 - lvl), 220, 440 * lvl, 26); g.save(); g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fill(); g.restore();
  text(`${Math.round(lvl * 100)}%`, -10, 340, 110, '#fff', 'Anton'); g.restore();
  text(TX.battery, CX, 260, 72, '#fff', 'Anton', 'center', 12, ss(seg(u, .3, .6)));
};
// 21. how many days would you last?
S.comment = (t, u) => {
  cam(540, 920, lerp(1.0, 1.1, seg(u, 0, span('l21')))); const back_ = keep(); g.fillStyle = '#120e10'; g.fillRect(-400, -400, 1900, 2800); rr(-200, 1240, 1500, 60, 10); fs('#3a2418', 4);
  const c1 = candle(540, 1240, 2.2, t); lightPass('#1a1418'); back_(); c1();
  reset(); const k = back(seg(u, .2, .5), 1.7); g.save(); g.translate(CX, 380); g.scale(k, k); glass(-440, -150, 880, 300, 50, 'rgba(255,255,255,.7)', 4, 'rgba(255,255,255,.5)'); path([[-200, 148], [-260, 230], [-90, 148]]); g.closePath(); g.fillStyle = 'rgba(8,10,22,.8)'; g.fill();
  g.font = '64px Anton'; const sc = Math.min(1, 800 / g.measureText(TX.last).width); g.save(); g.scale(sc, sc); text(TX.last, 0, -40, 64, '#fff', 'Anton'); g.restore(); g.save(); g.shadowColor = 'rgba(255,170,80,1)'; g.shadowBlur = 24; text(`? ${TX.days}`, 0, 60, 100, YEL, 'Anton'); g.restore(); g.restore();
};
// 22. send it to your person; then the loop: the city lit again (= frame 1)
S.cta = (t, u) => {
  cam(540, 960, lerp(1.06, 1.0, eo(seg(u, 0, 1)))); const back_ = keep(); skyline(t, { dark: () => 1, stars: .9 });
  g.fillStyle = '#3a3a42'; g.fillRect(-500, 1460, 2100, 700);
  const c1 = candle(540, 1470, 1.4, t);
  person(380, 1700, 760, { t, arms: 'down', eyes: 'open', look: .8, lx: 1, rim: 'rgba(255,170,90,.6)' });
  person(700, 1700, 740, { t: t + 2, hood: REDHOOD, longHair: 1, arms: 'down', eyes: 'open', look: -.8, smile: 1, lx: -1, rim: 'rgba(255,170,90,.6)' });
  lightPass('#1c1c34'); back_(); c1();
  const k = back(seg(u, 0, .3), 1.8); reset(); g.save(); g.translate(CX, 420); g.scale(k, k); glass(-430, -150, 860, 300, 36, 'rgba(255,179,87,.6)', 3, 'rgba(255,179,87,.7)'); text(TX.share[0], 0, -50, 100, '#fff', 'Anton'); g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 26; text(TX.share[1], 0, 62, 80, YEL, 'Anton'); g.restore(); g.restore();
};
S.loop = (t, u) => {
  cam(540, 900, 1.08); const back_ = keep(); skyline(t, { dark: () => 0 });
  L(540, 1100, 1400, C.amb, .65, .15); L(820, 140, 600, C.moon, .8, .12); lightPass('#2c2c5a'); back_();
};

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }

// ---------- frame ----------
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['hook', 'stamp', 'chance', 'battery', 'comment', 'cta', 'loop', 'kit', 'meet', 'miss'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1; BLACK = 0;
  if (ln && ln.t1 - ln.t0 > 2.4 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .08 * eo(seg(t, mid, mid + .35)); }
  S[sh[2]](t, u);
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .3, .6)));
  counter(t);
  if (!['cta', 'loop', 'chance'].includes(sh[2])) statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  if (!['cta', 'loop'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);
