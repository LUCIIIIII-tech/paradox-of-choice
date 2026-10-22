
// ---------- the beach ----------
const S = {};
C.sunset = '255,180,110'; C.foam = '230,245,255'; C.storm = '120,140,170';
const RIMS = 'rgba(255,190,130,.55)';
function palm(x, y, h, lean = .2, t = 0) {
  const top = [x + h * lean, y - h]; curve([x, y], [x + h * lean * .2, y - h * .5], top, h * .05, '#3a2418');
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .5 + Math.sin(t * 1.2 + k) * .05, L_ = h * (.42 + .1 * hash(k)); const ex = top[0] + Math.cos(a) * L_, ey = top[1] + Math.sin(a) * L_ * .6 + L_ * .35;
    g.beginPath(); g.moveTo(...top); g.quadraticCurveTo(top[0] + Math.cos(a) * L_ * .6, top[1] + Math.sin(a) * L_ * .5 - L_ * .1, ex, ey); g.quadraticCurveTo(top[0] + Math.cos(a) * L_ * .5, top[1] + Math.sin(a) * L_ * .4 + L_ * .05, top[0], top[1] + 6); g.fillStyle = k % 2 ? '#2a5a34' : '#1e4428'; g.fill(); }
}
function umbrella(x, y, s, col) { line([[x, y], [x, y - 220 * s]], 8 * s, '#e8e0d0'); g.beginPath(); g.moveTo(x - 150 * s, y - 200 * s); g.quadraticCurveTo(x, y - 330 * s, x + 150 * s, y - 200 * s); g.closePath(); fs(col, 3); for (let k = -1; k <= 1; k++) line([[x, y - 290 * s], [x + k * 100 * s, y - 205 * s]], 3 * s, 'rgba(255,255,255,.5)'); }
function fishAt(x, y, s, t, k) { const j = Math.max(0, Math.sin(t * 9 + k * 2.3)) * 18 * s; g.save(); g.translate(x, y - j); g.rotate(Math.sin(t * 7 + k) * .6); ell(0, 0, 26 * s, 11 * s); fs(k % 2 ? '#c8d0d8' : '#e8b050', 2); path([[-24 * s, 0], [-40 * s, -12 * s], [-40 * s, 12 * s]]); g.closePath(); fs(k % 2 ? '#a8b0b8' : '#c89040', 2); circ(14 * s, -3 * s, 3 * s, '#111'); g.restore(); }
function coral(x, y, s, col) { for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .35; curve([x, y], [x + Math.cos(a) * 30 * s, y + Math.sin(a) * 40 * s], [x + Math.cos(a) * 55 * s, y + Math.sin(a) * 70 * s], 9 * s, col); } }
// recede 0..1: the shoreline slides out toward the horizon; wave 0..1: a white wall rising and coming in; storm 0..1: the sky going grey
function beachScene(t, o = {}) {
  const { recede = 0, wave = 0, storm = 0, crowd = 0, people = 1, sepia = 0 } = o, back_ = keep();
  const HZ = 720, shore = lerp(1180, 800, recede);
  g.fillStyle = lg(0, -400, 0, HZ, storm > .5 ? ['#1a2030', '#3a4250', '#5a6070'] : ['#2a3a6a', '#c86a6a', '#ffb070', '#ffd890']); g.fillRect(-500, -600, 2100, HZ + 600);
  if (storm > 0 && storm <= .5) { g.save(); g.globalAlpha = storm * 2; g.fillStyle = lg(0, -400, 0, HZ, ['#1a2030', '#3a4250', '#5a6070']); g.fillRect(-500, -600, 2100, HZ + 600); g.restore(); }
  circ(760, 560, 70, `rgba(255,236,190,${1 - storm})`);
  for (let k = 0; k < 4; k++) { ell(100 + k * 300 + Math.sin(t * .1 + k) * 20, 200 + 80 * hash(k), 220, 26); g.fillStyle = `rgba(${storm > .3 ? '60,70,90' : '255,170,150'},${.3 + .1 * hash(k + 1)})`; g.fill(); }
  // the sea, from the horizon to the shoreline
  g.fillStyle = lg(0, HZ, 0, shore, ['#1e4a6a', '#2a7a8a', '#3a9a9a']); g.fillRect(-500, HZ, 2100, shore - HZ);
  for (let k = 0; k < 14; k++) { const y = HZ + (shore - HZ) * (k / 14) ** 1.4, off = (t * 40 * (1 + k * .1)) % 200; for (let x = -500 - off; x < 1600; x += 200) line([[x, y], [x + 90, y]], 2 + k * .2, 'rgba(255,255,255,.18)'); }
  if (!storm) glow(760, HZ + 40, 500, C.sunset, .25);
  // the exposed seabed (wet sand, puddles, coral, fish), then dry sand
  if (recede > 0) { g.fillStyle = lg(0, shore, 0, 1180, ['#5a5040', '#7a6a50']); g.fillRect(-500, shore, 2100, 1180 - shore);
    for (let k = 0; k < 12; k++) { const x = -100 + hash(k * 3.1) * 1300, y = shore + 20 + hash(k * 5.7) * (1180 - shore - 40); ell(x, y, 60 + 60 * hash(k), 12 + 8 * hash(k + 2)); g.fillStyle = 'rgba(120,170,190,.45)'; g.fill(); }
    for (let k = 0; k < 7; k++) { const y = shore + 30 + hash(k * 9.1) * (1180 - shore - 60); if (y < shore + 20) continue; coral(-60 + hash(k * 4.4) * 1200, y, .9, ['#e86a6a', '#e8a04a', '#c85a9a'][k % 3]); }
    for (let k = 0; k < 14; k++) { const y = shore + 30 + hash(k * 2.9) * (1180 - shore - 50); if (y < shore + 20) continue; fishAt(-40 + hash(k * 6.1) * 1160, y, 1, t, k); } }
  g.fillStyle = lg(0, 1180, 0, 1920, ['#e8c890', '#d8b078']); g.fillRect(-500, 1180, 2100, 1200);
  for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(120,90,50,.25)'; g.fillRect(-400 + hash(i * 1.3) * 1900, 1190 + hash(i * 2.9) * 700, 3, 2); }
  line([[-500, 1180], [1600, 1180]], 6, 'rgba(255,255,255,.5)');
  // the wave: a dark wall with a foaming crest, rising on the horizon and coming in
  if (wave > 0) { const base = lerp(HZ + 10, 1700, ei(wave)), hgt = lerp(30, 900, wave), top = base - hgt;
    g.beginPath(); g.moveTo(-500, base); for (let x = -500; x <= 1600; x += 40) g.lineTo(x, top + Math.sin(x * .01 + t * 2) * 18 * (1 + wave)); g.lineTo(1600, base); g.closePath(); g.fillStyle = lg(0, top, 0, base, ['#d8eef4', '#2a6a7a', '#0e2a3a']); g.fill();
    for (let k = 0; k < 40; k++) { const x = -500 + k * 55 + 20 * hash(k), y0 = top + 30 + 40 * hash(k + 3); line([[x, y0], [x - 10, y0 + (base - y0) * (.4 + .4 * hash(k + 7))]], 3 + 4 * hash(k), `rgba(220,240,250,${.12 + .1 * hash(k + 1)})`); }
    g.beginPath(); for (let x = -500; x <= 1600; x += 20) g.lineTo(x, top + Math.sin(x * .01 + t * 2) * 18 * (1 + wave) + 6 * Math.sin(x * .07 + t * 8)); g.strokeStyle = 'rgba(240,250,255,.95)'; g.lineWidth = 10 + 30 * wave; g.stroke();
    for (let k = 0; k < 90; k++) { const p = (t * (.5 + .5 * hash(k)) + hash(k * 2.3)) % 1, x = -500 + hash(k * 7.7) * 2100, y = top + Math.sin(x * .01 + t * 2) * 18 * (1 + wave) - p * 160 * wave; circ(x + p * 40, y, (4 + 10 * hash(k)) * (1 - p * .5), `rgba(240,250,255,${.6 * (1 - p)})`); } }
  palm(-60, 1500, 820, .25, t); palm(1150, 1560, 760, -.3, t + 2);
  if (people) { umbrella(280, 1420, 1, '#e8504a'); umbrella(860, 1460, .9, '#4a8ae8'); }
  // people on the sand, scattered at different depths (or walking out onto the seabed)
  if (people) PEOPLE6.forEach(([ox, oy, oh], i) => { const out_ = crowd * (i % 2 ? 1 : .75), x = lerp(ox, 200 + ((i * 3) % 6) * 140, out_), y = lerp(oy, shore + 110 + 60 * hash(i), out_), h = lerp(oh, 150, out_);
    person(x, y, h, { t: t + i, walk: crowd > 0 && crowd < 1 ? t * 5 + i : null, hood: TOPS6[i % 6], skin: SKINS4[i % 4], arms: crowd > .5 && i % 2 ? 'phone' : (i === 1 && !crowd && !storm ? 'up' : 'down'), eyes: 'open', look: crowd ? .8 : 0, lx: 1, rim: RIMS, ground: 1 }); });
  if (!storm) { L(760, 560, 1300, C.sunset, 1 - .6 * storm, .3); L(540, 1300, 1300, null, .55); } else L(540, 400, 1500, C.storm, .7, .1);
  if (wave > .3) L(540, lerp(720, 1700, ei(wave)) - 200, 900, C.foam, .6 * wave, .15);
  return () => { back_(); if (sepia) { reset(); g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = `rgba(170,130,80,${sepia})`; g.fillRect(0, 0, W, H); g.restore(); } };
}
const PEOPLE6 = [[600, 1290, 200], [960, 1310, 210], [150, 1350, 235], [420, 1400, 250], [770, 1440, 265], [300, 1530, 290]];   // far to near, so nearer people draw on top
const TOPS6 = [['#e8a04a', '#b8742a', '#6a4014'], ['#4a9ae8', '#2a6ab0', '#143a6a'], ['#e85a8a', '#b03a64', '#6a1a3a'], ['#6ac87a', '#3a9a4a', '#1a5a24'], ['#e8d04a', '#b8a02a', '#6a5a14'], ['#9a7ae8', '#6a4ab0', '#3a2a6a']];
const SKINS4 = [SKIN, ['#e8b894', '#c08a68', '#7a5038'], ['#c48a64', '#9a6444', '#5a3624'], ['#8a5a3e', '#6a4028', '#3a2214']];
function ruleCard(t, t0, n, label, col = RED) {      // a big rule card that slams in
  const k = back(seg(t, t0, t0 + .28), 2.2); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k, k); glass(-420, -140, 840, 280, 34, col, 5, 'rgba(255,49,80,.8)');
  text(`${TX.rule} ${n}`, 0, -70, 54, '#ff8a96', 'Anton'); g.font = '96px Anton'; const sc = Math.min(1, 760 / g.measureText(label).width);
  g.save(); g.translate(0, 34); g.scale(sc, sc); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; text(label, 0, 0, 96, '#fff', 'Anton'); g.restore(); g.restore();
}
// the countdown: 10:00 -> 0:00, running fast between the checkpoints the script names
const CDK = [['l02', 600], ['l05', 480], ['l08', 300], ['l11', 120], ['l13', 30], ['l18', 0]].map(([id, s]) => [LN[id].t0, s]);
function countdown(t, shot, y = 165) {
  if (t < CDK[0][0] || ['y2004', 'hero', 'ph', 'loop'].includes(shot)) return;
  let s = 0; for (let i = 0; i < CDK.length - 1; i++) if (t >= CDK[i][0] && t < CDK[i + 1][0]) s = lerp(CDK[i][1], CDK[i + 1][1], (t - CDK[i][0]) / (CDK[i + 1][0] - CDK[i][0]));
  if (t >= CDK[CDK.length - 1][0]) s = 0; s = Math.max(0, Math.ceil(s));
  const urgent = s <= 60, pulse = urgent ? .5 + .5 * Math.sin(t * 10) : 0, k = back(seg(t, CDK[0][0], CDK[0][0] + .3), 1.8);
  const str = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  reset(); g.save(); g.translate(CX, y); g.scale(k * (1 + .04 * pulse), k * (1 + .04 * pulse)); glass(-200, -64, 400, 128, 64, urgent ? RED : AMB, 5, urgent ? 'rgba(255,49,80,.9)' : 'rgba(255,170,80,.8)');
  const cx = -120; circ(cx, 0, 34, 'rgba(255,255,255,.08)'); circ(cx, 0, 34, urgent ? RED : AMB, 4); const a = t * 8; line([[cx, 0], [cx + Math.sin(a) * 24, -Math.cos(a) * 24]], 4, urgent ? RED : AMB); line([[cx, 0], [cx, -16]], 4, '#fff');
  g.save(); g.shadowColor = urgent ? 'rgba(255,49,80,1)' : 'rgba(255,200,120,.8)'; g.shadowBlur = 20; text(str, 50, 5, 86, urgent ? '#ff6a7a' : '#fff', 'Anton'); g.restore(); g.restore();
}
// ---------- shots ----------
// 1. the hook: the sea is being sucked away from the beach. Don't watch. Run.
S.recede = (t, u) => {
  const rc = lerp(.25, 1, eo(seg(t, 0, LN.l02.t1)));
  cam(540, lerp(980, 900, seg(u, 0, 6)), lerp(1.12, 1.0, eo(seg(u, 0, 2.5))), 0, t > wordT('l01', 'Tumakbo') && t < wordT('l01', 'Tumakbo') + .5 ? 7 * (1 - seg(t, wordT('l01', 'Tumakbo'), wordT('l01', 'Tumakbo') + .5)) : 0, t);
  const post = beachScene(t, { recede: rc, storm: .25, people: 1 }); lightPass('#3a3048'); post();
  for (let k = 0; k < 10; k++) { const p = (t * .6 + k / 10) % 1, x = -100 + hash(k * 3.1) * 1300; line([[x, lerp(1180, 820, rc) + 40 - p * 80], [x + 40, lerp(1180, 820, rc) + 40 - p * 80 - 50]], 4, `rgba(220,240,255,${.5 * (1 - p)})`); }
};
// 2. a perfect beach: sun, umbrellas, everyone happy
S.beach = (t, u) => { cam(lerp(500, 580, seg(u, 0, span('l03'))), 1100, lerp(1.15, 1.05, seg(u, 0, span('l03')))); const post = beachScene(t, { people: 1 }); lightPass('#5a4a5a'); post(); };
// 3. then the water pulls back: sand, fish, coral appear
S.pull = (t, u) => { const tu = wordT('l04', 'umatras'); cam(540, lerp(1000, 940, seg(u, 0, span('l04'))), lerp(1.05, 1.15, seg(u, 0, span('l04')))); const post = beachScene(t, { recede: ss(seg(t, tu - .2, tu + 2.2)), people: 1, storm: .2 * seg(t, tu, tu + 3) }); lightPass('#4a3a50'); post(); };
// 4. people walk out to grab fish and film it
S.crowd = (t, u) => { cam(540, 1000, lerp(1.0, 1.12, seg(u, 0, span('l05')))); const post = beachScene(t, { recede: 1, crowd: eo(seg(u, .2, span('l05') + .5)), people: 1, storm: .3 }); lightPass('#3a3048'); post(); };
// 5. the biggest mistake: freeze, a red X
S.mistake = (t, u) => {
  cam(540, 1000, 1.12); const post = beachScene(LN.l06.t0, { recede: 1, crowd: 1, people: 1, storm: .4 }); lightPass('#2a2034'); post();
  reset(); g.fillStyle = 'rgba(40,0,10,.45)'; g.fillRect(0, 0, W, H); const k = back(seg(u, .05, .3), 2.2); g.save(); g.translate(CX, 1000); g.scale(k, k); g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 40; line([[-260, -260], [260, 260]], 60, RED); line([[260, -260], [-260, 260]], 60, RED); g.restore();
};
// 6. 2004: this is exactly what happened
S.y2004 = (t, u) => { cam(540, 1000, lerp(1.0, 1.08, seg(u, 0, span('l07')))); const post = beachScene(t, { recede: 1, crowd: 1, people: 1, wave: .15 * seg(u, 0, span('l07')), storm: .5, sepia: .55 }); lightPass('#3a3038'); post(); reset(); text(TX.year, CX, 1250, 180, 'rgba(255,240,210,.85)', 'Anton', 'center', 12); };
// 7. out at sea it moves as fast as a jet
S.horizon = (t, u) => {
  cam(540, lerp(820, 760, seg(u, 0, span('l08'))), lerp(1.3, 1.5, seg(u, 0, span('l08')))); const post = beachScene(t, { recede: 1, wave: lerp(.15, .32, seg(u, 0, span('l08'))), storm: .8, people: 0 }); lightPass('#2a3040'); post();
  const p = (t * .9) % 1; g.save(); g.translate(lerp(-200, 1300, p), 520); g.rotate(-.05); rr(-60, -10, 120, 20, 10); fs('#e8ecf0', 2); path([[-10, 0], [-30, -40], [10, -40], [25, 0]]); g.closePath(); fs('#c8d0d8', 2); g.restore(); line([[lerp(-200, 1300, p) - 260, 525], [lerp(-200, 1300, p) - 70, 520]], 3, 'rgba(255,255,255,.6)');
};
// 8. near shore it's still faster than anyone can run
S.wave = (t, u) => {
  cam(540, 1000, lerp(1.0, 1.06, seg(u, 0, span('l09'))), 0, 6 + 6 * seg(u, 0, span('l09')), t); const post = beachScene(t, { recede: 1, wave: lerp(.35, .75, seg(u, 0, span('l09'))), storm: 1, people: 0 });
  person(540, 1820, 900, { t, walk: t * 11, arms: 'out', eyes: 'wide', mouth: .6, sweat: 1, lx: 1, rim: 'rgba(200,230,255,.6)' });
  lightPass('#26303e'); post();
};
// 9-12. the rules
S.r1 = (t, u) => {
  cam(540, 1300, lerp(1.25, 1.35, seg(u, 0, span('l10')))); const post = beachScene(t, { recede: 1, wave: .5, storm: 1, people: 0 });
  rr(330, 1500, 220, 150, 30); fs('#c84a4a', 4); line([[360, 1500], [420, 1420], [480, 1500]], 10, '#8a2a2a'); rr(620, 1560, 80, 150, 14); fs('#15161f', 4); rr(632, 1574, 56, 110, 8); g.fillStyle = '#4a8ae8'; g.fill();
  person(lerp(680, 800, seg(u, 0, span('l10'))), 1820, 620, { t, walk: t * 11, arms: 'out', eyes: 'wide', sweat: 1, lx: -1, rim: 'rgba(200,230,255,.6)' });
  lightPass('#26303e'); post(); ruleCard(t, LN.l10.t0, 1, TX.rules[0]);
};
S.r2 = (t, u) => {
  cam(CX, 960, 1); grad('#1a2030', '#3a4250', -600, 2600); const back_ = keep();
  g.beginPath(); g.moveTo(-200, 1640); g.lineTo(300, 1600); g.quadraticCurveTo(700, 1450, 880, 900); g.lineTo(1300, 860); g.lineTo(1300, 2300); g.lineTo(-200, 2300); g.closePath(); g.fillStyle = lg(0, 860, 0, 1700, ['#4a8a4a', '#6a5a38']); g.fill();
  for (let k = 0; k < 5; k++) palm(900 + k * 60, 905 - k * 4, 160 + 30 * hash(k), .15 - k * .06, t + k);
  g.fillStyle = lg(0, 1630, 0, 2100, ['#2a6a8a', '#0e2a3a']); g.fillRect(-200, 1630 + 14 * Math.sin(t * 2), 520, 700);
  const cl = eo(seg(u, .3, span('l11'))); person(lerp(240, 840, cl), lerp(1620, 930, cl), 230, { t, walk: t * 9, arms: 'out', eyes: 'wide', lx: 1, rim: RIMS });
  L(700, 800, 1400, C.storm, .9, .15); L(540, 1300, 1200, null, .6); lightPass('#2a3040'); back_();
  g.setLineDash([16, 14]); line([[960, 870], [960, 1600]], 6, YEL); g.setLineDash([]); path([[930, 910], [960, 850], [990, 910]]); g.closePath(); g.fillStyle = YEL; g.fill();
  text(TX.up, 470, 1000, 64, YEL, 'Anton', 'center', 10, ss(seg(u, .5, .9))); text(TX.away, 300, 1780, 60, '#9fd8ff', 'Anton', 'center', 10, ss(seg(t, wordT('l11', 'tatlong'), wordT('l11', 'tatlong') + .4)));
  ruleCard(t, LN.l11.t0, 2, TX.rules[1]);
};
S.r3 = (t, u) => {
  cam(CX, 960, lerp(1.05, 1.0, eo(seg(u, 0, 1)))); grad('#1a2030', '#3a4250', -600, 2600); const back_ = keep();
  rr(120, 640, 400, 1000, 6); fs(lg(120, 0, 520, 0, ['#8a8e98', '#b8bcc4', '#7a7e88']), 6);
  for (let f = 0; f < 5; f++) for (let w = 0; w < 3; w++) { rr(150 + w * 125, 1520 - f * 190 - 120, 90, 110, 6); fs(f === 2 ? '#ffd890' : '#2a3040', 4); }
  for (let f = 1; f < 5; f++) line([[120, 1640 - f * 190], [520, 1640 - f * 190]], 8, '#5a5e68');
  g.fillStyle = lg(0, 1600, 0, 2100, ['#1e4a6a', '#0e2a3a']); g.fillRect(-200, 1600 + 60 * Math.sin(t * 2), 1500, 600);
  L(320, 1110, 300, C.amb, .9, .3); L(540, 500, 1300, C.storm, .7, .1); lightPass('#262c3c'); back_();
  const k = back(seg(t, wordT('l12', 'ikatlong') - .2, wordT('l12', 'ikatlong') + .1), 1.8); if (k > 0) { g.save(); g.translate(560, 1110); g.scale(k, k); path([[60, -30], [0, 0], [60, 30]]); g.strokeStyle = YEL; g.lineWidth = 12; g.stroke(); text(TX.floor, 90, 0, 50, YEL, 'Anton', 'left', 8); g.restore(); }
  ruleCard(t, LN.l12.t0, 3, TX.rules[2]);
};
S.r4 = (t, u) => {
  cam(540, 900, 1.0, 0, 4, t); const post = beachScene(t, { recede: 0, wave: lerp(.25, .45, seg(u, 0, span('l13'))), storm: 1, people: 0 }); lightPass('#222a38'); post();
  if (t > wordT('l13', 'susunod') - .4) { const k = back(seg(t, wordT('l13', 'susunod') - .4, wordT('l13', 'susunod')), 1.8); reset(); g.save(); g.translate(CX, 900); g.scale(k, k); glass(-420, -70, 840, 140, 40, RED, 4, 'rgba(255,49,80,.8)'); text(TX.bigger, 0, 6, 64, '#ff6a7a', 'Anton'); g.restore(); }
  ruleCard(t, LN.l13.t0, 4, TX.rules[3]);
};
// 13. the hero: a ten-year-old girl who learned it at school
S.hero = (t, u) => {
  const ts = wordT('l15', 'Sumigaw'), shout = t > ts;
  cam(lerp(560, 520, seg(u, 0, 8)), 1150, lerp(1.25, 1.1, ss(seg(t, ts, ts + 1.5)))); const post = beachScene(t, { recede: 1, people: 0, storm: .3, sepia: .3 });
  person(420, 1700, 760, { t, hood: ['#e8708a', '#b84a64', '#6a2434'], skin: SKINS4[0], longHair: 1, hair: ['#c8a050', '#e8c070', '#f0d890'], arms: shout ? 'out' : 'down', eyes: 'wide', mouth: shout ? .7 + .2 * Math.sin(t * 10) : 0, look: .8, lx: 1, rim: 'rgba(255,214,160,.7)' });
  if (shout) [[850, 1400, 280], [1010, 1450, 300], [800, 1530, 330], [960, 1600, 360], [1080, 1680, 390]].forEach(([x0, y0, h0], i) => { const p = seg(t, ts + .25 + i * .18, ts + 3.2 + i * .18); person(x0 + p * (420 + 60 * i), y0 - p * 260, h0 * (1 - .35 * p), { t: t + i, walk: p > 0 ? t * 10 + i : null, hood: TOPS6[i], skin: SKINS4[i % 4], arms: p > 0 ? 'out' : 'down', eyes: 'wide', lx: -1, rim: RIMS }); });
  L(420, 1100, 700, C.sunset, .9, .3); lightPass('#4a3a48'); post();
  if (shout) { const k = back(seg(t, ts, ts + .25), 2); reset(); g.save(); g.translate(560, 780); g.scale(k, k); rr(-200, -70, 400, 140, 50); fs('#fff7e8', 6); text(TX.run, 0, 6, 80, '#c8202e', 'Anton'); g.restore(); }
};
// 14. it happened here: the Moro Gulf, 1976
const PH = {
  luzon: [[120.6, 18.5], [121.2, 18.6], [122.2, 18.5], [122.3, 17.1], [122.5, 16.2], [121.6, 15.8], [121.6, 14.9], [122, 14.1], [122.7, 14.3], [123.1, 13.8], [123.9, 13.8], [124.2, 13], [124, 12.6], [123.3, 13], [122.6, 13.4], [121.8, 13.9], [121.3, 13.6], [120.9, 13.9], [120.6, 14.4], [120.9, 14.6], [120.6, 14.8], [120.1, 14.8], [119.9, 15.4], [119.8, 16.3], [120.3, 16.6], [120.4, 17.5]],
  mindoro: [[120.3, 13.5], [121.2, 13.6], [121.5, 12.9], [121.1, 12.2], [120.6, 12.6]],
  palawan: [[117.2, 8.4], [117.6, 8.3], [118.6, 9.1], [119.4, 10], [119.9, 10.6], [119.8, 11.4], [119.4, 11.3], [119, 10.5], [118.2, 9.8], [117.5, 9]],
  samar: [[124.3, 12.6], [125.2, 12.5], [125.7, 11.2], [125.2, 11], [124.6, 11.4], [124.3, 12]],
  leyte: [[124.3, 11.5], [125, 11.3], [125.1, 10.2], [124.8, 10], [124.4, 10.4], [124.3, 11]],
  panay: [[121.9, 11.9], [122.6, 11.6], [123.1, 11.2], [122.5, 10.5], [122, 10.5], [121.9, 11.2]],
  negros: [[122.9, 10.9], [123.5, 10.8], [123.2, 9.5], [122.9, 9.1], [122.4, 9.8], [122.8, 10.4]],
  cebu: [[123.9, 11.2], [124.1, 10.6], [123.6, 9.5], [123.3, 9.6], [123.8, 10.6]],
  bohol: [[123.8, 10.1], [124.5, 10.1], [124.5, 9.6], [123.8, 9.6]],
  mindanao: [[121.9, 7], [122.2, 7.9], [122.9, 8.1], [123.5, 8.6], [123.9, 8.2], [124.2, 8.5], [124.7, 8.9], [125.1, 9], [125.5, 9.8], [126, 9.3], [126.3, 8.5], [126.6, 7.5], [126.2, 6.5], [125.7, 7], [125.4, 6.3], [125.6, 5.6], [125.2, 5.8], [124.6, 6], [124, 6.6], [124.1, 7.3], [123.7, 7.7], [123.3, 7.5], [122.8, 7.4], [122.4, 6.9]] };
