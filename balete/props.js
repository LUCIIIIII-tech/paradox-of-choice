
// ==================== Balete Drive: the 2.5D camera, rain and glass, the taxi, the balete, the white lady ====================
// Every shot is painted as flat layers at a depth (1 = the focal plane, bigger = farther, smaller = nearer). The camera pans, cranes,
// dollies and rolls; near layers move and grow more than far ones (parallax), and layers away from the focus are blurred (rack focus).
const PAL = { taxi: ['#f6f4ec', '#cfccc2', '#7a786e'], stripe: '#2c5cae', seat: ['#6a4a40', '#48302a', '#24140f'], dash: ['#34343c', '#1e1e24', '#0c0c10'] };
const DRV = { hood: ['#86a6c8', '#56789e', '#2a3e58'], legs: ['#3a3a44', '#24242c', '#121216'], skin: ['#c88e66', '#9c6644', '#5c3822'], hair: ['#141010', '#2a201a', '#3e342c'] };
const LADY = { skin: ['#e4e8ee', '#b0b8c4', '#646c7a'], dress: ['#f4f4f2', '#c8cad0', '#6c707c'], hair: ['#040406', '#0a0a0f', '#15151c'] };
const LOLA2 = { hood: ['#8a7a9a', '#62546e', '#342a3e'], legs: ['#4a4038', '#2e2822', '#16120e'], skin: ['#d4a684', '#aa7c5c', '#664430'], hair: ['#e8e6e2', '#b8b4ae', '#76726c'], glasses: 1 };
C.sodium = '255,150,60'; C.ice = '190,215,255'; C.dash = '120,200,255'; C.candle = '255,180,90';

const pat = c => g.createPattern(c, 'repeat');
// ---------- the camera ----------
const CAMV = {};
function setCam(o = {}) { Object.assign(CAMV, { x: 540, y: 900, z: 1, dz: 0, rot: 0, focus: 1, dof: 0, shake: 0, t: 0 }, o); }
setCam();
const LAYC = mk(W, H), FLARES = [];
function camT(d) {
  const k = d / Math.max(.12, d - CAMV.dz), s = CAMV.z * k;
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(CX, 900);
  if (CAMV.shake) { const t = CAMV.t, a = CAMV.shake / d; g.translate(Math.sin(t * 1.7) * a * 6 + Math.sin(t * 3.1) * a * 3, Math.cos(t * 1.3) * a * 5 + Math.sin(t * 2.3) * a * 2); }
  g.scale(s, s); if (CAMV.rot) g.rotate(CAMV.rot);
  g.translate(-(540 + (CAMV.x - 540) / d), -(900 + (CAMV.y - 900) / d));
}
// draw fn as one layer at depth d (blur = the depth of field unless given)
function layer(d, fn, o = {}) {
  const b = o.blur ?? CAMV.dof * Math.abs(1 / d - 1 / CAMV.focus);
  if (b < .5) { g.save(); camT(d); fn(); g.restore(); reset(); return; }
  const old = g; g = LAYC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); camT(d); fn(); reset(); g = old;
  reset(); g.filter = `blur(${Math.min(40, b).toFixed(1)}px)`; g.drawImage(LAYC, 0, 0); reset();
}
// atmospheric haze between layers
function haze(c, a) { reset(); g.fillStyle = `rgba(${c},${a})`; g.fillRect(0, 0, W, H); }
// a lens flare (horizontal anamorphic streak), drawn after the light pass
function F(x, y, len, c, a) { const m = g.getTransform(), s = Math.hypot(m.a, m.b); FLARES.push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, len: len * s, c, a }); }
function flares() {
  reset(); g.globalCompositeOperation = 'screen';
  for (const f of FLARES) { if (f.a <= 0) continue;
    g.fillStyle = lg(f.x - f.len, 0, f.x + f.len, 0, [`rgba(${f.c},0)`, `rgba(${f.c},${f.a * .55})`, `rgba(${f.c},0)`]); g.fillRect(f.x - f.len, f.y - 2.5, 2 * f.len, 5);
    g.fillStyle = lg(f.x - f.len * .5, 0, f.x + f.len * .5, 0, [`rgba(${f.c},0)`, `rgba(${f.c},${f.a * .25})`, `rgba(${f.c},0)`]); g.fillRect(f.x - f.len * .5, f.y - 14, f.len, 28);
    glow(f.x, f.y, f.len * .12, f.c, f.a * .5); }
  FLARES.length = 0; reset();
}

// ---------- rain ----------
function rainFx(t, o = {}) {      // screen space, after the light pass: three depths of streaks
  const { n = 240, a = .3, ang = .1, sp = 1, c = '205,220,255', x0 = 0, y0 = 0, x1 = W, y1 = H, big = 1 } = o;
  reset(); g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); g.globalCompositeOperation = 'screen'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const z = hash(i * 1.37), v = (1300 + 1900 * z) * sp, len = (26 + 110 * z * z) * sp, hh = y1 - y0 + 400;
    const y = y0 - 200 + ((hash(i * 7.7) * hh + t * v) % hh), x = x0 - 200 + hash(i * 3.11) * (x1 - x0 + 400) + (y - y0) * ang;
    g.strokeStyle = `rgba(${c},${a * (.2 + .8 * z)})`; g.lineWidth = .7 + 2.8 * z * z * big;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * ang, y - len); g.stroke();
  }
  g.restore(); reset();
}
function splashes(t, x0, x1, y0, y1, n = 50, a = .4) {   // little crowns on the wet ground (world space)
  for (let i = 0; i < n; i++) { const p = (t * 2.2 + hash(i * 1.9)) % 1, cyc = Math.floor(t * 2.2 + hash(i * 1.9)), x = lerp(x0, x1, hash(i * 3.7 + cyc * 1.3)), y = lerp(y0, y1, hash(i * 5.3 + cyc * 2.1)), sz = (y - y0) / (y1 - y0 + 1) * .7 + .3;
    ell(x, y, 22 * p * sz, 6 * p * sz); g.strokeStyle = `rgba(210,225,255,${a * (1 - p)})`; g.lineWidth = 2; g.stroke(); }
}
function puddleShine(x0, x1, y0, y1, c, a) { g.fillStyle = lg(0, y0, 0, y1, [`rgba(${c},${a})`, `rgba(${c},0)`]); g.fillRect(x0, y0, x1 - x0, y1 - y0); }
function reflect(x, y, gy, w, c, a) {     // a light's streak on the wet road: from the ground line down
  g.save(); g.globalCompositeOperation = 'screen'; const hgt = (gy - y) * 1.6 + 300;
  g.fillStyle = lg(0, gy, 0, gy + hgt, [`rgba(${c},${a})`, `rgba(${c},${a * .35})`, `rgba(${c},0)`]);
  g.beginPath(); g.moveTo(x - w, gy); g.lineTo(x + w, gy); g.lineTo(x + w * .45, gy + hgt); g.lineTo(x - w * .45, gy + hgt); g.closePath(); g.fill();
  for (let k = 0; k < 6; k++) { const yy = gy + 18 + k * hgt / 7; g.fillStyle = `rgba(${c},${a * .5 * (1 - k / 6)})`; g.fillRect(x - w * (1 - k * .08) + Math.sin(k * 3.1) * 10, yy, w * 2 * (1 - k * .08), 3); }
  g.restore();
}

