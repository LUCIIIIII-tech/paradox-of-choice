
// ==================== realistic people: adult proportions, painted shading, thin outlines ====================
// a face, front (turn -1..1 moves the features for a three-quarter look). r = half the head height.
// eyes open | wide | shut | dead. female, age (wrinkles), stache, hairStyle short | long | bun, glasses
function faceReal(x, y, r, o = {}) {
  const { skin = DRV.skin, hair = DRV.hair, eyes = 'open', look = 0, lookY = 0, mouth = 0, turn = 0, stache = 0, female = 0, sweat = 0, t = 0, rim = null, lx = -1, age = 0, glasses = 0, tear = 0, smile = 0, pale = 0, iris = '#3a2416' } = o;
  const hairStyle = o.hairStyle || (female ? 'long' : 'short');
  const w = r * (female ? .74 : .79), cx = x + turn * w * .2, dead = eyes === 'dead', sk = skin;
  if (hairStyle === 'long') { g.beginPath(); g.ellipse(x, y - r * .1, w * 1.25, r * 1.12, 0, Math.PI, TAU); g.lineTo(x + w * 1.45, y + r * 2.4); g.lineTo(x - w * 1.45, y + r * 2.4); g.closePath(); g.fillStyle = lg(x, y - r, x, y + r * 2.4, [hair[1], hair[0], '#020203']); g.fill(); }
  g.fillStyle = lg(x - w * .5, 0, x + w * .5, 0, [sk[2], sk[1], sk[2]]); g.fillRect(x - w * .48, y + r * .5, w * .96, r * 1.0);
  g.fillStyle = lg(0, y + r * .7, 0, y + r * 1.1, ['rgba(20,8,10,.55)', 'rgba(20,8,10,0)']); g.fillRect(x - w * .48, y + r * .7, w * .96, r * .4);
  for (const sg of [-1, 1]) { const ex = x + sg * w * .96 - turn * w * .1, ey = y + r * .05; ell(ex, ey, w * .13, r * .2, sg * .12); g.fillStyle = sg === lx ? sk[1] : sk[2]; g.fill(); curve([ex - sg * w * .02, ey - r * .12], [ex + sg * w * .07, ey], [ex - sg * w * .01, ey + r * .12], r * .018, 'rgba(70,25,25,.45)'); }
  const P = () => { g.beginPath(); g.moveTo(x, y - r); g.bezierCurveTo(x + w * .96, y - r, x + w * 1.03, y - r * .25, x + w * .96, y + r * .15); g.bezierCurveTo(x + w * .88, y + r * .6, x + w * .5, y + r * .97, cx, y + r); g.bezierCurveTo(x - w * .5, y + r * .97, x - w * .88, y + r * .6, x - w * .96, y + r * .15); g.bezierCurveTo(x - w * 1.03, y - r * .25, x - w * .96, y - r, x, y - r); g.closePath(); };
  P(); g.fillStyle = rg(x + lx * w * .35, y - r * .25, r * .1, r * 1.35, [sk[0], sk[1], sk[2]]); g.fill();
  const ey = y - r * .02, ew = w * .24, eh = r * (eyes === 'wide' ? .085 : .062), EX = sg => cx + sg * w * .42 * (1 - sg * turn * .18);
  g.save(); P(); g.clip();
  g.fillStyle = lg(x - lx * w, 0, x + lx * w * .2, 0, ['rgba(25,8,14,.5)', 'rgba(25,8,14,0)']); g.fillRect(x - w * 1.1, y - r * 1.1, w * 2.2, r * 2.2);
  g.fillStyle = lg(0, y + r * .55, 0, y + r, ['rgba(25,8,14,0)', 'rgba(25,8,14,.35)']); g.fillRect(x - w, y + r * .55, 2 * w, r * .5);
  for (const sg of [-1, 1]) { const ex = EX(sg); g.fillStyle = rg(ex, ey - eh * .3, 0, ew * 1.5, [`rgba(40,14,24,${.38 + .3 * dead + .2 * age})`, 'rgba(40,14,24,0)']); g.fillRect(ex - ew * 2, ey - ew * 2, ew * 4, ew * 4);
    g.fillStyle = rg(ex + sg * w * .08, y + r * .3, 0, w * .32, [pale ? 'rgba(200,210,230,.1)' : `rgba(230,110,100,${female ? .2 : .1})`, 'rgba(230,110,100,0)']); g.fillRect(ex - w * .4, y, w * .8, r * .6);
    g.fillStyle = rg(ex + sg * w * .12, y + r * .12, 0, w * .2, [`rgba(255,240,225,${sg === lx ? .18 : .05})`, 'rgba(255,240,225,0)']); g.fillRect(ex - w * .3, y - r * .1, w * .6, r * .5); }
  g.fillStyle = rg(cx, y + r * .42, 0, w * .25, ['rgba(30,10,15,.3)', 'rgba(30,10,15,0)']); g.fillRect(cx - w * .3, y + r * .3, w * .6, r * .3);
  g.fillStyle = rg(cx, y + r * .82, 0, w * .3, ['rgba(30,10,15,.25)', 'rgba(30,10,15,0)']); g.fillRect(cx - w * .4, y + r * .62, w * .8, r * .4);
  if (!female) for (let i = 0; i < 240; i++) { const a = hash(i * 1.7) * Math.PI, q = .55 + .42 * hash(i * 3.1), px = cx + Math.cos(a) * w * .9 * q, py = y + r * .2 + Math.sin(a) * r * .8 * q; if (Math.abs(px - cx) < w * .22 && py < y + r * .62 && py > y + r * .38) continue; g.fillStyle = 'rgba(30,22,26,.22)'; g.fillRect(px, py, 1.6, 1.6); }
  if (age > 0) { for (const sg of [-1, 1]) { const ex = EX(sg); for (let k = 0; k < 3; k++) curve([ex + sg * ew * 1.05, ey - eh + k * eh * .9], [ex + sg * ew * 1.35, ey + k * eh], [ex + sg * ew * 1.55, ey - eh * .4 + k * eh * 1.3], r * .008, `rgba(60,25,25,${.35 * age})`);
      curve([cx + sg * w * .2, y + r * .35], [cx + sg * w * .34, y + r * .55], [cx + sg * w * .3, y + r * .74], r * .012, `rgba(60,25,25,${.4 * age})`); }
    for (let k = 0; k < 3; k++) curve([cx - w * .45, y - r * .5 - k * r * .08], [cx, y - r * .53 - k * r * .08], [cx + w * .45, y - r * .5 - k * r * .08], r * .008, `rgba(60,25,25,${.25 * age})`); }
  if (rim) { g.globalAlpha = .75; g.translate(-lx * r * .035, 0); P(); g.lineWidth = r * .07; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  P(); g.strokeStyle = 'rgba(15,6,10,.65)'; g.lineWidth = r * .012; g.stroke();
  for (const sg of [-1, 1]) {
    const ex = EX(sg), ix = ex + look * ew * .45, iy = ey + lookY * eh * .4;
    curve([ex - ew * 1.05, ey - eh * 1.75], [ex, ey - eh * 2.6], [ex + ew * 1.05, ey - eh * 1.6], r * .012, 'rgba(60,25,30,.45)');
    if (eyes === 'shut') { curve([ex - ew, ey], [ex, ey + eh * .8], [ex + ew, ey - eh * .1], r * .02, '#1a0c10'); for (let k = 0; k < 5; k++) line([[ex - ew * .7 + k * ew * .35, ey + eh * .55], [ex - ew * .75 + k * ew * .35, ey + eh * .95]], r * .007, '#1a0c10'); }
    else {
      const A = () => { g.beginPath(); g.moveTo(ex - ew, ey + eh * .1); g.bezierCurveTo(ex - ew * .45, ey - eh * 1.45, ex + ew * .5, ey - eh * 1.4, ex + ew, ey - eh * .05); g.bezierCurveTo(ex + ew * .45, ey + eh * 1.05, ex - ew * .45, ey + eh * 1.1, ex - ew, ey + eh * .1); g.closePath(); };
      A(); g.fillStyle = dead ? '#cfc8b8' : lg(0, ey - eh, 0, ey + eh, ['#b8aca2', '#ece4da']); g.fill();
      g.save(); A(); g.clip();
      if (dead) { g.strokeStyle = 'rgba(150,40,50,.6)'; g.lineWidth = r * .004; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(ex + (k % 2 ? ew : -ew), ey + (hash(k) - .5) * eh); g.lineTo(ex + (k % 2 ? ew * .4 : -ew * .4), ey + (hash(k + 3) - .5) * eh); g.stroke(); } }
      const ir = eh * (eyes === 'wide' ? .82 : 1.05);
      circ(ix, iy, ir, rg(ix, iy, ir * .1, ir, dead ? ['#f4f6f8', '#c8d0d6', '#8a949c'] : ['#7a5236', iris, '#120a06']));
      if (!dead) for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; line([[ix + Math.cos(a) * ir * .35, iy + Math.sin(a) * ir * .35], [ix + Math.cos(a) * ir * .85, iy + Math.sin(a) * ir * .85]], r * .004, 'rgba(255,220,170,.18)'); }
      circ(ix, iy, ir * (dead ? .18 : eyes === 'wide' ? .32 : .42), dead ? 'rgba(80,90,100,.7)' : '#050304');
      g.fillStyle = lg(0, ey - eh * 1.2, 0, ey, ['rgba(20,8,10,.6)', 'rgba(20,8,10,0)']); g.fillRect(ex - ew, ey - eh * 1.4, ew * 2, eh * 1.4);
      if (!dead) { circ(ix - ir * .35, iy - ir * .4, ir * .22, 'rgba(255,255,255,.9)'); circ(ix + ir * .3, iy + ir * .25, ir * .08, 'rgba(255,255,255,.5)'); }
      g.restore();
      g.beginPath(); g.moveTo(ex - ew * 1.05, ey + eh * .12); g.bezierCurveTo(ex - ew * .45, ey - eh * 1.5, ex + ew * .5, ey - eh * 1.45, ex + ew * 1.05, ey - eh * .05); g.strokeStyle = '#120608'; g.lineWidth = r * (female ? .024 : .017); g.stroke();
      curve([ex - ew * .9, ey + eh * .4], [ex, ey + eh * 1.25], [ex + ew * .9, ey + eh * .2], r * .008, 'rgba(90,40,40,.55)');
      if (dead || age) curve([ex - ew * .8, ey + eh * 1.5], [ex, ey + eh * 2.3], [ex + ew * .8, ey + eh * 1.4], r * .01, `rgba(60,20,40,${dead ? .6 : .3})`);
    }
    const by = ey - eh * (eyes === 'wide' ? 3.6 : 2.9), bw = female ? r * .022 : r * .042;
    g.beginPath(); g.moveTo(ex - sg * ew * 1.1, by + eh * (eyes === 'wide' ? -.4 : .3)); g.quadraticCurveTo(ex - sg * ew * .1, by - eh * .9, ex + sg * ew * 1.2, by + eh * .5); g.strokeStyle = hair[0]; g.lineWidth = bw; g.lineCap = 'round'; g.stroke();
    for (let k = 0; k < 8; k++) { const u = k / 7, bx = lerp(ex - sg * ew * 1.05, ex + sg * ew * 1.1, u), byy = by - eh * .45 * Math.sin(u * Math.PI) + eh * .2; line([[bx, byy + bw * .4], [bx + sg * ew * .12, byy - bw * .5]], r * .006, hair[0]); }
    if (tear > 0 && sg === 1) { const p = (t * .3) % 1; circ(ex + ew * .3, ey + eh * 1.6 + p * r * .5, r * .018, `rgba(190,220,255,${tear * (1 - p)})`); line([[ex + ew * .3, ey + eh * 1.3], [ex + ew * .3, ey + eh * 1.6 + p * r * .5]], r * .006, `rgba(190,220,255,${.4 * tear})`); }
  }
  g.beginPath(); g.moveTo(cx - lx * w * .05, ey - r * .02); g.quadraticCurveTo(cx - lx * w * .1, y + r * .2, cx - lx * w * .12, y + r * .33); g.strokeStyle = 'rgba(60,20,25,.3)'; g.lineWidth = r * .02; g.stroke();
  circ(cx + lx * w * .02, y + r * .3, w * .06, 'rgba(255,235,220,.25)');
  for (const sg of [-1, 1]) { curve([cx + sg * w * .1, y + r * .3], [cx + sg * w * .19, y + r * .36], [cx + sg * w * .1, y + r * .41], r * .016, 'rgba(70,25,25,.6)'); ell(cx + sg * w * .07, y + r * .405, w * .035, r * .015, sg * .3); g.fillStyle = 'rgba(30,8,12,.75)'; g.fill(); }
  const my = y + r * .58, mw = w * (.33 + .05 * smile);
  for (const sg of [-1, 1]) line([[cx + sg * w * .035, y + r * .44], [cx + sg * w * .04, my - r * .04]], r * .008, 'rgba(70,25,25,.25)');
  if (mouth > .05) { ell(cx, my + r * .03, mw * .6, r * (.02 + .07 * mouth)); g.fillStyle = '#1e060c'; g.fill(); }
  const lipc = pale ? '#8a8494' : female ? '#a8505a' : '#8a4a46';
  g.beginPath(); g.moveTo(cx - mw, my); g.quadraticCurveTo(cx - mw * .4, my - r * .055, cx, my - r * .025); g.quadraticCurveTo(cx + mw * .4, my - r * .055, cx + mw, my); g.quadraticCurveTo(cx, my + r * .01, cx - mw, my); g.fillStyle = lipc; g.fill();
  g.beginPath(); g.moveTo(cx - mw * .9, my + r * .005); g.quadraticCurveTo(cx, my + r * .075, cx + mw * .9, my + r * .005); g.quadraticCurveTo(cx, my + r * .02, cx - mw * .9, my + r * .005); g.fillStyle = mixHex(lipc, '#e8b0a0', .25); g.fill();
  circ(cx + lx * mw * .2, my + r * .04, r * .012, 'rgba(255,240,230,.35)');
  g.beginPath(); g.moveTo(cx - mw * 1.02, my + (smile ? -r * .02 : r * .005)); g.quadraticCurveTo(cx, my + r * .012 + smile * r * .03, cx + mw * 1.02, my + (smile ? -r * .02 : r * .005)); g.strokeStyle = '#2a0c10'; g.lineWidth = r * .01; g.stroke();
  if (stache) { g.beginPath(); g.moveTo(cx - mw * 1.15, my + r * .02); g.quadraticCurveTo(cx - mw * .5, my - r * .11, cx, my - r * .07); g.quadraticCurveTo(cx + mw * .5, my - r * .11, cx + mw * 1.15, my + r * .02); g.quadraticCurveTo(cx + mw * .5, my - r * .03, cx, my - r * .04); g.quadraticCurveTo(cx - mw * .5, my - r * .03, cx - mw * 1.15, my + r * .02); g.fillStyle = hair[0]; g.fill(); for (let k = 0; k < 16; k++) { const u = k / 15 - .5; line([[cx + u * mw * 1.8, my - r * .08 + Math.abs(u) * r * .05], [cx + u * mw * 2.0, my - r * .02 + Math.abs(u) * r * .06]], r * .005, hair[1]); } }
  if (hairStyle === 'short') {
    const HP = () => { g.beginPath(); g.moveTo(x - w * 1.0, y + r * .02); g.bezierCurveTo(x - w * 1.1, y - r * 1.42, x + w * 1.1, y - r * 1.42, x + w * 1.0, y + r * .02);
      g.lineTo(x + w * .9, y - r * .3); for (let i = 0; i <= 10; i++) { const u = 1 - i / 10; g.lineTo(x + lerp(-w * .9, w * .9, u), y - r * (.56 + .05 * Math.sin(u * Math.PI)) + (hash(i * 3.3) - .5) * r * .04); } g.lineTo(x - w * .9, y - r * .3); g.closePath(); };
    HP(); g.fillStyle = rg(x + lx * w * .3, y - r * .95, r * .05, r * 1.1, [hair[1], hair[0], '#050404']); g.fill();
    g.save(); HP(); g.clip(); for (let i = 0; i < 90; i++) { const px = x + (hash(i * 2.1) - .5) * w * 2, py = y - r * (.3 + .7 * hash(i * 4.3)); line([[px, py], [px + (px - x) * .05, py - r * .05]], r * .008, hash(i) > .5 ? 'rgba(200,190,180,.12)' : 'rgba(0,0,0,.35)'); } g.restore();
  } else if (hairStyle === 'bun') {
    circ(x, y - r * 1.1, r * .32, hair[1]); for (let k = 0; k < 10; k++) curve([x - r * .25, y - r * 1.02], [x, y - r * (1.25 - .04 * k)], [x + r * .25, y - r * 1.0], r * .01, 'rgba(90,90,96,.5)');
    g.beginPath(); g.moveTo(x - w * 1.0, y + r * .05); g.bezierCurveTo(x - w * 1.1, y - r * 1.42, x + w * 1.1, y - r * 1.42, x + w * 1.0, y + r * .05); g.quadraticCurveTo(x + w * .7, y - r * .55, x, y - r * .62); g.quadraticCurveTo(x - w * .7, y - r * .55, x - w * 1.0, y + r * .05); g.closePath(); g.fillStyle = lg(0, y - r, 0, y, [hair[0], hair[1]]); g.fill();
    for (let k = 0; k < 24; k++) { const u = k / 23 - .5; curve([x + u * w * .3, y - r * .62], [x + u * w * 1.6, y - r * .8], [x + u * w * 2, y - r * .05], r * .006, 'rgba(90,90,96,.45)'); }
  } else {
    for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(x + sg * w * .04, y - r * .98); g.bezierCurveTo(x + sg * w * .9, y - r * .9, x + sg * w * 1.05, y - r * .1, x + sg * w * 1.02, y + r * 1.4); g.lineTo(x + sg * w * 1.38, y + r * 1.9); g.bezierCurveTo(x + sg * w * 1.35, y + r * .3, x + sg * w * 1.25, y - r * 1.15, x + sg * w * .04, y - r * 1.05); g.closePath(); g.fillStyle = lg(x, y - r, x + sg * w * 1.4, y + r, [hair[1], hair[0]]); g.fill();
      for (let k = 0; k < 14; k++) { const u = k / 13; curve([x + sg * w * (.05 + .2 * u), y - r * 1.0], [x + sg * w * (.9 + .4 * u), y - r * (.4 - .2 * u)], [x + sg * w * (1.05 + .3 * u), y + r * (1.3 + .5 * u)], r * .008, k % 3 ? 'rgba(140,140,170,.15)' : 'rgba(0,0,0,.4)'); } }
  }
  if (glasses) for (const sg of [-1, 1]) { const ex = EX(sg); rr(ex - ew * 1.35, ey - eh * 2.2, ew * 2.7, eh * 3.8, eh); g.fillStyle = 'rgba(200,220,255,.08)'; g.fill(); g.strokeStyle = '#2a2622'; g.lineWidth = r * .014; g.stroke(); if (sg < 0) line([[ex + ew * 1.35, ey - eh * .6], [EX(1) - ew * 1.35, ey - eh * .6]], r * .012, '#2a2622'); }
  if (sweat > 0) for (let i = 0; i < 3; i++) { const p = ((t * .35 + i * .33) % 1), sx = x + (i - 1) * w * .5, sy = y - r * .5 + p * r * .6; g.save(); g.globalAlpha = sweat * (1 - p) * .9; g.beginPath(); g.moveTo(sx, sy - r * .05); g.quadraticCurveTo(sx + r * .03, sy, sx, sy + r * .025); g.quadraticCurveTo(sx - r * .03, sy, sx, sy - r * .05); g.fillStyle = 'rgba(210,235,255,.8)'; g.fill(); circ(sx - r * .008, sy - r * .005, r * .007, '#fff'); g.restore(); }
}
// head and shoulders, front: a polo shirt (collar, placket, buttons, folds) or a house dress; the head on top. s = shoulder width
function bust(x, y, s, o = {}) {
  const { shirt = DRV.hood, lx = -1, rim = null, t = 0, breathe = 1, collar = 1 } = o, br = Math.sin(t * 1.9) * s * .006 * breathe, r = s * .3, hy = y - s * .92 + br;
  const P = () => { g.beginPath(); g.moveTo(x - s * .16, y - s * .5 + br); g.quadraticCurveTo(x - s * .45, y - s * .5 + br, x - s * .52, y - s * .3 + br); g.quadraticCurveTo(x - s * .6, y + s * .1, x - s * .62, y + s * .8); g.lineTo(x + s * .62, y + s * .8); g.quadraticCurveTo(x + s * .6, y + s * .1, x + s * .52, y - s * .3 + br); g.quadraticCurveTo(x + s * .45, y - s * .5 + br, x + s * .16, y - s * .5 + br); g.closePath(); };
  P(); g.fillStyle = lg(x - s * .6, 0, x + s * .6, 0, lx < 0 ? [shirt[0], shirt[1], shirt[2]] : [shirt[2], shirt[1], shirt[0]]); g.fill();
  g.save(); P(); g.clip();
  for (let k = 0; k < 7; k++) curve([x + (k - 3) * s * .13, y - s * .35], [x + (k - 3) * s * .16 + Math.sin(k) * s * .03, y + s * .1], [x + (k - 3) * s * .18, y + s * .8], s * .006, 'rgba(10,12,24,.25)');
  for (const sg of [-1, 1]) { g.fillStyle = rg(x + sg * s * .42, y - s * .1, 0, s * .3, ['rgba(10,12,24,.35)', 'rgba(10,12,24,0)']); g.fillRect(x + sg * s * .42 - s * .3, y - s * .4, s * .6, s * .9); }
  g.fillStyle = lg(0, y - s * .5, 0, y - s * .2, ['rgba(255,255,255,.12)', 'rgba(255,255,255,0)']); g.fillRect(x - s, y - s * .5, 2 * s, s * .3);
  if (rim) { g.translate(-lx * s * .015, 0); P(); g.lineWidth = s * .02; g.strokeStyle = rim; g.stroke(); }
  g.restore(); P(); g.strokeStyle = 'rgba(10,8,14,.7)'; g.lineWidth = s * .005; g.stroke();
  if (collar) { rr(x - s * .03, y - s * .45, s * .06, s * .3, s * .01); g.fillStyle = 'rgba(0,0,0,.15)'; g.fill(); for (let k = 0; k < 3; k++) circ(x, y - s * (.4 - k * .09), s * .012, '#e8e4dc');
    for (const sg of [-1, 1]) { path([[x, y - s * .44 + br], [x + sg * s * .2, y - s * .53 + br], [x + sg * s * .22, y - s * .4 + br], [x + sg * s * .03, y - s * .32 + br]]); g.closePath(); g.fillStyle = lg(0, y - s * .55, 0, y - s * .3, [shirt[0], shirt[1]]); g.fill(); g.strokeStyle = 'rgba(10,8,14,.5)'; g.lineWidth = s * .004; g.stroke(); } }
  faceReal(x, hy, r, { ...o, t, lx, rim });
  return { head: [x, hy], r };
}
// a painted-canvas texture over every frame (brush strokes), for the painterly finish
TEX.brush = paint(mk(1080, 1920), (w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const x = hash(i * 1.31) * w, y = hash(i * 2.77) * h, a = (hash(i * 5.3) - .5) * .9 + .6, l = 10 + 40 * hash(i * 7.1); g.strokeStyle = hash(i * 9.7) > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; g.lineWidth = 2 + 5 * hash(i * 3.9); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } });

// a realistic hand, seen from the back: the palm, four jointed fingers (curl 0 open .. 1 gripping), the thumb, knuckles, veins, nails.
// (x, y) = the wrist, s = the hand length, ang = the direction the fingers point
function handReal(x, y, s, ang, o = {}) {
  const { skin = DRV.skin, curl = 0, sg = 1, spread = .12 } = o;
  g.save(); g.translate(x, y); g.rotate(ang); if (sg < 0) g.scale(1, -1);
  rr(-s * .25, -s * .17, s * .3, s * .34, s * .14); g.fillStyle = lg(0, -s * .17, 0, s * .17, [skin[1], skin[2]]); g.fill();
  const P = () => { g.beginPath(); g.moveTo(0, -s * .2); g.quadraticCurveTo(s * .25, -s * .26, s * .5, -s * .21); g.lineTo(s * .52, s * .2); g.quadraticCurveTo(s * .25, s * .26, 0, s * .2); g.quadraticCurveTo(-s * .06, 0, 0, -s * .2); g.closePath(); };
  const F = k => { const fy = lerp(-s * .17, s * .15, k / 3), L_ = s * [.42, .48, .45, .36][k], a0 = (k - 1.5) * spread * (1 - curl), seg_ = [L_ * .45, L_ * .32, L_ * .23], w = s * [.095, .1, .095, .08][k];
    let px = s * .5, py = fy, a = a0; const pts = [[px, py]];
    for (let j = 0; j < 3; j++) { px += Math.cos(a) * seg_[j]; py += Math.sin(a) * seg_[j]; pts.push([px, py]); a += curl * (j ? 1.1 : .7) * (k === 3 ? 1.1 : 1); }
    line(pts, w + 2, 'rgba(20,8,6,.6)'); line(pts, w, skin[1]); g.save(); g.translate(0, -w * .18); line(pts.slice(0, 3), w * .35, `rgba(255,230,210,.18)`); g.restore();
    for (let j = 1; j < 3; j++) { const [qx, qy] = pts[j]; curve([qx - w * .1, qy - w * .35], [qx + w * .05, qy], [qx - w * .1, qy + w * .35], s * .006, 'rgba(60,25,20,.45)'); }
    const [nx, ny] = pts[3], [mx, my] = pts[2], na = Math.atan2(ny - my, nx - mx); g.save(); g.translate(nx - Math.cos(na) * w * .35, ny - Math.sin(na) * w * .35); g.rotate(na); rr(-w * .3, -w * .3, w * .55, w * .6, w * .25); g.fillStyle = 'rgba(240,210,200,.55)'; g.fill(); g.restore(); };
  for (const k of [3, 2, 1, 0]) F(k);
  P(); g.fillStyle = lg(0, -s * .22, 0, s * .22, [skin[0], skin[1], skin[2]]); g.fill(); P(); g.strokeStyle = 'rgba(20,8,6,.6)'; g.lineWidth = s * .008; g.stroke();
  for (let k = 0; k < 4; k++) { const ky = lerp(-s * .17, s * .15, k / 3); circ(s * .47, ky, s * .045, 'rgba(255,230,210,.22)'); curve([s * .1, ky * .6], [s * .3, ky * .85], [s * .45, ky], s * .012, 'rgba(70,30,30,.25)'); }
  curve([s * .05, -s * .05], [s * .2, -s * .1], [s * .35, -s * .02], s * .01, 'rgba(90,60,120,.25)');
  const ta = -.9 + curl * .7; line([[s * .08, s * .17], [s * .08 + Math.cos(-ta) * s * .2, s * .17 + Math.sin(-ta) * s * .2 * -1 + s * .08], [s * .08 + Math.cos(-ta) * s * .33, s * .3 + curl * s * .02]], s * .11, skin[2]);
  line([[s * .08, s * .17], [s * .08 + Math.cos(-ta) * s * .2, s * .25], [s * .08 + Math.cos(-ta) * s * .33, s * .3 + curl * s * .02]], s * .085, skin[1]);
  g.restore();
}