const geo = ([lo, la]) => [230 + (lo - 117) * 70, 520 + (19.5 - la) * 70];
S.ph = (t, u) => {
  cam(CX, 960, lerp(1.0, 1.12, seg(u, 0, span('l16')))); grad('#06101e', '#0e2238', -600, 2600); reset();
  g.save(); g.strokeStyle = 'rgba(120,180,220,.08)'; g.lineWidth = 2; for (let x = 0; x <= W; x += 80) line([[x, 0], [x, H]], 2, 'rgba(120,180,220,.07)'); for (let y = 0; y <= H; y += 80) line([[0, y], [W, y]], 2, 'rgba(120,180,220,.07)'); g.restore();
  const isl = pts => { g.beginPath(); pts.map(geo).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  g.save(); g.shadowColor = 'rgba(120,230,200,.5)'; g.shadowBlur = 30; for (const k in PH) { isl(PH[k]); g.fillStyle = lg(0, 330, 0, 1500, ['#3a7a5a', '#2a5a4a']); g.fill(); } g.restore();
  for (const k in PH) { isl(PH[k]); g.strokeStyle = 'rgba(170,240,210,.7)'; g.lineWidth = 3; g.stroke(); }
  text(TX.ph, 850, 720, 52, '#9fd8c8', 'Anton', 'center', 8);
  const [mx, my] = geo([123.6, 6.75]); for (let k = 0; k < 3; k++) { const p = ((t - LN.l16.t0) * .7 + k / 3) % 1; circ(mx, my, 20 + p * 220, `rgba(255,49,80,${.7 * (1 - p)})`, 6); } circ(mx, my, 16, RED); g.save(); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 20; text(TX.moro, mx - 60, my - 70, 50, '#ff8a96', 'Anton', 'right', 8); g.restore();
};
// 15. where would you run?
S.comment = (t, u) => {
  cam(540, 960, lerp(1.0, 1.08, seg(u, 0, span('l17')))); const post = beachScene(t, { recede: 1, wave: .3, storm: 1, people: 0 }); lightPass('#222a38'); post();
  const k = back(seg(u, .1, .4), 1.7); reset(); g.save(); g.translate(CX, 600); g.scale(k, k); glass(-430, -150, 860, 300, 50, 'rgba(255,255,255,.7)', 4, 'rgba(255,255,255,.5)'); path([[-200, 148], [-260, 230], [-90, 148]]); g.closePath(); g.fillStyle = 'rgba(8,10,22,.8)'; g.fill();
  g.font = '84px Anton'; const sc = Math.min(1, 800 / g.measureText(TX.where).width); g.save(); g.translate(0, -40); g.scale(sc, sc); text(TX.where, 0, 0, 84, '#fff', 'Anton'); g.restore(); g.save(); g.shadowColor = 'rgba(255,170,80,1)'; g.shadowBlur = 24; text(TX.comment, 0, 70, 70, YEL, 'Anton'); g.restore(); g.restore();
};
// 16. share it; then the loop: the sea pulling back (= frame 1)
S.cta = (t, u) => {
  cam(540, 1000, 1.05); const post = beachScene(t, { recede: 0, storm: 0, people: 1 }); lightPass('#4a3a50'); post();
  const k = back(seg(u, 0, .3), 1.8); reset(); g.save(); g.translate(CX, 600); g.scale(k, k); glass(-440, -150, 880, 300, 36, 'rgba(255,179,87,.6)', 3, 'rgba(255,179,87,.7)'); text(TX.share[0], 0, -50, 100, '#fff', 'Anton'); g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 26; g.font = '70px Anton'; const sc = Math.min(1, 800 / g.measureText(TX.share[1]).width); g.translate(0, 62); g.scale(sc, sc); text(TX.share[1], 0, 0, 70, YEL, 'Anton'); g.restore(); g.restore();
};
S.loop = (t, u) => { cam(540, 980, 1.12); const post = beachScene(t, { recede: .25 * seg(u, 0, 1.6), storm: .25, people: 1 }); lightPass('#3a3048'); post(); };

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['recede', 'mistake', 'r2', 'r3', 'ph', 'comment', 'cta', 'loop', 'horizon', 'wave'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1; BLACK = 0;
  if (ln && ln.t1 - ln.t0 > 2.4 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .08 * eo(seg(t, mid, mid + .35)); }
  S[sh[2]](t, u);
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'recede') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .3, .6)));
  if (!['recede', 'loop'].includes(sh[2]) || t > LN.l02.t0) countdown(t, sh[2], ['recede', 'loop'].includes(sh[2]) ? 540 : 165);
  if (!['cta', 'loop', 'comment', 'ph'].includes(sh[2])) statCard(t);
  if (sh[2] === 'ph') statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  if (!['cta', 'loop', 'comment'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);