// ---------- wet glass and the wipers (screen space) ----------
const WA0 = Math.PI * 1.0, WA1 = Math.PI * 1.6;
const wipeP = (t, per) => { const p = ((t % per) + per) % per / per; return p < .32 ? ss(p / .32) : p < .64 ? 1 - ss((p - .32) / .32) : 0; };
function windshield(t, o = {}) {
  const { per = 2.1, piv = [[230, 1790], [690, 1790]], len = 760, n = 150, a = 1, wipers = 1, x0 = 0, y0 = 0, x1 = W, y1 = H } = o;
  reset(); g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const angAt = tt_ => lerp(WA0, WA1, wipeP(tt_, per));
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i * 2.13)), y = lerp(y0, y1, hash(i * 4.71)), r = 3 + 10 * hash(i * 9.1) ** 2;
    let vis = 1;
    if (wipers) for (const [px, py] of piv) {
      const d = Math.hypot(x - px, y - py); if (d > len) continue; let th = Math.atan2(y - py, x - px); if (th < 0) th += TAU; if (th < WA0 || th > WA1) continue;
      let last = -99; for (let s = 0; s < 44; s++) { const ta = t - s * per / 40, tb = ta - per / 40, da = angAt(ta) - th, db = angAt(tb) - th; if (da * db <= 0) { last = ta; break; } }
      vis = Math.min(vis, last < -90 ? 1 : seg(t - last, hash(i * 3.3) * per * .7, hash(i * 3.3) * per * .7 + .12));
    }
    if (vis <= 0) continue;
    g.globalAlpha = vis * a;
    g.fillStyle = rg(x - r * .3, y - r * .3, r * .1, r, ['rgba(220,232,255,.10)', 'rgba(120,140,180,.08)', 'rgba(0,0,0,.30)']); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    circ(x - r * .35, y - r * .4, r * .22, 'rgba(255,255,255,.55)'); g.beginPath(); g.arc(x, y, r, .3, 2.8); g.strokeStyle = 'rgba(200,220,255,.25)'; g.lineWidth = 1.2; g.stroke();
  }
  g.globalAlpha = a;
  for (let i = 0; i < 9; i++) {          // a few running drops with trails
    const sp = 70 + 110 * hash(i * 5.5), x = lerp(x0, x1, hash(i * 8.8)) + Math.sin(t * .7 + i) * 6, hh = y1 - y0 + 200, y = y0 - 100 + ((hash(i * 6.6) * hh + t * sp) % hh), r = 6 + 5 * hash(i);
    g.fillStyle = lg(0, y - 160, 0, y, ['rgba(200,220,255,0)', 'rgba(200,220,255,.12)']); g.fillRect(x - r * .4, y - 160, r * .8, 160);
    circ(x, y, r, 'rgba(0,0,0,.22)'); circ(x - r * .3, y - r * .35, r * .3, 'rgba(255,255,255,.6)');
  }
  g.globalAlpha = 1;
  if (wipers) for (const [px, py] of piv) { const an = angAt(t), ex = px + Math.cos(an) * len, ey = py + Math.sin(an) * len;
    line([[px, py], [px + Math.cos(an) * len * .55, py + Math.sin(an) * len * .55 - 14]], 22, '#050507'); line([[px, py], [ex, ey]], 16, '#0b0b0f'); g.save(); g.translate(-3, -3); line([[px, py], [ex, ey]], 4, 'rgba(190,205,240,.55)'); g.restore(); circ(px, py, 26, '#0a0a0e'); circ(px, py, 8, 'rgba(190,205,240,.4)'); }
  g.fillStyle = lg(x0, y0, x1, y1, ['rgba(255,255,255,0)', 'rgba(200,215,255,.05)', 'rgba(255,255,255,0)']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.restore(); reset();
}
function frost(x0, y0, x1, y1, k, t) {      // cold glass: a white haze creeping in from the edges, with ice ferns
  if (k <= 0) return; g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
  g.fillStyle = rg(cx, cy, R * (1.05 - k * .9), R * 1.1, ['rgba(215,230,255,0)', `rgba(215,230,255,${.55 * k})`]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i < 26; i++) { const a = hash(i * 2.9) * TAU, sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R; let px = sx, py = sy, ang = a + Math.PI + (hash(i) - .5) * .8; const L_ = R * .9 * k * (.5 + .5 * hash(i * 4.1));
    for (let s = 0; s < 6; s++) { const nx = px + Math.cos(ang) * L_ / 6, ny = py + Math.sin(ang) * L_ / 6; line([[px, py], [nx, ny]], 2, `rgba(235,245,255,${.5 * k})`); for (const sg of [-1, 1]) line([[nx, ny], [nx + Math.cos(ang + sg * .9) * L_ * .07, ny + Math.sin(ang + sg * .9) * L_ * .07]], 1.4, `rgba(235,245,255,${.4 * k})`); px = nx; py = ny; ang += (hash(i * 7 + s) - .5) * .5; } }
  g.restore();
}
function breath(x, y, t, k, dir = 1) {     // a puff of cold breath, every few seconds
  if (k <= 0) return; const p = (t % 3.2) / 3.2; if (p > .6) return; const u = p / .6;
  for (let i = 0; i < 7; i++) { const q = u * (.6 + .4 * hash(i)); circ(x + dir * q * 170 + Math.sin(i * 2 + t) * 10, y - q * 40 + (hash(i * 3) - .5) * 40 * q, 14 + 50 * q, `rgba(225,235,255,${.16 * k * (1 - u)})`); }
}

