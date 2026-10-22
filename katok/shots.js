
// ---------- the knocks (the same times drive the picture and score.py) ----------
const S = {};
C.under = '210,225,255'; C.clock = '255,40,50';
const KN = (() => { const k = [.05, .42, .79]; const a = wordT('l02', 'Tatlong') - .1; k.push(a, a + .55, a + 1.1);
  const b = wordT('l07', 'kumatok'); k.push(b, b + .5, b + 1.0); const c = LN.tail.t0; k.push(c + .2, c + .58, c + .96); return k; })();
const LOWK = (() => { const b = wordT('l07', 'kumatok'); return [b, b + .5, b + 1.0]; })();
const knockAt = t => { let v = 0; for (const k of KN) if (t >= k && t < k + .35) v = Math.max(v, Math.exp(-(t - k) * 14)); return v; };
// the front door at night, seen from inside: wallpaper, the door, the light strip under it, a red alarm clock
function hallway(t, o = {}) {
  const { shadows = 0, lowShake = 0, chain = 1, push = 0 } = o, back_ = keep(), kn = knockAt(t), dx = Math.sin(t * 80) * 6 * kn * (1 - lowShake);
  g.drawImage(TEX.wall, -500, -500, 2100, 2400); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#6a6a88'; g.fillRect(-500, -500, 2100, 2400); g.restore();
  g.drawImage(TEX.floorFront, -500, 1510, 2100, 900); g.fillStyle = '#20263c'; g.fillRect(-500, 1470, 2100, 44);
  rr(270, 260, 540, 1260, 8); fs('#1a120e', 0);
  g.save(); g.translate(dx, 0); if (push) { g.translate(540, 1500); g.scale(1 + .02 * push, 1); g.translate(-540, -1500); }
  rr(300, 290, 480, 1220, 6); fs(lg(300, 0, 780, 0, ['#4a2e20', '#6a4430', '#3e261a']), 6);
  for (const [yy, hh] of [[350, 420], [830, 600]]) { rr(350, yy, 380, hh, 8); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 7; g.stroke(); rr(354, yy + 4, 380, hh, 8); g.strokeStyle = 'rgba(255,220,180,.1)'; g.lineWidth = 2; g.stroke(); }
  for (let k = 0; k < 14; k++) curve([310 + k * 34, 300], [320 + k * 34 + Math.sin(k) * 8, 900], [312 + k * 34, 1500], 2, 'rgba(0,0,0,.12)');
  circ(540, 640, 16, '#c8a060'); circ(540, 640, 9, '#0a0a10'); circ(537, 637, 3, 'rgba(255,255,255,.6)');
  circ(720, 960, 26, rg(714, 954, 3, 26, ['#f0dca0', '#806830'])); circ(720, 960, 26, OL, 4); rr(700, 860, 40, 50, 8); fs('#806830', 3);
  g.restore();
  if (chain) { const sn = push > .7; for (let k = 0; k < 9; k++) { const u = k / 8, x = lerp(735, 840, u) + dx, y = 780 + Math.sin(u * Math.PI) * (40 - 30 * push) + (sn && u > .5 ? (u - .5) * 300 * (push - .7) * 3 : 0); ell(x, y, 11, 7, u * .4); g.strokeStyle = '#c8c0a0'; g.lineWidth = 4; g.stroke(); } rr(828, 765, 24, 40, 4); fs('#8a8270', 3); }
  rr(270, 1505, 540, 12, 2); g.fillStyle = `rgba(${C.under},.9)`; g.fill();
  for (let k = 0; k < 2; k++) if (shadows > 0) { const sx = 450 + k * 160 + (shadows < 1 ? (1 - shadows) * 400 : 0); g.fillStyle = `rgba(0,0,0,${.85 * Math.min(1, shadows)})`; g.fillRect(sx, 1503, 70, 16); }
  rr(860, 1120, 260, 30, 6); fs('#3a2418', 4); rr(900, 1040, 160, 82, 12); fs('#141414', 4); text('3:07', 980, 1083, 56, '#ff3b46', 'Anton');
  L(540, 1510, 360, C.under, .8, .25); L(980, 1080, 260, C.clock, .7, .3); L(540, 800, 900, null, .22);
  return () => { back_(); glow(540, 1511, 320, C.under, .4); glow(980, 1080, 180, C.clock, .5); if (kn > .05) { reset(); g.fillStyle = `rgba(0,0,0,${.2 * kn})`; g.fillRect(0, 0, W, H); } };
}
function ruleCard(t, t0, n, label, col = RED) {      // a big rule card that slams in
  const k = back(seg(t, t0, t0 + .28), 2.2); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k, k); glass(-420, -140, 840, 280, 34, col, 5, 'rgba(255,49,80,.8)');
  text(`${TX.rule} ${n}`, 0, -70, 54, '#ff8a96', 'Anton'); g.font = '100px Anton'; const sc = Math.min(1, 760 / g.measureText(label).width);
  g.save(); g.translate(0, 34); g.scale(sc, sc); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; text(label, 0, 0, 100, '#fff', 'Anton'); g.restore(); g.restore();
}
// ---------- shots ----------
// 1. 3:07 AM. Three knocks. Don't open it.
S.door = (t, u) => {
  cam(540, lerp(900, 860, seg(u, 0, 8)), lerp(1.0, 1.22, ss(seg(u, 0, LN.l02.t1))), 0, 10 * knockAt(t), t);
  const post = hallway(t, { shadows: ss(seg(t, LN.l02.t0, LN.l02.t0 + .6)) });
  person(540, 2200, 1150, { t, arms: 'down', eyes: 'wide', look: 0, lookY: -.2, sweat: .6, tired: .4, lx: 1, rim: 'rgba(170,190,255,.5)' });
  lightPass('#1e2034'); post();
};
// 2. the protocol: a file of rules
S.file = (t, u) => {
  cam(540, 960, lerp(1.08, 1.0, eo(seg(u, 0, 1.2)))); const back_ = keep(); g.fillStyle = '#1a1412'; g.fillRect(-500, -500, 2100, 2900);
  g.save(); g.translate(540, 960); g.rotate(-.03); cshadow(20, 30, 430, 600, .6); rr(-400, -560, 800, 1120, 8); fs('#e4d8bc', 4);
  text(TX.file, 0, -470, 90, '#2a1c14', 'Anton'); line([[-320, -410], [320, -410]], 4, '#2a1c14');
  for (let i = 0; i < 8; i++) { const a = seg(t, LN.l03.t0 + .2 + i * .12, LN.l03.t0 + .35 + i * .12); text(`${i + 1}.`, -310, -330 + i * 100, 48, `rgba(42,28,20,${a})`, 'Anton', 'left'); rr(-250, -345 + i * 100, (380 + 120 * hash(i)) * a, 26, 10); g.fillStyle = 'rgba(42,28,20,.75)'; g.fill(); }
  const sk = seg(t, wordT('l03', 'lalaktaw') - .1, wordT('l03', 'lalaktaw') + .1); if (sk > 0) { g.save(); g.translate(120, 420); g.rotate(-.2); g.scale(lerp(1.6, 1, eo(sk)), lerp(1.6, 1, eo(sk))); g.globalAlpha = .9; rr(-260, -60, 520, 120, 10); g.strokeStyle = '#c8202e'; g.lineWidth = 12; g.stroke(); text(TX.conf, 0, 6, 64, '#c8202e', 'Anton'); g.restore(); }
  g.restore(); L(540, 700, 1000, C.amb, .9, .15); lightPass('#2a2024'); back_();
};
// 3. rule 1: don't answer
S.r1 = (t, u) => {
  cam(540, 820, lerp(1.0, 1.15, seg(u, 0, span('l04')))); const post = hallway(t);
  person(540, 1950, 1250, { t, arms: 'rub', eyes: 'wide', look: .2, sweat: .8, tired: .3, lx: 1, rim: 'rgba(170,190,255,.55)' });
  lightPass('#1c1e30'); post(); ruleCard(t, LN.l04.t0, 1, TX.rules[0]);
};
// 4. rule 2: no lights: they can see your shadow under the door
S.r2 = (t, u) => {
  const ta = wordT('l05', 'anino'), low = ss(seg(t, ta - .4, ta + .6));
  cam(lerp(540, 540, low), lerp(760, 1400, low), lerp(1.3, 1.6, low)); const post = hallway(t, { shadows: low });
  if (low < .9) { g.save(); g.globalAlpha = 1 - low; rr(160, 640, 120, 190, 12); fs('#e8e2d0', 4); rr(195, 680, 50, 90, 8); fs('#c8c0a8', 3); hand(330, 720, 60, Math.PI, { sg: -1 }); g.restore(); }
  lightPass('#1c1e30'); post();
  if (low < .9 && t > LN.l05.t0 + .6) { g.save(); g.globalAlpha = 1 - low; line([[150, 630], [290, 840]], 14, RED); line([[290, 630], [150, 840]], 14, RED); g.restore(); }
  ruleCard(t, LN.l05.t0, 2, TX.rules[1]);
};
// 5. rule 3: the peephole: a fisheye view of an empty corridor
function fisheye(t, empty = 1) {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.arc(CX, 900, 470, 0, TAU); g.clip();
  g.fillStyle = rg(CX, 900, 50, 600, ['#8a8e78', '#4a4c40', '#141410']); g.fillRect(0, 300, W, 1200);
  for (let k = 0; k < 6; k++) { const r = 470 - k * 70; g.beginPath(); g.ellipse(CX, 900, r, r * .9, 0, 0, TAU); g.strokeStyle = `rgba(0,0,0,${.15 + k * .05})`; g.lineWidth = 6; g.stroke(); }
  rr(CX - 70, 820, 140, 240, 6); fs('#2a1c14', 4); rr(CX - 120, 600, 240, 40, 8); fs('#e8f0d8', 0); glow(CX, 620, 300, '220,240,200', .5 * (.8 + .2 * Math.sin(t * 30)));
  if (!empty) { g.fillStyle = 'rgba(0,0,0,.9)'; ell(CX + 60, 980, 70, 90); g.fill(); rr(CX - 20, 1050, 160, 300, 60); g.fill(); }
  g.fillStyle = rg(CX, 900, 250, 480, ['rgba(0,0,0,0)', 'rgba(0,0,0,.95)']); g.fillRect(0, 300, W, 1200); g.restore();
  circ(CX, 900, 470, '#0a0806', 30);
}
S.r3 = (t, u) => { fisheye(t, 1); ruleCard(t, LN.l06.t0, 3, TX.rules[2]); };
// 6. the twist: nobody outside... but it knocks again, lower, from the floor
S.twist = (t, u) => {
  const tw = wordT('l07', 'kumatok');
  if (t < tw - .2) { fisheye(t, 1); return; }
  cam(540, 1380, lerp(1.7, 1.9, seg(t, tw, LN.l07.t1)), 0, 8 * knockAt(t), t);
  const post = hallway(t, { shadows: 1, lowShake: 1 });
  const kn = knockAt(t); g.save(); g.translate(0, 0); rr(300, 1430, 480, 80, 4); g.fillStyle = `rgba(0,0,0,${.15 * kn})`; g.fill(); g.restore();
  lightPass('#1a1c2c'); post();
  if (t > wordT('l07', 'sahig') - .3) { const a = ss(seg(t, wordT('l07', 'sahig') - .3, wordT('l07', 'sahig') + .4)); g.save(); g.globalAlpha = a; for (let k = 0; k < 4; k++) { rr(470 + k * 34, 1500, 22, 22 + 8 * Math.sin(t * 3 + k), 10); g.fillStyle = 'rgba(0,0,0,.95)'; g.fill(); } g.restore(); }
};
// 7. rule 4: "Police. Open up." Don't believe it.
S.r4 = (t, u) => {
  cam(540, 900, lerp(1.1, 1.0, eo(seg(u, 0, 1)))); const post = hallway(t, { shadows: 1 }); lightPass('#1c1e30'); post();
  const tp = wordT('l08', 'pulis'), k = back(seg(t, tp - .3, tp), 1.7);
  if (k > 0) { reset(); g.save(); g.translate(560, 1000); g.scale(k, k); rr(-300, -110, 600, 220, 40); fs('#f4f0e8', 6); path([[-40, 108], [-90, 190], [40, 108]]); g.closePath(); fs('#f4f0e8', 0); text(TX.police[0], 0, -36, 70, '#1a1a20', 'Anton'); text(TX.police[1], 0, 46, 70, '#c8202e', 'Anton'); g.restore(); }
  ruleCard(t, LN.l08.t0, 4, TX.rules[3]);
};
// 8. this is real: impostors at the door (police, delivery, utility)
S.fake = (t, u) => {
  cam(540, 900, lerp(1.0, 1.06, seg(u, 0, span('l09')))); const back_ = keep();
  g.fillStyle = lg(0, -400, 0, 1800, ['#0a0c14', '#1a1e2c']); g.fillRect(-500, -500, 2100, 2800); g.fillStyle = '#2a2a34'; g.fillRect(-500, 1500, 2100, 800);
  for (let i = 0; i < 3; i++) { const x = 230 + i * 310, h = 1000 + 40 * i, k = ss(seg(t, LN.l09.t0 + .4 + i * .35, LN.l09.t0 + .8 + i * .35)); g.save(); g.globalAlpha = k;
    runner(x, 1560, h, 0, { col: '#14141c', rim: 'rgba(255,190,120,.9)', lean: 0, dir: 1 });
    if (i === 0) { rr(x - 70, 1560 - h * .99, 140, 40, 10); fs('#06070c', 0); rr(x - 90, 1560 - h * .95, 180, 18, 8); fs('#06070c', 0); }
    if (i === 1) { rr(x + 10, 1560 - h * .62, 150, 120, 8); fs('#8a6040', 3); }
    if (i === 2) { g.beginPath(); g.ellipse(x + 10, 1560 - h * .97, 80, 50, 0, Math.PI, 0); g.fillStyle = '#e8c020'; g.fill(); }
    g.restore(); }
  L(540, 900, 1500, C.amb, .9, .2); L(540, 300, 900, '255,140,90', .6, .15); lightPass('#2a2430'); back_();
  for (let i = 0; i < 3; i++) { const k = back(seg(t, LN.l09.t0 + .6 + i * .35, LN.l09.t0 + .9 + i * .35), 1.8); if (k > 0) { g.save(); g.translate(230 + i * 310, 1300); g.scale(k, k); glass(-130, -40, 260, 80, 24, AMB, 3, 'rgba(255,170,80,.7)'); text(TX.fake[i], 0, 3, 44, '#ffb357', 'Anton'); g.restore(); } }
};
// 9. rule 5: never say you're alone
S.r5 = (t, u) => {
  const ts = wordT('l10', 'Sumigaw');
  cam(540, 820, lerp(1.0, 1.12, seg(u, 0, span('l10')))); const post = hallway(t, { shadows: 1 });
  person(540, 1950, 1250, { t, arms: t > ts ? 'out' : 'down', eyes: 'wide', mouth: t > ts ? .7 + .2 * Math.sin(t * 10) : 0, look: .2, sweat: .8, lx: 1, rim: 'rgba(170,190,255,.55)' });
  lightPass('#1c1e30'); post(); ruleCard(t, LN.l10.t0, 5, TX.rules[4]);
  if (t > ts) { const k = back(seg(t, ts, ts + .25), 2); reset(); g.save(); g.translate(CX, 820); g.scale(k, k); rr(-330, -80, 660, 160, 50); fs('#fff7e8', 6); text(TX.shout, 0, 6, 76, '#1a1a20', 'Anton'); g.restore(); }
};
// 10. rule 6: the chain won't hold
S.r6 = (t, u) => {
  const tp = wordT('l11', 'tulak'), push = ss(seg(t, tp, tp + .5)) + ss(seg(t, wordT('l11', 'bigay') - .1, wordT('l11', 'bigay') + .15)) * .5;
  cam(780, 800, 2.2, 0, t > tp && t < tp + 1.2 ? 10 * (1 - seg(t, tp, tp + 1.2)) : 0, t); const post = hallway(t, { push: Math.min(1.2, push), shadows: 1 });
  lightPass('#1c1e30'); post(); ruleCard(t, LN.l11.t0, 6, TX.rules[5]);
};
// 11. rule 7: call 911
S.r7 = (t, u) => {
  cam(540, 960, 1); grad('#05060e', '#0e1020', -600, 2600); reset();
  const k = back(seg(u, 0, .3), 1.6) * .78; g.save(); g.translate(CX, 1130); g.scale(k, k); rr(-260, -500, 520, 1000, 60); fs('#101016', 8); rr(-242, -482, 484, 964, 46); g.fillStyle = '#0c1a12'; g.fill();
  text('911', 0, -260, 170, '#fff', 'Anton'); text(TX.calling, 0, -120, 54, '#7dffb0', 'Anton'); const p = (t * .8) % 1; circ(0, 200, 80 + p * 120, `rgba(109,255,168,${.5 * (1 - p)})`, 6); circ(0, 200, 80, '#2ac06a'); rr(-24, 170, 48, 60, 14); fs('#fff', 0); g.restore();
  ruleCard(t, LN.l12.t0, 7, TX.rules[6]);
};
// 12. the knocking stops. Their shadows leave.
S.quiet = (t, u) => {
  cam(540, 1300, lerp(1.6, 1.45, seg(u, 0, span('l13')))); const post = hallway(t, { shadows: 1 - .99 * ss(seg(t, LN.l13.t0 + .4, LN.l13.t1)) });
  lightPass('#1a1c2c'); post();
};
// 13-14. the last rule. When the knocking stops... don't assume they've left.
S.last = (t, u) => {
  const t15 = LN.l15.t0;
  if (t < t15) { cam(CX, 960, 1); grad('#000', '#08040a', -600, 2600); reset(); const k = back(seg(t, LN.l14.t0, LN.l14.t0 + .3), 2); g.save(); g.translate(CX, 900); g.scale(k, k); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 40; text(TX.last, 0, 0, 110, '#ff5068', 'Anton'); g.restore(); return; }
  cam(540, 1250, lerp(1.2, 1.35, seg(t, t15, LN.l15.t1))); const post = hallway(t, { shadows: 0 });
  person(540, 2050, 1100, { t, sit: 1, arms: 'lap', eyes: 'open', lookY: .3, look: 0, tired: .6, sweat: .3, lx: 1, rim: 'rgba(170,190,255,.5)' });
  lightPass('#181a28'); post();
  if (t > wordT('l15', 'umalis')) { const a = ss(seg(t, wordT('l15', 'umalis'), wordT('l15', 'umalis') + .8)); reset(); g.save(); g.globalAlpha = a; for (let k = 0; k < 2; k++) { g.fillStyle = 'rgba(0,0,0,.95)'; g.fillRect(452 + k * 160, 1240 + 290, 70, 0); } g.restore(); }
};
// 15. the sting: your phone lights up
S.sting = (t, u) => {
  const flash = Math.exp(-u * 4);
  cam(540, 1100, lerp(1.25, 1.4, seg(u, 0, 2.2)), 0, 9 * Math.exp(-u * 3), t); const post = hallway(t, { shadows: 1 });
  person(540, 2050, 1100, { t, sit: 1, arms: 'phone', eyes: 'wide', look: .4, sweat: 1, lx: 1, rim: 'rgba(255,80,100,.6)' });
  L(640, 1300, 500, C.red, .9, .3); lightPass('#1a1424'); post();
  reset(); g.fillStyle = `rgba(160,0,20,${.35 * flash})`; g.fillRect(0, 0, W, H);
  const k = back(seg(u, 0, .25), 1.8); g.save(); g.translate(CX, 520); g.scale(k, k); glass(-450, -130, 900, 260, 40, 'rgba(255,255,255,.7)', 3, 'rgba(255,49,80,.7)');
  circ(-360, -40, 40, '#3a3a44'); text('?', -360, -36, 50, '#fff', 'Anton'); text(TX.unknown, -290, -60, 36, '#c9cde0', 'Anton', 'left');
  g.font = '500 46px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(TX.msg, -290, 20); g.restore();
};
// 16. what would you do first? the rules, numbered
S.rules = (t, u) => {
  cam(CX, 960, 1); grad('#05040a', '#120a14', -600, 2600); reset();
  TX.rules.forEach((r, i) => { const k = back(seg(t, LN.l17.t0 + i * .08, LN.l17.t0 + .25 + i * .08), 1.7); if (k <= 0) return; const y = 330 + i * 140; g.save(); g.translate(CX, y); g.scale(k, k); glass(-420, -56, 840, 112, 30, 'rgba(255,49,80,.6)', 3); text(String(i + 1), -360, 4, 64, RED, 'Anton'); text(r, 40, 4, 52, '#fff', 'Anton'); g.restore(); });
  const ck = back(seg(t, wordT('l17', 'numero') - .2, wordT('l17', 'numero') + .1), 1.8); if (ck > 0) { g.save(); g.translate(CX, 1530); g.scale(ck, ck); glass(-380, -70, 760, 140, 70, YEL, 4, 'rgba(255,190,80,.8)'); text(TX.comment, 0, 6, 60, YEL, 'Anton'); g.restore(); }
};
// 17. send it to the friend who lives alone; then the loop: three knocks (= frame 1)
S.cta = (t, u) => {
  cam(540, 900, 1.0); const post = hallway(t, { shadows: 1 }); lightPass('#1e2034'); post();
  const k = back(seg(u, 0, .3), 1.8); reset(); g.save(); g.translate(CX, 460); g.scale(k, k); glass(-430, -150, 860, 300, 36, 'rgba(255,49,80,.6)', 3, 'rgba(255,49,80,.7)'); text(TX.share[0], 0, -50, 100, '#fff', 'Anton'); g.save(); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 26; text(TX.share[1], 0, 62, 76, '#ff6a7a', 'Anton'); g.restore(); g.restore();
};
S.loop = (t, u) => { cam(540, 900, 1.0, 0, 10 * knockAt(t), t); const post = hallway(t, { shadows: 1 }); person(540, 2200, 1150, { t, arms: 'down', eyes: 'wide', lookY: -.2, sweat: .6, lx: 1, rim: 'rgba(170,190,255,.5)' }); lightPass('#1e2034'); post(); };

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['door', 'file', 'r3', 'twist', 'r6', 'r7', 'last', 'sting', 'rules', 'cta', 'loop', 'quiet'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1; BLACK = 0;
  if (ln && ln.t1 - ln.t0 > 2.4 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .08 * eo(seg(t, mid, mid + .35)); }
  S[sh[2]](t, u);
  bloom(); vignette(.6);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'door') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .3, .6)));
  if (!['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].includes(sh[2])) counter(t);
  if (!['cta', 'loop', 'sting'].includes(sh[2])) statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  if (!['cta', 'loop', 'sting', 'rules'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);