// ---------- people seen from the side ----------
// a head in profile, facing right (dir -1 = left). eyes open | wide | shut. stache = the driver's moustache
function headSide(x, y, r, o = {}) {
  const { dir = 1, skin = DRV.skin, hair = DRV.hair, eyes = 'open', mouth = 0, sweat = 0, t = 0, rim = null, stache = 1, look = 0, tear = 0 } = o;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  rr(-r * .42, r * .4, r * .64, r * .8, r * .2); g.fillStyle = lg(-r * .42, 0, r * .22, 0, ['#2a160e', skin[2], skin[1]]); g.fill(); g.fillStyle = lg(0, r * .45, 0, r * .8, ['rgba(20,8,6,.6)', 'rgba(20,8,6,0)']); g.fillRect(-r * .42, r * .45, r * .64, r * .35);
  const P = () => { g.beginPath(); g.moveTo(-r * .95, -r * .05); g.bezierCurveTo(-r * 1.02, -r * .95, r * .05, -r * 1.18, r * .6, -r * .66);
    g.quadraticCurveTo(r * .78, -r * .42, r * .74, -r * .22); g.quadraticCurveTo(r * .8, -r * .14, r * .76, -r * .06); g.lineTo(r * .99, r * .22);
    g.quadraticCurveTo(r * 1.02, r * .31, r * .8, r * .33); g.quadraticCurveTo(r * .85, r * .43, r * .8, r * .49); g.quadraticCurveTo(r * .83, r * .57, r * .76, r * .61);
    g.quadraticCurveTo(r * .8, r * .8, r * .6, r * .87); g.quadraticCurveTo(r * .18, r * .92, -r * .12, r * .64); g.quadraticCurveTo(-r * .62, r * .55, -r * .95, -r * .05); g.closePath(); };
  P(); g.fillStyle = rg(r * .45, -r * .2, r * .1, r * 1.35, [skin[0], skin[1], skin[2]]); g.fill();
  g.save(); P(); g.clip();
  g.fillStyle = rg(r * .45, r * .3, 0, r * .3, ['rgba(220,90,90,.18)', 'rgba(220,90,90,0)']); g.fillRect(0, 0, r, r * .7);
  g.fillStyle = lg(-r, 0, r * .3, 0, ['rgba(40,15,20,.45)', 'rgba(40,15,20,0)']); g.fillRect(-r, -r, r * 1.3, r * 2);
  curve([r * .2, r * .25], [r * .45, r * .55], [r * .62, r * .62], r * .03, 'rgba(70,30,30,.3)');
  if (rim) { g.translate(-r * .06, 0); P(); g.lineWidth = r * .09; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  P(); g.strokeStyle = 'rgba(15,6,10,.6)'; g.lineWidth = r * .016; g.lineJoin = 'round'; g.stroke();
  g.save(); P(); g.clip(); for (let i = 0; i < 160; i++) { const px = r * (.05 + .7 * hash(i * 1.9)), py = r * (.45 + .45 * hash(i * 3.7)); if (px > r * .55 && py < r * .62) continue; g.fillStyle = 'rgba(30,22,26,.25)'; g.fillRect(px, py, 1.5, 1.5); }
    g.fillStyle = rg(r * .55, -r * .1, 0, r * .25, ['rgba(40,14,24,.35)', 'rgba(40,14,24,0)']); g.fillRect(r * .2, -r * .4, r * .7, r * .6); ell(r * .84, r * .28, r * .06, r * .025, .3); g.fillStyle = 'rgba(30,8,12,.7)'; g.fill(); curve([r * .7, r * .2], [r * .76, r * .3], [r * .86, r * .31], r * .02, 'rgba(70,25,25,.5)'); g.restore();
  ell(-r * .18, r * .06, r * .14, r * .21, .1); g.fillStyle = skin[1]; g.fill(); g.strokeStyle = 'rgba(40,15,15,.5)'; g.lineWidth = r * .01; g.stroke(); curve([-r * .16, -r * .06], [-r * .26, r * .06], [-r * .17, r * .16], r * .018, 'rgba(90,40,30,.5)'); curve([-r * .2, -r * .08], [-r * .08, r * .05], [-r * .2, r * .18], r * .03, 'rgba(80,35,30,.6)');
  const ex = r * .56, ey = -r * .1, ew = eyes === 'wide' ? 1.25 : 1;
  if (eyes === 'shut') { curve([ex - r * .13, ey], [ex, ey + r * .07], [ex + r * .12, ey - r * .01], r * .04, OL); for (let k = 0; k < 3; k++) line([[ex - r * .08 + k * r * .07, ey + r * .045], [ex - r * .1 + k * r * .07, ey + r * .1]], r * .02, OL); }
  else { g.beginPath(); g.moveTo(ex - r * .13, ey); g.quadraticCurveTo(ex, ey - r * .1 * ew, ex + r * .13, ey - r * .02); g.quadraticCurveTo(ex + r * .02, ey + r * .08 * ew, ex - r * .13, ey); g.closePath(); g.fillStyle = '#efe6dc'; g.fill();
    g.save(); g.clip(); circ(ex + r * (.06 + .04 * look), ey - r * .005, r * .065, '#2a1a10'); circ(ex + r * (.06 + .04 * look), ey - r * .005, r * (eyes === 'wide' ? .022 : .035), '#050305'); circ(ex + r * .045, ey - r * .03, r * .015, '#fff'); g.restore();
    g.beginPath(); g.moveTo(ex - r * .13, ey); g.quadraticCurveTo(ex, ey - r * .1 * ew, ex + r * .13, ey - r * .02); g.strokeStyle = OL; g.lineWidth = r * .035; g.stroke(); }
  curve([ex - r * .16, ey - r * .19 - (eyes === 'wide' ? r * .06 : 0)], [ex, ey - r * .26 - (eyes === 'wide' ? r * .06 : 0)], [ex + r * .17, ey - r * .17], r * .055, hair[0]);
  if (tear > 0) { const p = (t * .35) % 1; circ(ex + r * .05, ey + r * .1 + p * r * .5, r * .025, `rgba(170,210,255,${tear * (1 - p)})`); }
  if (stache) { g.beginPath(); g.moveTo(r * .62, r * .38); g.quadraticCurveTo(r * .82, r * .36, r * .84, r * .44); g.quadraticCurveTo(r * .74, r * .47, r * .6, r * .45); g.closePath(); g.fillStyle = hair[0]; g.fill(); }
  if (mouth > .05) { ell(r * .78, r * .53, r * .05, r * .03 + r * .06 * mouth); g.fillStyle = '#2a0812'; g.fill(); }
  else { g.beginPath(); g.moveTo(r * .8, r * .47); g.quadraticCurveTo(r * .74, r * .5, r * .7, r * .52); g.lineTo(r * .8, r * .52); g.closePath(); g.fillStyle = '#7a3e3a'; g.fill(); line([[r * .68, r * .525], [r * .8, r * .52]], r * .012, '#2a0c10'); g.beginPath(); g.moveTo(r * .79, r * .53); g.quadraticCurveTo(r * .76, r * .58, r * .7, r * .55); g.fillStyle = '#9a5650'; g.fill(); }
  const HP = () => { g.beginPath(); g.moveTo(r * .62, -r * .64); g.quadraticCurveTo(r * .5, -r * .92, -r * .05, -r * 1.0); g.bezierCurveTo(-r * .8, -r * 1.06, -r * 1.12, -r * .5, -r * 1.0, r * .02);
    g.quadraticCurveTo(-r * .86, r * .2, -r * .62, r * .25); g.quadraticCurveTo(-r * .62, -r * .2, -r * .32, -r * .3); g.quadraticCurveTo(r * .1, -r * .6, r * .62, -r * .64); g.closePath(); };
  HP(); g.fillStyle = rg(r * .1, -r * .9, r * .1, r * 1.2, [hair[2], hair[1], '#060505']); g.fill(); 
  g.save(); HP(); g.clip(); for (let i = 0; i < 120; i++) { const px = -r + 1.6 * r * hash(i * 2.3), py = -r * 1.05 + 1.2 * r * hash(i * 4.1); line([[px, py], [px - r * .06, py + r * .03]], r * .01, hash(i) > .5 ? 'rgba(220,210,200,.1)' : 'rgba(0,0,0,.35)'); } g.restore();
  if (sweat > 0) for (let i = 0; i < 2; i++) { const p = ((t * .4 + i * .5) % 1); g.save(); g.globalAlpha = sweat * (1 - p); const sx = r * (.42 - i * .25), sy = -r * .55 + p * r * .7; g.beginPath(); g.moveTo(sx, sy - r * .08); g.quadraticCurveTo(sx + r * .05, sy, sx, sy + r * .04); g.quadraticCurveTo(sx - r * .05, sy, sx, sy - r * .08); fs('#bfe2ff', r * .015); g.restore(); }
  g.restore();
}
// the driver from the side, at the wheel (x, y = the seat), polo shirt, a towel on his shoulder; arms to the wheel at (wx, wy)
function driverSide(x, y, s, t, o = {}) {
  const { dir = 1, wx = x + dir * .95 * s, wy = y - .6 * s, tremble = 0 } = o, tr = tremble * Math.sin(t * 31) * .006 * s, br = Math.sin(t * 1.9) * .006 * s, sh = DRV.hood;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  rr(-.06 * s, -1.22 * s + br, .21 * s, .24 * s, .06 * s); g.fillStyle = lg(-.06 * s, 0, .15 * s, 0, ['#3a2216', DRV.skin[2], DRV.skin[1]]); g.fill();
  const P = () => { g.beginPath(); g.moveTo(-.24 * s, .05 * s); g.bezierCurveTo(-.34 * s, -.45 * s, -.3 * s, -.9 * s, -.12 * s, -1.04 * s + br); g.quadraticCurveTo(.02 * s, -1.12 * s + br, .16 * s, -1.03 * s + br); g.bezierCurveTo(.3 * s, -.9 * s, .3 * s, -.5 * s, .24 * s, -.2 * s); g.lineTo(.22 * s, .05 * s); g.closePath(); };
  P(); g.fillStyle = lg(-.3 * s, 0, .3 * s, 0, [sh[2], sh[1], sh[0]]); g.fill();
  g.save(); P(); g.clip(); for (let k = 0; k < 6; k++) curve([-.2 * s + k * .08 * s, -.95 * s], [-.22 * s + k * .09 * s, -.5 * s], [-.24 * s + k * .1 * s, .05 * s], .006 * s, 'rgba(8,10,20,.25)');
  g.fillStyle = lg(0, -1.05 * s, 0, -.7 * s, ['rgba(255,255,255,.15)', 'rgba(255,255,255,0)']); g.fillRect(-.4 * s, -1.1 * s, .8 * s, .4 * s); g.restore();
  P(); g.strokeStyle = 'rgba(8,8,14,.7)'; g.lineWidth = .005 * s; g.stroke();
  path([[0, -1.05 * s + br], [.2 * s, -1.0 * s + br], [.17 * s, -.88 * s + br], [.04 * s, -.95 * s + br]]); g.closePath(); g.fillStyle = sh[0]; g.fill(); g.strokeStyle = 'rgba(8,8,14,.5)'; g.lineWidth = .004 * s; g.stroke();
  for (let k = 0; k < 3; k++) circ(.2 * s, (-.86 + k * .1) * s, .012 * s, '#e8e4dc');
  g.restore();
  const s0 = [x + dir * .04 * s, y - .95 * s + br], el = [x + dir * .34 * s, y - .62 * s + tr];
  limb([s0, el, [wx, wy + tr]], .1 * s, sh, -dir); hand(wx + tr, wy + tr, .045 * s, dir > 0 ? -.4 : Math.PI + .4, { skin: DRV.skin, grip: .7 });
  headSide(x + dir * .07 * s, y - 1.3 * s + br, .19 * s, { ...o, dir, t });
}
// ---------- the white lady ----------
function hairCurtain(x, y, r, t, k = 1, part = 0, col = LADY.hair) {      // long hair falling from the crown over the face to the chest; part = a slit of face and one eye
  const len = r * 2.7 * k, sw = Math.sin(t * .8) * r * .05;
  const M = () => { g.beginPath(); g.moveTo(x - r * 1.05, y - r * .15); g.bezierCurveTo(x - r * 1.02, y - r * 1.3, x + r * 1.02, y - r * 1.3, x + r * 1.05, y - r * .15);
    g.quadraticCurveTo(x + r * 1.3 + sw, y + len * .5, x + r * 1.45 + sw, y + len);
    for (let i = 14; i >= 0; i--) { const u = i / 14; g.lineTo(x + lerp(-r * 1.45, r * 1.45, u) + sw * (1 + u), y + len - (i % 2 ? r * (.25 + .3 * hash(i * 3.3)) : 0) + Math.sin(t * 1.3 + i) * r * .04); }
    g.quadraticCurveTo(x - r * 1.3 + sw, y + len * .5, x - r * 1.05, y - r * .15); g.closePath(); };
  M(); g.fillStyle = lg(x - r, y - r, x + r * .6, y + len, [col[2], col[0], '#010102']); g.fill();
  g.save(); M(); g.clip();
  for (let i = 0; i < 46; i++) { const u = hash(i * 2.7) * 2 - 1; curve([x + u * r * .45, y - r * 1.05], [x + u * r * 1.2, y + r * .3], [x + u * r * 1.45 + sw * (1 + u) + Math.sin(t * .9 + i) * r * .05, y + len], r * (.012 + .02 * hash(i)), i % 3 ? 'rgba(130,140,175,.16)' : 'rgba(0,0,0,.5)'); }
  if (part > 0) { const pw = r * .26 * part; g.beginPath(); g.moveTo(x, y - r * .75); g.quadraticCurveTo(x + pw * 1.2, y - r * .1, x + pw * .2, y + r * .85); g.quadraticCurveTo(x - pw * .9, y - r * .1, x, y - r * .75); g.closePath();
    g.fillStyle = lg(x - pw, 0, x + pw, 0, [LADY.skin[2], LADY.skin[0], LADY.skin[1]]); g.fill();
    ell(x + pw * .15, y - r * .05, pw * .55, r * .11); g.fillStyle = '#060608'; g.fill(); circ(x + pw * .2, y - r * .05, Math.max(1, r * .03), `rgba(235,240,255,${part})`);
    for (let i = 0; i < 6; i++) curve([x + (i - 2.5) * pw * .2, y - r * .8], [x + (i - 2.5) * pw * .3, y], [x + (i - 2.5) * pw * .25, y + r * .9], r * .015, 'rgba(0,0,0,.7)'); }
  g.restore();
  for (let i = 0; i < 14; i++) { const u = hash(i * 9.1) * 2 - 1, ex = x + u * r * 1.5 + sw * 2 + Math.sin(t * 1.1 + i) * r * .08; curve([x + u * r * 1.2, y + len * .7], [ex, y + len * .9], [ex + Math.sin(t + i) * r * .1, y + len + r * (.2 + .4 * hash(i))], r * .02, col[0]); }
}
// standing, seen front or three-quarter (turn -1..1): the white dress, the hair over the face, a raised hand (arm 0..1)
function lady(x, y, h, t, o = {}) {
  const { arm = 0, turn = 0, glowA = .6, part = 0, hover = 1, lift = 0 } = o;
  const by = y - h * .02 * hover - lift, r = h * .058, hx = x + turn * h * .015, hy = by - h * .9, sway = Math.sin(t * .7) * h * .005, sh = by - h * .8, D = LADY.dress;
  if (hover) cshadow(x, y, h * .12, h * .016, .3);
  g.beginPath(); g.ellipse(hx + sway, hy, r * 1.2, r * 1.25, 0, Math.PI, TAU); g.quadraticCurveTo(hx + r * 1.5, hy + h * .2, hx + r * 1.7 + sway, by - h * .42); g.lineTo(hx - r * 1.7 + sway, by - h * .42); g.quadraticCurveTo(hx - r * 1.5, hy + h * .2, hx - r * 1.2, hy); g.closePath(); g.fillStyle = LADY.hair[0]; g.fill();
  rr(hx - r * .32, hy + r * .5, r * .64, r * 1.2, r * .2); g.fillStyle = LADY.skin[2]; g.fill();
  const P = () => { g.beginPath(); g.moveTo(hx - h * .082, sh + h * .016); g.quadraticCurveTo(hx, sh + h * .03, hx + h * .082, sh + h * .016);
    g.bezierCurveTo(x + h * .095, by - h * .66, x + h * .06, by - h * .55, x + h * .065, by - h * .5);
    g.bezierCurveTo(x + h * .09, by - h * .3, x + h * .14, by - h * .12, x + h * .17 + Math.sin(t * 1.1) * h * .01, by);
    for (let k = 12; k >= 0; k--) g.lineTo(x - h * .17 + k * h * .0283, by - (k % 2 ? h * .015 : 0) + Math.sin(t * 2 + k) * h * .006);
    g.bezierCurveTo(x - h * .14, by - h * .12, x - h * .09, by - h * .3, x - h * .065, by - h * .5);
    g.bezierCurveTo(x - h * .06, by - h * .55, x - h * .095, by - h * .66, hx - h * .082, sh + h * .016); g.closePath(); };
  P(); g.fillStyle = lg(x - h * .17, 0, x + h * .17, 0, turn > 0 ? [D[2], D[1], D[0], D[1]] : [D[1], D[0], D[1], D[2]]); g.fill();
  g.save(); P(); g.clip();
  for (let k = 0; k < 13; k++) { const u = k / 12 - .5, x0 = x + u * h * .09, x1 = x + u * h * .3 + Math.sin(t * .9 + k) * h * .008; g.fillStyle = lg(x1 - h * .02, 0, x1 + h * .02, 0, ['rgba(60,70,90,0)', `rgba(60,70,90,${.18 + .1 * hash(k)})`, 'rgba(255,255,255,.1)', 'rgba(60,70,90,0)']);
    g.beginPath(); g.moveTo(x0 - h * .006, by - h * .5); g.quadraticCurveTo((x0 + x1) / 2, by - h * .25, x1 - h * .02, by + h * .02); g.lineTo(x1 + h * .02, by + h * .02); g.quadraticCurveTo((x0 + x1) / 2 + h * .01, by - h * .25, x0 + h * .006, by - h * .5); g.closePath(); g.fill(); }
  for (let k = 0; k < 5; k++) curve([hx - h * .05 + k * h * .025, sh + h * .04], [hx - h * .055 + k * h * .027, by - h * .62], [x - h * .04 + k * h * .02, by - h * .5], h * .003, 'rgba(60,70,90,.25)');
  g.fillStyle = lg(0, by - h * .52, 0, by - h * .48, ['rgba(60,70,90,0)', 'rgba(60,70,90,.25)', 'rgba(60,70,90,0)']); g.fillRect(x - h * .2, by - h * .53, h * .4, h * .06);
  g.fillStyle = lg(0, by - h * .2, 0, by, ['rgba(200,215,240,0)', 'rgba(200,215,240,.35)']); g.fillRect(x - h * .25, by - h * .2, h * .5, h * .25);
  g.restore();
  for (const sg of [-1, 1]) {
    const s0 = [hx + sg * h * .075, sh + h * .03], up = sg > 0 ? arm : 0;
    const e = [lerp(s0[0] + sg * h * .035, s0[0] + sg * h * .11, up), lerp(s0[1] + h * .18, s0[1] - h * .07, up)], hd = [lerp(s0[0] + sg * h * .03, s0[0] + sg * h * .13, up), lerp(s0[1] + h * .35, s0[1] - h * .24, up)];
    limb([s0, e, hd], h * .03, D, -1);
    const dx = hd[0] - e[0], dy = hd[1] - e[1], dd = Math.hypot(dx, dy) || 1, wr = [hd[0] + dx / dd * h * .012, hd[1] + dy / dd * h * .012];
    line([hd, wr], h * .017, LADY.skin[1]);
    g.save(); g.translate(wr[0], wr[1]); g.rotate(Math.atan2(dy, dx)); ell(h * .018, 0, h * .022, h * .014); g.fillStyle = LADY.skin[1]; g.fill();
    for (let f = 0; f < 4; f++) { const fy = (f - 1.5) * h * .006; line([[h * .03, fy], [h * (.06 + .008 * (f === 1 || f === 2)), fy * 1.3]], h * .0055, LADY.skin[f % 2]); } line([[h * .01, sg * h * .01], [h * .035, sg * h * .022]], h * .006, LADY.skin[1]); g.restore();
  }
  ell(hx + sway, hy, r * .82, r); g.fillStyle = rg(hx, hy - r * .3, 0, r, [LADY.skin[0], LADY.skin[1]]); g.fill();
  hairCurtain(hx + sway, hy, r, t, 1.15, part);
  L(x, by - h * .5, h * .75, C.ice, .55 * glowA, .14 * glowA); L(hx, hy, h * .2, C.ice, .5 * glowA, .1 * glowA);
}
// her face, close: pale, hair parted down the middle, one eye in the dark of the hair; open = the eyes open (0..1)
function ladyFace(x, y, r, t, o = {}) {
  const { open = 1, tilt = 0, hide = .5, smile = 0 } = o;
  g.save(); g.translate(x, y); g.rotate(tilt);
  faceReal(0, 0, r, { t, skin: LADY.skin, hair: LADY.hair, female: 1, pale: 1, eyes: open > .5 ? 'dead' : 'shut', lx: 1, smile, hairStyle: 'long' });
  for (const sg of [-1, 1]) for (let i = 0; i < 26; i++) { const u = i / 25, xs = sg * r * (.06 + .15 * u), xe = sg * r * (lerp(.25, 1.0, u) + (1 - hide) * .6 * u) + Math.sin(t * .6 + i) * r * .03;
    curve([xs, -r * 1.02], [sg * r * (.5 + .5 * u), -r * .4], [xe + sg * r * .1, r * (1.9 + .6 * hash(i * 3 + sg))], r * (.025 + .035 * hash(i)), i % 4 ? LADY.hair[0] : LADY.hair[1]); }
  g.restore(); L(x, y, r * 2.4, C.ice, .6, .12);
}
// sitting in the back seat (front view, from the dashboard): only head, shoulders, hair, a white sleeve
function ladySeated(x, y, s, t, o = {}) {
  const { part = 0, a = 1 } = o; if (a <= 0) return; g.save(); g.globalAlpha *= a;
  g.beginPath(); g.moveTo(x - .55 * s, y + .9 * s); g.quadraticCurveTo(x - .5 * s, y + .2 * s, x - .2 * s, y + .1 * s); g.lineTo(x + .2 * s, y + .1 * s); g.quadraticCurveTo(x + .5 * s, y + .2 * s, x + .55 * s, y + .9 * s); g.closePath();
  g.fillStyle = lg(x - .5 * s, 0, x + .5 * s, 0, LADY.dress); g.fill();
  ell(x, y - .2 * s, .2 * s, .24 * s); g.fillStyle = LADY.skin[1]; g.fill();
  hairCurtain(x, y - .2 * s, .22 * s, t, 1.2, part); g.restore();
  L(x, y, 1.2 * s, C.ice, .5 * a, .12 * a);
}

// ---------- the taxi ----------
// side view; (x, y) = the ground under the middle, s = px per metre, dir 1 = nose to the right. door = the rear door open 0..1. inside(clip) = who sits there
function taxiSide(x, y, s, t, o = {}) {
  const { dir = 1, lights = 1, door = 0, inside = null, wheel = 0, sign = 1, old = 0 } = o, body = old ? ['#e8c84a', '#b89a2a', '#6a5614'] : PAL.taxi;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  cshadow(0, 0, 2.5 * s, .14 * s, .7);
  const B = () => { g.beginPath(); g.moveTo(-2.25 * s, -.35 * s); g.quadraticCurveTo(-2.3 * s, -.8 * s, -2.1 * s, -.88 * s); g.lineTo(-1.25 * s, -.95 * s); g.lineTo(-.85 * s, -1.42 * s); g.quadraticCurveTo(-.2 * s, -1.5 * s, .55 * s, -1.42 * s); g.lineTo(1.1 * s, -.98 * s); g.lineTo(2.05 * s, -.86 * s); g.quadraticCurveTo(2.3 * s, -.78 * s, 2.28 * s, -.35 * s); g.lineTo(2.2 * s, -.25 * s); g.lineTo(-2.18 * s, -.25 * s); g.closePath(); };
  B(); g.fillStyle = lg(0, -1.5 * s, 0, -.25 * s, [body[0], body[1], body[2]]); g.fill();
  g.save(); B(); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-2.3 * s, -.9 * s, 4.6 * s, .05 * s); g.fillStyle = old ? '#2a2a2a' : PAL.stripe; g.fillRect(-2.3 * s, -.62 * s, 4.6 * s, .07 * s);
  for (const wx of [-1.45, 1.35]) { circ(wx * s, -.25 * s, .5 * s, 'rgba(0,0,0,.6)'); } g.restore();
  B(); g.strokeStyle = OL; g.lineWidth = .03 * s; g.stroke();
  const WIN = (a, b, c, d) => { g.beginPath(); g.moveTo(a * s, -.98 * s); g.lineTo(b * s, -1.36 * s); g.lineTo(c * s, -1.36 * s); g.lineTo(d * s, -.98 * s); g.closePath(); };
  const wins = [[-1.15, -.82, -.2, -.12], [-.05, -.02, .5, 1.0]];
  for (const w of wins) { WIN(...w); g.fillStyle = '#0a0d16'; g.fill(); }
  if (inside) { g.save(); g.beginPath(); for (const w of wins) { g.moveTo(w[0] * s, -.98 * s); g.lineTo(w[1] * s, -1.36 * s); g.lineTo(w[2] * s, -1.36 * s); g.lineTo(w[3] * s, -.98 * s); g.closePath(); } g.clip(); g.scale(dir, 1); inside(s, dir); g.restore(); }
  for (const w of wins) { WIN(...w); g.save(); g.clip(); g.fillStyle = lg(w[0] * s, -1.36 * s, w[3] * s, -.98 * s, ['rgba(160,180,230,.0)', 'rgba(160,180,230,.18)', 'rgba(160,180,230,0)']); g.fillRect(-3 * s, -2 * s, 6 * s, 2 * s); g.restore(); WIN(...w); g.strokeStyle = '#121218'; g.lineWidth = .05 * s; g.stroke(); }
  line([[-.12 * s, -.96 * s], [-.08 * s, -.3 * s]], .015 * s, 'rgba(0,0,0,.6)'); line([[1.05 * s, -.96 * s], [1.08 * s, -.3 * s]], .015 * s, 'rgba(0,0,0,.6)'); line([[-1.18 * s, -.95 * s], [-1.2 * s, -.3 * s]], .015 * s, 'rgba(0,0,0,.6)');
  rr(-.85 * s, -.78 * s, .22 * s, .05 * s, .02 * s); fs('#888', .01 * s); rr(.3 * s, -.78 * s, .22 * s, .05 * s, .02 * s); fs('#888', .01 * s);
  line([[-2.15 * s, -.42 * s], [2.2 * s, -.42 * s]], .025 * s, 'rgba(220,225,235,.55)');
  for (const wx of [-1.45, 1.35]) { g.beginPath(); g.arc(wx * s, -.3 * s, .44 * s, Math.PI, TAU); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = .05 * s; g.stroke(); }
  path([[1.0 * s, -.98 * s], [1.18 * s, -1.08 * s], [1.22 * s, -.98 * s]]); g.closePath(); g.fillStyle = '#16161a'; g.fill(); rr(1.1 * s, -1.13 * s, .16 * s, .1 * s, .03 * s); fs('#1c1c22', .01 * s);
  line([[-1.9 * s, -.9 * s], [-2.05 * s, -1.7 * s]], .012 * s, '#1a1a1e');
  rr(-1.75 * s, -.78 * s, .16 * s, .12 * s, .04 * s); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .01 * s; g.stroke();
  g.save(); g.translate(-.2 * s, -.52 * s); g.scale(dir, 1); text(old ? 'MANILA' : 'BALETE TAXI', 0, 0, .1 * s, old ? '#2a2a2a' : '#1c3c7a', 'Anton'); g.restore();
  if (door > 0) { const k = Math.cos(door * 1.1); g.save(); g.translate(-1.2 * s, 0);
    g.fillStyle = '#05060a'; g.fillRect(0, -1.36 * s, 1.1 * s, 1.06 * s);
    g.beginPath(); g.moveTo(0, -.3 * s); g.lineTo(0, -.98 * s); g.lineTo(.35 * s * k, -1.36 * s - door * .1 * s); g.lineTo(1.08 * s * k, -1.36 * s - door * .12 * s); g.lineTo(1.08 * s * k, -.3 * s + door * .1 * s); g.closePath();
    g.fillStyle = lg(0, 0, 1.1 * s * k, 0, [body[1], body[0]]); g.fill(); g.strokeStyle = OL; g.lineWidth = .03 * s; g.stroke(); g.restore(); }
  if (sign) { rr(-.45 * s, -1.68 * s, .8 * s, .24 * s, .05 * s); fs(lights ? '#ffcf6a' : '#8a7a5a', .02 * s); g.save(); g.translate(-.05 * s, -1.56 * s); g.scale(dir, 1); text('TAXI', 0, 0, .17 * s, '#2a1a08', 'Anton'); g.restore(); if (lights) { L(-.05 * s, -1.56 * s, 1.4 * s, C.amb, .8 * lights, .3 * lights); F(-.05 * s, -1.56 * s, .8 * s, C.amb, .3 * lights); } }
  for (const wx of [-1.45, 1.35]) { g.save(); g.translate(wx * s, -.3 * s); circ(0, 0, .36 * s, '#0b0b0e'); circ(0, 0, .2 * s, '#8a8c94'); g.rotate(wheel); for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); line([[0, 0], [.16 * s, 0]], .035 * s, '#4a4c54'); } circ(0, 0, .06 * s, '#2a2c34'); g.restore(); }
  rr(2.08 * s, -.75 * s, .18 * s, .12 * s, .03 * s); fs(lights ? '#fff6dc' : '#aaa', .01 * s); rr(-2.28 * s, -.74 * s, .12 * s, .14 * s, .03 * s); fs(lights ? '#ff3a3a' : '#5a1a1a', .01 * s);
  if (lights) { L(2.2 * s, -.69 * s, 1.8 * s, C.warm, .95 * lights, .4 * lights); F(2.2 * s, -.69 * s, 1.6 * s, C.warm, .5 * lights);
    beam([[2.2 * s, -.78 * s], [9 * s, -1.5 * s], [9 * s, .6 * s], [2.2 * s, -.6 * s]], 2.2 * s, 0, 9 * s, 0, C.warm, .22 * lights); L(4.5 * s, -.3 * s, 3 * s, C.warm, .7 * lights, 0);
    L(-2.25 * s, -.67 * s, 1.1 * s, C.red, .9 * lights, .45 * lights); }
  g.restore();
}
// front view, coming at you; (x, y) = the ground, s = px per metre
function taxiFront(x, y, s, t, o = {}) {
  const { lights = 1, inside = null } = o;
  g.save(); g.translate(x, y); cshadow(0, 0, 1.2 * s, .12 * s, .7);
  for (const sg of [-1, 1]) { rr(sg * .78 * s - .17 * s, -.42 * s, .34 * s, .42 * s, .06 * s); fs('#0b0b0e', .02 * s); }
  const B = () => { g.beginPath(); g.moveTo(-.95 * s, -.3 * s); g.lineTo(-.98 * s, -.82 * s); g.lineTo(-.72 * s, -.95 * s); g.lineTo(-.6 * s, -1.4 * s); g.lineTo(.6 * s, -1.4 * s); g.lineTo(.72 * s, -.95 * s); g.lineTo(.98 * s, -.82 * s); g.lineTo(.95 * s, -.3 * s); g.closePath(); };
  B(); g.fillStyle = lg(-s, 0, s, 0, [PAL.taxi[1], PAL.taxi[0], PAL.taxi[2]]); g.fill(); B(); g.strokeStyle = OL; g.lineWidth = .025 * s; g.stroke();
  g.beginPath(); g.moveTo(-.66 * s, -.98 * s); g.lineTo(-.54 * s, -1.34 * s); g.lineTo(.54 * s, -1.34 * s); g.lineTo(.66 * s, -.98 * s); g.closePath(); g.fillStyle = '#0a0d16'; g.fill();
  if (inside) { g.save(); g.clip(); inside(s); g.restore(); }
  g.save(); g.clip(); g.fillStyle = lg(-.6 * s, -1.34 * s, .6 * s, -.98 * s, ['rgba(170,190,240,0)', 'rgba(170,190,240,.2)', 'rgba(170,190,240,0)']); g.fillRect(-s, -1.5 * s, 2 * s, .6 * s); g.restore();
  rr(-.42 * s, -.62 * s, .84 * s, .16 * s, .04 * s); fs('#1a1a20', .015 * s); for (let k = 0; k < 6; k++) line([[-.38 * s + k * .15 * s, -.6 * s], [-.38 * s + k * .15 * s, -.48 * s]], .01 * s, '#3a3a44');
  g.fillStyle = PAL.stripe; g.fillRect(-.97 * s, -.42 * s, 1.94 * s, .05 * s);
  rr(-.3 * s, -1.62 * s, .6 * s, .22 * s, .04 * s); fs(lights ? '#ffcf6a' : '#8a7a5a', .015 * s); text('TAXI', 0, -1.51 * s, .15 * s, '#2a1a08', 'Anton');
  rr(-.3 * s, -.3 * s, .6 * s, .14 * s, .02 * s); fs('#f2efe6', .01 * s); text('TXP 1987', 0, -.23 * s, .09 * s, '#1a1a22', 'Anton');
  for (const sg of [-1, 1]) { const lx = sg * .72 * s, ly = -.62 * s; ell(lx, ly, .15 * s, .09 * s); fs(lights ? '#fffbe8' : '#888', .015 * s);
    if (lights) { glow(lx, ly, .5 * s, C.warm, .8 * lights); L(lx, ly, 1.2 * s, C.warm, lights, .45 * lights); F(lx, ly, 2.6 * s, C.warm, .7 * lights); } }
  if (lights) L(0, -1.51 * s, .9 * s, C.amb, .7 * lights, .25 * lights);
  g.restore();
}
// a rear-view mirror (x, y = its centre, w x h, roll ang); refl() paints what it shows (clipped), then the glass sheen and the frame
function mirror(x, y, w, h, ang, refl, t, o = {}) {
  const { rosary_ = 1 } = o;
  g.save(); g.translate(x, y); g.rotate(ang);
  line([[0, -h * .5], [0, -h * 1.4]], w * .05, '#0e0e12');
  rr(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, h * .5); fs('#121216', 4);
  g.save(); rr(-w / 2, -h / 2, w, h, h * .45); g.clip(); g.fillStyle = '#05060a'; g.fillRect(-w / 2, -h / 2, w, h); g.scale(-1, 1); refl(w, h); g.restore();
  g.save(); rr(-w / 2, -h / 2, w, h, h * .45); g.clip(); g.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, ['rgba(200,215,255,.0)', 'rgba(200,215,255,.12)', 'rgba(200,215,255,0)', 'rgba(200,215,255,.06)']); g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  rr(-w / 2, -h / 2, w, h, h * .45); g.strokeStyle = '#2a2a32'; g.lineWidth = 6; g.stroke();
  g.restore();
  if (rosary_) { const sw = Math.sin(t * 1.3) * .18 + Math.sin(t * .7) * .06, len = h * 1.9; g.save(); g.translate(x - w * .18, y + h * .45); g.rotate(sw);
    for (let k = 0; k < 22; k++) { const u = k / 21, bx = Math.sin(u * Math.PI) * w * .07, by = u * len; circ(bx, by, w * .011, '#d8cfc0'); circ(-bx, by, w * .011, '#d8cfc0'); }
    line([[0, len], [0, len + h * .45]], w * .01, '#d8cfc0'); line([[-w * .03, len + h * .22], [w * .03, len + h * .22]], w * .01, '#d8cfc0'); g.restore(); }
}
// the back seat, from the front: a bench, two headrests; sag = a dent where someone sits (0..1), at u (0..1 across)
function backSeat(x0, y0, w, h, o = {}) {
  const { sag = 0, u = .7, belt = 0, t = 0 } = o;
  g.fillStyle = lg(0, y0, 0, y0 + h, PAL.seat); g.fillRect(x0, y0, w, h);
  for (let k = 0; k < 6; k++) line([[x0 + w * (k + .5) / 6, y0 + h * .1], [x0 + w * (k + .5) / 6, y0 + h * .62]], 3, 'rgba(0,0,0,.35)');
  rr(x0 - 20, y0 + h * .6, w + 40, h * .45, 30); fs(lg(0, y0 + h * .6, 0, y0 + h, [PAL.seat[0], PAL.seat[2]]), 4);
  for (const hu of [.2, .8]) { rr(x0 + w * hu - w * .1, y0 - h * .28, w * .2, h * .3, 30); fs(lg(0, y0 - h * .28, 0, y0, [PAL.seat[0], PAL.seat[1]]), 4); line([[x0 + w * hu - w * .04, y0], [x0 + w * hu - w * .04, y0 + h * .05]], 6, '#888'); line([[x0 + w * hu + w * .04, y0], [x0 + w * hu + w * .04, y0 + h * .05]], 6, '#888'); }
  if (sag > 0) { const cx = x0 + w * u, cy = y0 + h * .72; g.fillStyle = rg(cx, cy, 0, w * .2, [`rgba(0,0,0,${.6 * sag})`, 'rgba(0,0,0,0)']); g.save(); g.translate(cx, cy); g.scale(1, .35); g.translate(-cx, -cy); g.fillRect(cx - w * .2, cy - w * .2, w * .4, w * .4); g.restore();
    for (let k = 0; k < 5; k++) curve([cx - w * .16 + k * w * .08, cy - h * .08], [cx - w * .12 + k * w * .06, cy + h * .02 * sag], [cx - w * .1 + k * w * .05, cy + h * .12], 2, `rgba(255,220,200,${.12 * sag})`);
    g.fillStyle = rg(cx, y0 + h * .35, 0, w * .16, [`rgba(0,0,0,${.4 * sag})`, 'rgba(0,0,0,0)']); g.fillRect(cx - w * .2, y0, w * .4, h * .6); }
  if (belt) { const sw = Math.sin(t * 2.2) * 12 * belt; line([[x0 + w * .95, y0 - h * .1], [x0 + w * .78 + sw, y0 + h * .5], [x0 + w * .6 + sw * .5, y0 + h * .75]], 16, '#16161a'); }
}
function meter(x, y, s, t, txt = '40.00') {        // the taxi meter, red digits
  rr(x - 1.1 * s, y - .4 * s, 2.2 * s, .8 * s, .1 * s); fs('#16161a', .04 * s); rr(x - .95 * s, y - .25 * s, 1.9 * s, .5 * s, .05 * s); fs('#1c0606', .02 * s);
  g.save(); g.shadowColor = 'rgba(255,40,40,.9)'; g.shadowBlur = .3 * s; text(txt, x, y + .02 * s, .42 * s, '#ff4038', 'Anton'); g.restore(); L(x, y, 2.4 * s, C.red, .9, .35); F(x, y, 1.2 * s, C.red, .2);
}

// ---------- the balete ----------
// a huge strangler fig: a trunk of braided strands, buttress roots, wide limbs, curtains of hanging aerial roots, dark leaf masses
function balete(x, y, s, t, o = {}) {
  const { col = ['#4a4038', '#2a241e', '#120e0a'], roots = 1, leaves = 1, lit = 0 } = o;
  if (leaves) for (let i = 0; i < 70; i++) { const a = hash(i * 2.7) * Math.PI, rr_ = s * (2.2 + 2.2 * hash(i * 5.1)), lx = x + Math.cos(a) * rr_ * 1.6 * (hash(i) > .5 ? 1 : -1), ly = y - s * 5.2 - Math.sin(a) * rr_ * .7, R = s * (.7 + .9 * hash(i * 3.3));
    g.fillStyle = rg(lx - R * .3, ly - R * .4, R * .1, R, [i % 5 ? '#1c2a1e' : '#2c3e2c', '#101a12', 'rgba(8,12,9,0)']); g.beginPath(); g.arc(lx + Math.sin(t * .4 + i) * s * .03, ly, R, 0, TAU); g.fill(); }
  for (const [sg, ang, len, yy] of [[-1, .55, 4.2, 4.0], [1, .5, 4.6, 3.7], [-1, .25, 3.0, 5.0], [1, .2, 3.4, 5.3], [-1, .9, 2.4, 3.2], [1, .95, 2.6, 2.9]]) {
    const sx = x + sg * s * .4, sy = y - s * yy, ex = sx + sg * Math.cos(ang) * len * s, ey = sy - Math.sin(ang) * len * s * .8;
    curve([sx, sy], [(sx + ex) / 2, sy - s * .8], [ex, ey], s * .42 * (1.2 - yy * .12), col[2]); curve([sx, sy - s * .08], [(sx + ex) / 2, sy - s * .88], [ex, ey], s * .18, col[1]);
    if (roots) for (let k = 0; k < 26; k++) { const u = .15 + .85 * hash(k * 1.3 + yy), px = lerp(sx, ex, u), py = lerp(sy, ey, u) - Math.sin(u * Math.PI) * s * .5, Lr = s * (2.2 + 3.6 * hash(k * 7.7 + sg)), sw_ = Math.sin(t * .5 + k + yy) * s * .08;
      curve([px, py], [px + sw_ * .5, py + Lr * .5], [px + sw_, py + Lr], s * (.025 + .03 * hash(k)), k % 3 ? col[2] : col[1]); }
  }
  for (let k = 0; k < 22; k++) { const u = k / 21 - .5, bx = x + u * s * 2.6, w = s * (.14 + .12 * hash(k * 3.1));
    const pts = []; for (let j = 0; j <= 10; j++) { const v = j / 10; pts.push([lerp(bx + u * s * 1.6 * (1 - v) ** 3, x + u * s * .9 + Math.sin(v * 7 + k) * s * .12, v), y - v * s * 5.6]); }
    line(pts, w + s * .05, '#060504'); line(pts, w, k % 2 ? col[1] : col[0]); g.save(); g.translate(-w * .25, 0); line(pts, w * .3, `rgba(200,190,170,${.12 + .1 * hash(k)})`); g.restore(); }
  for (let k = 0; k < 9; k++) { const sg = k % 2 ? 1 : -1, len = s * (1.4 + 1.6 * hash(k * 4.4)); curve([x + sg * s * .5, y - s * .9], [x + sg * (s * .8 + len * .4), y - s * .2], [x + sg * (s * .7 + len), y + s * .05], s * .22, col[1]); }
  if (lit) { L(x, y - s * 2, s * 4, C.warm, .6 * lit, .05 * lit); }
}
// a sodium street lamp: a pole, an arm, an orange head, a cone of light the rain falls through
function streetLamp(x, y, h, t, o = {}) {
  const { on = 1, side = 1 } = o, hx = x + side * h * .32, hy = y - h * .96;
  line([[x, y], [x, y - h]], h * .025, '#141418'); curve([x, y - h], [x + side * h * .05, y - h * 1.04], [hx, hy], h * .016, '#141418');
  rr(hx - h * .06, hy - h * .015, h * .12, h * .035, h * .012); fs('#202024', 2);
  if (on > 0) { ell(hx, hy + h * .02, h * .045, h * .012); g.fillStyle = '#ffd08a'; g.fill(); glow(hx, hy + h * .02, h * .12, C.sodium, .7 * on); L(hx, hy + h * .3, h * .75, C.sodium, .95 * on, .3 * on); F(hx, hy + h * .02, h * .4, C.sodium, .35 * on);
    beam([[hx - h * .04, hy + h * .02], [hx + h * .04, hy + h * .02], [hx + h * .32, y], [hx - h * .32, y]], hx, hy, hx, y, C.sodium, .2 * on); }
}
// a green street sign on a post
function streetSign(x, y, h, txt) { line([[x, y], [x, y - h]], h * .03, '#2a2e34'); rr(x - h * .42, y - h * 1.05, h * .84, h * .2, h * .02); fs('#1f6a3a', h * .01); rr(x - h * .4, y - h * 1.04, h * .8, h * .18, h * .015); g.strokeStyle = '#e8f0e8'; g.lineWidth = h * .008; g.stroke(); text(txt, x, y - h * .95, h * .12, '#f2f6f2', 'Anton'); }

TEX.asphalt = paint(mk(512, 512), (w, h) => { g.fillStyle = '#26272e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { const v = hash(i * 1.13); g.fillStyle = v > .7 ? 'rgba(200,205,220,.12)' : v > .35 ? 'rgba(0,0,0,.25)' : 'rgba(120,125,140,.1)'; g.fillRect(hash(i * 2.31) * w, hash(i * 3.77) * h, 1 + 2 * hash(i * 5.1), 1 + 2 * hash(i * 6.3)); }
  for (let i = 0; i < 14; i++) { const x = hash(i * 9.1) * w, y = hash(i * 4.7) * h, R = 30 + 60 * hash(i); g.fillStyle = rg(x, y, 0, R, ['rgba(120,140,190,.12)', 'rgba(120,140,190,0)']); g.save(); g.translate(x, y); g.scale(1.8, .5); g.translate(-x, -y); g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore(); }
  for (let i = 0; i < 6; i++) { let x = hash(i * 7.7) * w, y = hash(i * 8.8) * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (hash(i * 13 + k) - .5) * 40; y += 10 + 20 * hash(i + k); g.lineTo(x, y); } g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.stroke(); } });
function asphalt(fn, a = .9) { g.save(); fn(); g.clip(); g.globalAlpha = a; g.fillStyle = pat(TEX.asphalt); g.fillRect(-3000, -3000, 7000, 8000); g.restore(); }
// ---------- the old house on Balete Drive (bahay na bato) ----------
TEX.adobe = paint(mk(400, 300), (w, h) => { g.fillStyle = '#6a5e50'; g.fillRect(0, 0, w, h);
  for (let r = 0, y = 0; y < h; y += 50, r++) for (let x = (r % 2) * -50; x < w; x += 100) { const v = hash(x * 1.3 + y * 2.1); rr(x + 3, y + 3, 94, 44, 6); g.fillStyle = `rgb(${110 + 30 * v},${98 + 26 * v},${80 + 20 * v})`; g.fill(); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,240,220' : '0,0,0'},.07)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
  for (let i = 0; i < 12; i++) { const x = hash(i * 7) * w; g.fillStyle = lg(0, 0, 0, h, ['rgba(20,40,20,.0)', 'rgba(20,40,20,.35)']); g.fillRect(x, 0, 20 + 30 * hash(i), h); } });
TEX.capiz = paint(mk(120, 120), (w, h) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, w, h); for (let k = 0; k <= 4; k++) { g.fillStyle = '#3a2614'; g.fillRect(k * 30 - 2, 0, 4, h); g.fillRect(0, k * 30 - 2, w, 4); }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = `rgba(255,250,230,${.1 + .2 * hash(r * 4 + c)})`; g.fillRect(c * 30 + 4, r * 30 + 4, 22, 22); } });
TEX.wood = paint(mk(300, 300), (w, h) => { g.fillStyle = '#4a3020'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 25) { g.fillStyle = `rgba(0,0,0,${.25 + .2 * hash(x)})`; g.fillRect(x, 0, 3, h); for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,220,180,.06)'; g.fillRect(x + 6 + k * 4, 0, 1, h); } } });
function bahay(x, y, s, t, o = {}) {      // (x, y) = ground under its middle, s = px per metre
  const { day = 0, glowWin = -1 } = o, w = 11 * s, x0 = x - w / 2;
  g.save(); g.translate(x0, y - 3.2 * s); g.fillStyle = pat(TEX.adobe); g.fillRect(0, 0, w, 3.2 * s); g.restore();
  for (const u of [.12, .5, .88]) { rr(x0 + u * w - .7 * s, y - 2.6 * s, 1.4 * s, 2.6 * s, [.7 * s, .7 * s, 0, 0]); fs('#0c0a08', .04 * s); }
  g.fillStyle = '#2a1a0e'; g.fillRect(x0 - .5 * s, y - 3.4 * s, w + s, .3 * s);
  g.save(); g.translate(x0 - .5 * s, y - 6.6 * s); g.fillStyle = pat(TEX.wood); g.fillRect(0, 0, w + s, 3.2 * s); g.restore();
  for (let k = 0; k < 5; k++) { const wx = x0 + (.2 + k * 2.15) * s, wy = y - 6.1 * s; rr(wx, wy, 1.7 * s, 1.8 * s, .05 * s); fs('#1a1008', .05 * s);
    g.save(); g.translate(wx + .1 * s, wy + .1 * s); g.fillStyle = pat(TEX.capiz); g.fillRect(0, 0, 1.5 * s, 1.6 * s); g.restore();
    g.fillStyle = k === glowWin ? 'rgba(255,190,110,.0)' : `rgba(8,8,14,${day ? .35 : .82})`; g.fillRect(wx + .1 * s, wy + .1 * s, 1.5 * s, 1.6 * s);
    if (k === glowWin) L(wx + .85 * s, wy + .9 * s, 2 * s, C.candle, .7, .3);
    for (let j = 0; j < 6; j++) line([[wx + .15 * s + j * .28 * s, wy + 1.95 * s], [wx + .15 * s + j * .28 * s, wy + 2.55 * s]], .06 * s, '#2a1a0e'); g.strokeStyle = '#2a1a0e'; g.lineWidth = .06 * s; g.strokeRect(wx, wy + 1.9 * s, 1.7 * s, .7 * s); }
  path([[x0 - 1.4 * s, y - 6.5 * s], [x0 + 1.5 * s, y - 9.2 * s], [x0 + w - 1.5 * s, y - 9.2 * s], [x0 + w + 1.4 * s, y - 6.5 * s]]); g.closePath(); g.fillStyle = lg(0, y - 9.2 * s, 0, y - 6.5 * s, ['#3a2420', '#5a3428']); g.fill(); g.strokeStyle = OL; g.lineWidth = .06 * s; g.stroke();
  for (let k = 0; k < 9; k++) { const v = k / 9; line([[lerp(x0 - 1.4 * s, x0 + 1.5 * s, v), lerp(y - 6.5 * s, y - 9.2 * s, v)], [lerp(x0 + w + 1.4 * s, x0 + w - 1.5 * s, v), lerp(y - 6.5 * s, y - 9.2 * s, v)]], .04 * s, 'rgba(0,0,0,.35)'); }
  for (let k = 0; k < 40; k++) { const v = hash(k * 2.2), sx = lerp(x0 - 1.2 * s, x0 + w + 1.2 * s, v); line([[sx, y - 6.6 * s], [sx + (hash(k) - .5) * .2 * s, y - 6.6 * s + .3 * s + 1.2 * s * hash(k * 3)]], .02 * s, '#1e2a1a'); }
}
function gate(x, y, s, t, o = {}) {     // stone posts and an iron gate; open = 0..1
  const { open = 0 } = o;
  for (const sg of [-1, 1]) { const px = x + sg * 2.1 * s; g.save(); g.translate(px - .35 * s, y - 2.6 * s); g.fillStyle = pat(TEX.adobe); g.fillRect(0, 0, .7 * s, 2.6 * s); g.restore(); rr(px - .45 * s, y - 2.8 * s, .9 * s, .25 * s, .05 * s); fs('#4a4238', .03 * s); circ(px, y - 2.95 * s, .18 * s, '#5a5246'); }
  for (const sg of [-1, 1]) { const k = 1 - open * .75, gx0 = x + sg * .05 * s, gx1 = x + sg * 1.75 * s * k;
    for (let j = 0; j <= 10; j++) { const bx = lerp(gx0, gx1, j / 10); line([[bx, y - .1 * s], [bx, y - 2.1 * s - Math.sin(j / 10 * Math.PI) * .3 * s]], .05 * s, '#121214'); circ(bx, y - 2.2 * s - Math.sin(j / 10 * Math.PI) * .3 * s, .06 * s, '#121214'); }
    for (const yy of [.4, 1.2, 1.9]) line([[gx0, y - yy * s], [gx1, y - yy * s]], .06 * s, '#121214'); }
}

// ---------- small things ----------
function sampaguita(x, y, s, t, o = {}) {        // a garland of jasmine: little white star flowers on a string
  const { n = 26, wet = 0 } = o;
  for (let k = 0; k < n; k++) { const a = k / n * TAU, fx = x + Math.cos(a) * s, fy = y + Math.sin(a) * s * .45;
    g.save(); g.translate(fx, fy); g.rotate(k); for (let p = 0; p < 5; p++) { g.rotate(TAU / 5); ell(s * .055, 0, s * .06, s * .03); g.fillStyle = '#f6f2e6'; g.fill(); } circ(0, 0, s * .025, '#e8d890'); g.restore(); }
  L(x, y, s * 2.2, C.white, .5, .12);
}
function candle(x, y, s, t, k = 1) {
  rr(x - .12 * s, y - s, .24 * s, s, .04 * s); fs(lg(x - .12 * s, 0, x + .12 * s, 0, ['#f4ead2', '#d8c8a4', '#a8987a']), .02 * s);
  for (let j = 0; j < 3; j++) curve([x - .1 * s + j * .1 * s, y - s], [x - .11 * s + j * .1 * s, y - s * .8], [x - .1 * s + j * .1 * s, y - s * (.6 - .2 * hash(j))], .03 * s, '#efe4c8');
  const f = flick(t + x), fh = .32 * s * f * k; g.beginPath(); g.moveTo(x, y - s - fh); g.quadraticCurveTo(x + .1 * s, y - s - fh * .3, x, y - s + .02 * s); g.quadraticCurveTo(x - .1 * s, y - s - fh * .3, x, y - s - fh); g.fillStyle = '#ffe2a0'; g.fill();
  glow(x, y - s - fh * .4, .5 * s, C.candle, .6 * k); L(x, y - s - .1 * s, 4 * s * f, C.candle, .9 * k, .3 * k);
}
function smoke(x, y, s, t, a = .3) {      // curls of candle smoke rising
  for (let i = 0; i < 14; i++) { const p = ((t * .18 + i / 14) % 1), sx = x + Math.sin(p * 6 + i) * s * .3 * p + Math.sin(t * .5 + i) * s * .05, sy = y - p * s * 3; circ(sx, sy, s * (.06 + .22 * p), `rgba(210,215,225,${a * Math.sin(Math.PI * p) * .5})`); }
}
function mistBand(t, y0, a = .2, c = '150,170,210') {
  reset(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { const x = ((hash(i * 3.1) * 1600 + t * (14 + 10 * hash(i))) % 1900) - 400, y = y0 + (hash(i * 5.7) - .3) * 260, w = 500 + 400 * hash(i);
    g.fillStyle = rg(x, y, 0, w, [`rgba(${c},${a * (.5 + .5 * hash(i + 2))})`, `rgba(${c},0)`]); g.save(); g.translate(x, y); g.scale(1, .22); g.translate(-x, -y); g.fillRect(x - w, y - w, 2 * w, 2 * w); g.restore(); }
  reset();
}
function nightSky(t, o = {}) {      // heavy rain clouds lit faintly from the city below
  grad(o.top || '#05070f', o.bot || '#1a1e30', -600, 1800);
  for (let i = 0; i < 14; i++) { const x = ((hash(i * 4.1) * 1800 + t * 8 * (1 + hash(i))) % 2200) - 500, y = hash(i * 2.3) * 900 - 200, R = 300 + 300 * hash(i * 7);
    g.fillStyle = rg(x, y, 0, R, [`rgba(60,64,90,${.25 + .2 * hash(i)})`, 'rgba(60,64,90,0)']); g.save(); g.translate(x, y); g.scale(1, .45); g.translate(-x, -y); g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore(); }
}
