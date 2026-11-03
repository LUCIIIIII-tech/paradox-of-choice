// rig.js: feature-animation 2D characters on a 2.5D rig, so a director can put the camera anywhere.
// Each head is a stylised 3D form (a cranium and a tapering jaw). Its outline is the projected silhouette; brows, eyes, mouth, ears are
// drawn flat in the head's own surface frame, so they foreshorten and turn away correctly at three-quarter, profile, low and high angles.
// The look is lit, not flat: a soft terminator, a darker core shadow, occlusion under the brows, nose and lip, warm blood where skin is
// thin, a cool rim light on the far edge, warm bounce under the jaw, thin coloured line art, a painted grain.
import { clamp, lerp, ss, hash, TAU } from './lib.js';
export const W = 1080, H = 1920;
export let g = null; export const initG = c => { g = c; };

// ---------- 2D camera ----------
let CAM = [1, 0, 0, 1, 0, 0];
export const getCam = () => CAM.slice();
export const mulM = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
export function camera(cx, cy, z = 1, rot = 0, fx = W / 2, fy = H / 2) { const c = Math.cos(rot) * z, s = Math.sin(rot) * z; CAM = [c, s, -s, c, fx - (c * cx - s * cy), fy - (s * cx + c * cy)]; useCam(); }
export const camZoom = () => Math.hypot(CAM[0], CAM[1]);
export const useCam = () => g.setTransform(CAM[0], CAM[1], CAM[2], CAM[3], CAM[4], CAM[5]);
const useM = m => g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

// ---------- small drawing helpers (world coordinates) ----------
export const rgba = (c, a) => `rgba(${c},${a})`;
export function smooth(pts, closed = true) {        // a smooth path through points (quadratics through the midpoints)
  const p = new Path2D(), n = pts.length; if (n < 2) return p;
  if (!closed) { p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } p.lineTo(pts[n - 1][0], pts[n - 1][1]); return p; }
  const m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2]; p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  p.closePath(); return p;
}
export function hull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 3) return P;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
// thin the hull so the smoothing has room to round it (drop points closer than d)
const thin = (P, d) => { const o = []; for (const p of P) if (!o.length || Math.hypot(p[0] - o[o.length - 1][0], p[1] - o[o.length - 1][1]) > d) o.push(p); return o; };
export function softFill(path, col, blurPx) { g.save(); if (blurPx > .5) g.filter = `blur(${(blurPx * camZoom()).toFixed(1)}px)`; g.fillStyle = col; g.fill(path); g.restore(); }
export function glowAt(x, y, r, c, a) { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(.45, rgba(c, a * .35)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); }
export function blob(x, y, rx, ry, rot, c, a, mode = 'source-over') { if (a <= 0 || rx <= 0 || ry <= 0) return; g.save(); g.globalCompositeOperation = mode; g.translate(x, y); g.rotate(rot); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(.5, rgba(c, a * .45)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
export function taper(pts, w0, w1, col, a = 1) {   // a tapered stroke along points (brows, locks, lashes, folds)
  const L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)]; let dx = q[0] - o[0], dy = q[1] - o[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = lerp(w0, w1, i / (n - 1)) / 2; L.push([p[0] - dy * w, p[1] + dx * w]); R.push([p[0] + dy * w, p[1] - dx * w]); }
  const P = new Path2D(); P.moveTo(...L[0]); for (const p of L.slice(1)) P.lineTo(...p); for (const p of R.reverse()) P.lineTo(...p); P.closePath(); g.save(); g.globalAlpha *= a; g.fillStyle = col; g.fill(P); g.restore(); return P;
}
export const bez = (a, c, b, n = 12) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 9000; i++) { x.fillStyle = hash(i * 1.7) > .5 ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'; x.fillRect(hash(i * 2.3) * 256, hash(i * 3.1) * 256, 1 + 2 * hash(i), 1 + 2 * hash(i * 5)); } return c; })();
let GP = null; const grainPat = () => GP || (GP = g.createPattern(GRAIN, 'repeat'));

// ---------- 3D ----------
const mul3 = (A, B) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return o; };
export function rotMat(yaw = 0, pitch = 0, roll = 0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  return mul3([cr, -sr, 0, sr, cr, 0, 0, 0, 1], mul3([1, 0, 0, 0, cp, -sp, 0, sp, cp], [cy, 0, sy, 0, 1, 0, -sy, 0, cy]));
}
export const rot = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// a view of one rigid part: where it sits (x, y in world px), its size R (px per unit), its rotation
export const view = (x, y, R, yaw = 0, pitch = 0, roll = 0, persp = .07) => ({ x, y, R, M: rotMat(yaw, pitch, roll), persp });
export const proj = (V, p) => { const q = rot(V.M, p), k = 1 + q[2] * V.persp; return [V.x + q[0] * V.R * k, V.y - q[1] * V.R * k, q[2]]; };
// the frame of a surface point: local x along a, local y (down) along b, in world px per unit; composed with the camera for drawing
export function frameAt(V, p, ta, tb) { const o = proj(V, p), a = proj(V, [p[0] + ta[0] * .01, p[1] + ta[1] * .01, p[2] + ta[2] * .01]), b = proj(V, [p[0] + tb[0] * .01, p[1] + tb[1] * .01, p[2] + tb[2] * .01]);
  return [(a[0] - o[0]) * 100, (a[1] - o[1]) * 100, (b[0] - o[0]) * 100, (b[1] - o[1]) * 100, o[0], o[1]]; }
export const inFrame = L => useM(mulM(CAM, L));

// ---------- the head form ----------
// phi: around (0 = front, + toward the character's left = screen right when facing us), th: from the crown (0) to under the chin (pi)
function surf(D, phi, th, d = 1) {
  let y = Math.cos(th), ring = Math.sin(th), x = ring * Math.sin(phi), z = ring * Math.cos(phi);
  if (y < 0) { const k = Math.pow(-y, 1.35); x *= lerp(1, D.jaw, k); z *= lerp(1, .84, k); y *= D.chin; z += D.chinOut * k * Math.max(0, Math.cos(phi)); }
  else z *= lerp(1, .95, y);
  if (y < .1 && y > -.8) { const c = Math.exp(-(((y + .32) / .26) ** 2)); x *= 1 + D.cheek * c; }      // cheeks
  return [x * D.headW * d, y * d, z * d];
}
function surfN(D, phi, th) { const p = surf(D, phi, th), a = surf(D, phi + .01, th), b = surf(D, phi, th + .01);
  const u = [a[0] - p[0], a[1] - p[1], a[2] - p[2]], v = [b[0] - p[0], b[1] - p[1], b[2] - p[2]]; return { p, n: norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]].map(x => -x)), u: norm(u), v: norm(v) }; }
const GRID = []; for (let i = 0; i < 40; i++) for (let j = 0; j <= 26; j++) GRID.push([-Math.PI + i / 40 * TAU, j / 26 * Math.PI]);
// project a region of the surface: the points, their view-space normals
function cloud(D, V, test, d = 1, extra = null) {
  const out = []; for (const [ph, th] of GRID) { if (!test(ph, th)) continue; const s = surfN(D, ph, th), k = d + (extra ? extra(ph, th) : 0), p = [s.p[0] * k, s.p[1] * k, s.p[2] * k];
    const n = rot(V.M, s.n); out.push({ p2: proj(V, p), n, ph, th }); } return out;
}
const pathOfCloud = (pts, R) => smooth(thin(hull(pts.map(q => [q.p2[0], q.p2[1]])), R * .05));
// a region's soft light: a terminator from the key light, a darker core, clipped to `clipP`
function lightRegion(pts, clipP, L, shadowC, coreC, R, soft = .07) {
  const sh = pts.filter(q => q.n[2] > -.25 && dot3(q.n, L) < .05).map(q => [q.p2[0], q.p2[1]]), core = pts.filter(q => q.n[2] > -.25 && dot3(q.n, L) < -.35).map(q => [q.p2[0], q.p2[1]]);
  g.save(); g.clip(clipP);
  if (sh.length > 2) softFill(smooth(hull(sh)), shadowC, R * soft);
  if (core.length > 2) softFill(smooth(hull(core)), coreC, R * soft * .6);
  g.restore();
}
// the rim: a light line on the silhouette's side facing away from the key
function rim(path, V, L, c, a, R) { if (a <= 0) return; g.save(); g.clip(path); const gr = g.createLinearGradient(V.x + L[0] * R, V.y - L[1] * R, V.x - L[0] * R, V.y + L[1] * R); gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(.6, rgba(c, 0)); gr.addColorStop(1, rgba(c, a));
  g.strokeStyle = gr; g.lineWidth = R * .09; g.filter = `blur(${(R * .025 * camZoom()).toFixed(1)}px)`; g.globalCompositeOperation = 'screen'; g.stroke(path); g.restore(); }
function grainIn(path, a = .35) { g.save(); g.clip(path); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a; g.fillStyle = grainPat(); g.fillRect(-3000, -3000, 8000, 9000); g.restore(); }

// ---------- face parts, drawn in the surface frame (units: head radius; x right, y down) ----------
function eyePart(D, e, side, R) {
  const ew = D.eyeW, op = clamp(e.open ?? 1, 0, 1.35), sq = e.squint || 0, look = e.look || [0, 0], lw = Math.max(.006, .012);
  const lidCol = D.lineC, skin = D.skin[0];
  if (op < .07 || e.taped) {      // shut: a curved lid line and lashes
    const p = bez([-ew, 0], [0, ew * .45], [ew, -ew * .05]); g.lineCap = 'round'; g.strokeStyle = lidCol; g.lineWidth = ew * .11; g.stroke(smooth(p, false));
    for (let k = 0; k < 7; k++) { const u = .2 + k * .1, x = lerp(-ew, ew, u); const y = Math.sin(u * Math.PI) * ew * .22; taper([[x, y], [x + side * ew * .05, y + ew * .22]], ew * .05, 0, lidCol); }
    return;
  }
  const up = ew * (.78 * op), lo = ew * (.42 - .22 * sq) * Math.min(1, op + .3), o = [ew * .02 * side, 0];
  const pts = [[-ew, ew * .06], [-ew * .55, -up * .95], [ew * .1, -up * 1.08], [ew * .75, -up * .7], [ew * 1.02, -ew * .02], [ew * .55, lo * .95], [-ew * .2, lo * 1.05], [-ew * .75, lo * .6]].map(([x, y]) => [x * side, y]);
  const P = smooth(pts);
  g.fillStyle = '#f7f1ea'; g.fill(P);
  g.save(); g.clip(P);
  const ir = ew * .64, ix = look[0] * ew * .42, iy = look[1] * ew * .22 - up * .06;
  // the iris: a deep ring, the colour lit from below-inside, fibres, a big pupil, two highlights
  let gr = g.createRadialGradient(ix, iy + ir * .25, ir * .1, ix, iy, ir); gr.addColorStop(0, D.irisHi); gr.addColorStop(.55, D.iris); gr.addColorStop(1, '#120806');
  g.fillStyle = gr; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
  g.lineWidth = ir * .025; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU + hash(k) * .1; g.strokeStyle = hash(k * 3) > .5 ? 'rgba(255,230,180,.25)' : 'rgba(10,5,2,.25)'; g.beginPath(); g.moveTo(ix + Math.cos(a) * ir * .4, iy + Math.sin(a) * ir * .4); g.lineTo(ix + Math.cos(a) * ir * .9, iy + Math.sin(a) * ir * .9); g.stroke(); }
  g.fillStyle = '#070303'; g.beginPath(); g.arc(ix, iy, ir * (.42 + .1 * (e.dilate || 0)), 0, TAU); g.fill();
  // the lid's shadow on the eyeball
  gr = g.createLinearGradient(0, -up, 0, -up + ew * .7); gr.addColorStop(0, 'rgba(60,30,30,.55)'); gr.addColorStop(1, 'rgba(60,30,30,0)'); g.fillStyle = gr; g.fillRect(-ew * 1.2, -up * 1.2, ew * 2.4, ew);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - ir * .32, iy - ir * .38, ir * .26, ir * .2, -.5, 0, TAU); g.fill();
  g.globalAlpha = .7; g.beginPath(); g.arc(ix + ir * .35, iy + ir * .3, ir * .09, 0, TAU); g.fill(); g.globalAlpha = 1;
  if (e.wet) { g.fillStyle = `rgba(255,255,255,${.5 * e.wet})`; g.fillRect(-ew, lo * .7, ew * 2, ew * .06); }
  g.restore();
  // lid line: thick at the top, a few lashes for the women, a fine crease above, the lower lid line short
  const top = smooth(pts.slice(0, 5), false); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = lidCol; g.lineWidth = ew * (D.female ? .14 : .1); g.stroke(top);
  if (D.female) for (let k = 0; k < 4; k++) { const u = .6 + k * .12, x = lerp(-ew * .2, ew * 1.05, u) * side, y = -up * (1 - u * .9) - ew * .02; taper([[x, y], [x + side * ew * .2, y - ew * .14]], ew * .07, 0, lidCol); }
  g.strokeStyle = rgba(D.lineRGB, .45); g.lineWidth = ew * .045; g.stroke(smooth(bez([-ew * .7 * side, -up - ew * .22], [ew * .1 * side, -up - ew * .42], [ew * .9 * side, -up * .6 - ew * .2]), false));
  g.strokeStyle = rgba(D.lineRGB, .55); g.lineWidth = ew * .05; g.stroke(smooth(bez([ew * .15 * side, lo * 1.0], [ew * .6 * side, lo * .95], [ew * .95 * side, ew * .05]), false));
  if (D.age) { g.strokeStyle = rgba(D.lineRGB, .3 * D.age); g.lineWidth = ew * .04; for (let k = 0; k < 3; k++) g.stroke(smooth(bez([ew * 1.1 * side, -ew * .1 + k * ew * .2], [ew * 1.35 * side, k * ew * .2], [ew * 1.5 * side, ew * .1 + k * ew * .3]), false)); }
}
function browPart(D, e, side) {
  const ew = D.eyeW, wr = e.worry || 0, fr = e.frown || 0, bu = e.browUp || 0;
  const a = [-ew * .9 * side + fr * ew * .25 * side, -ew * (.05 + .55 * wr + .3 * bu - .45 * fr)], c = [ew * .1 * side, -ew * (.45 + .2 * wr + .4 * bu - .25 * fr)], b = [ew * 1.15 * side, -ew * (.12 + .3 * bu - .1 * wr)];
  taper(bez(a, c, b, 14), ew * D.brow, ew * .06, D.hair[0]);
  g.save(); g.globalAlpha = .5; for (let k = 0; k < 10; k++) { const u = k / 10, p = bez(a, c, b, 10)[k]; taper([[p[0], p[1] + ew * .05], [p[0] + side * ew * .12, p[1] - ew * .06]], ew * .025, 0, D.hair[1]); } g.restore();
}
function mouthPart(D, e) {
  const mw = D.mouthW * (1 + .12 * (e.smile || 0) - .05 * (e.press || 0)), sm = e.smile || 0, sd = e.sad || 0, op = e.mouth || 0, cy = -mw * (.16 * sm - .2 * sd);
  if (op > .05) {
    const h = mw * .55 * op, P = smooth([[-mw, cy], [-mw * .5, -h * .3], [0, -h * .35], [mw * .5, -h * .3], [mw, cy], [mw * .5, h * .9], [0, h], [-mw * .5, h * .9]]);
    g.fillStyle = '#3b1018'; g.fill(P); g.save(); g.clip(P); g.fillStyle = '#f2ece4'; g.fillRect(-mw, -h * .5, mw * 2, h * .3); g.fillStyle = '#c4505e'; g.beginPath(); g.ellipse(0, h * .85, mw * .55, h * .4, 0, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = D.lineC; g.lineWidth = mw * .05; g.stroke(P);
  } else {
    const P = smooth(bez([-mw, cy], [0, mw * (.06 + .14 * sm - .1 * sd)], [mw, cy]), false); g.lineCap = 'round'; g.strokeStyle = D.lineC; g.lineWidth = mw * .06; g.stroke(P);
    for (const s of [-1, 1]) { g.strokeStyle = rgba(D.lineRGB, .5); g.lineWidth = mw * .04; g.stroke(smooth(bez([s * mw * .92, cy - mw * .05], [s * mw * 1.05, cy], [s * mw * .95, cy + mw * .1]), false)); }
  }
  // the lower lip as light and colour, the shadow under it
  if (D.lips) { g.fillStyle = rgba(D.lips, .55); g.beginPath(); g.ellipse(0, mw * .16 + (op > .05 ? mw * .5 * op : 0), mw * .6, mw * .13, 0, 0, TAU); g.fill(); g.fillStyle = rgba(D.lips, .4); g.beginPath(); g.ellipse(0, -mw * .1, mw * .55, mw * .08, 0, 0, TAU); g.fill(); }
  blob(0, mw * .42 + (op > .05 ? mw * .5 * op : 0), mw * .6, mw * .15, 0, D.shadeRGB, .3);
  blob(mw * .1, mw * .2, mw * .25, mw * .07, 0, '255,240,230', .25);
}
function earPart(D, side) {
  const s = .17, P = smooth([[0, -s], [side * s * .7, -s * 1.1], [side * s * 1.0, -s * .3], [side * s * .75, s * .6], [side * s * .3, s * 1.05], [0, s * .7]]);
  g.fillStyle = D.skin[1]; g.fill(P); g.save(); g.clip(P); blob(side * s * .45, 0, s * .45, s * .7, 0, D.bloodRGB, .35); g.restore();
  g.strokeStyle = D.lineC; g.lineWidth = s * .07; g.stroke(P);
  g.strokeStyle = rgba(D.lineRGB, .6); g.lineWidth = s * .06; g.stroke(smooth(bez([side * s * .2, -s * .6], [side * s * .75, -s * .2], [side * s * .35, s * .45]), false));
}

// ---------- hair, caps, masks: regions of an offset surface ----------
function layerCut(drawFn, cutPath) {        // draw something, then erase where the face shows through (a hairline, a mask edge)
  const L = LAYER.getContext('2d'), old = g; g = L; L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, W, H); useCam(); drawFn();
  if (cutPath) { useCam(); L.globalCompositeOperation = 'destination-out'; L.fill(cutPath); L.globalCompositeOperation = 'source-over'; }
  g = old; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(LAYER, 0, 0); g.restore(); useCam();
}
const LAYER = (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; })();

// ---------- the head ----------
// D: the design (shape numbers and colours). st: x, y, R, yaw, pitch, roll, light [x,y,z] (view space), e (expression), t
export function head(D, st) {
  const { x, y, R, t = 0 } = st, e = st.e || {}, V = view(x, y, R, st.yaw || 0, st.pitch || 0, st.roll || 0), L = norm(st.light || [-.6, .45, .65]);
  const blinkP = (t + hash(D.seed || 1) * 3.1) % 4.2, blink = e.blink === false || e.taped ? 0 : Math.max(0, 1 - Math.abs(blinkP - .1) / .08);
  const ex = { ...e, open: (e.open ?? 1) * (1 - blink) };
  useCam(); const lwk = R * .012;
  // the bun behind the head, the far ear (the head covers it)
  const bunC = D.hairStyle === 'bun' ? proj(V, [0, .78, -.78]) : null;
  if (bunC && bunC[2] < 0) bun(D, bunC, R, V, L);
  for (const side of [-1, 1]) { const s = surfN(D, side * (Math.PI / 2 + .05), 1.62), n = rot(V.M, s.n); if (n[2] < -.55) continue;
    inFrame(frameAt(V, [s.p[0] * 1.01, s.p[1], s.p[2]], norm([side * .5, 0, -.85]), [0, -1, 0])); earPart(D, 1); useCam(); }
  // the skin: its silhouette, a warm-to-cool fill, the light
  const skinPts = cloud(D, V, () => true), HP = pathOfCloud(skinPts, R);
  let gr = g.createLinearGradient(x + L[0] * R, y - L[1] * R, x - L[0] * R, y + L[1] * R); gr.addColorStop(0, D.skin[0]); gr.addColorStop(.55, D.skin[1]); gr.addColorStop(1, D.skin[2]);
  g.fillStyle = gr; g.fill(HP);
  lightRegion(skinPts, HP, L, rgba(D.shadeRGB, .55), rgba(D.coreRGB, .35), R);
  g.save(); g.clip(HP);
  // occlusion and blood: brow ridge, sockets, cheeks, nose tip, under the nose and lip; warm bounce under the jaw on the shadow side
  const at = (ph, th, d = 1) => proj(V, surf(D, ph, th, d)), vis = (ph, th) => rot(V.M, surfN(D, ph, th).n)[2];
  for (const s of [-1, 1]) { const so = at(s * .36, 1.5), ck = at(s * .48, 1.95), v1 = vis(s * .36, 1.5), v2 = vis(s * .48, 1.95);
    if (v1 > 0) blob(so[0], so[1] - R * .05, R * .22 * v1, R * .15, 0, D.coreRGB, .22 + .1 * (st.top || 0));
    if (v2 > 0) blob(ck[0], ck[1], R * .2 * v2 + R * .05, R * .13, 0, D.bloodRGB, (D.female ? .3 : .18) + .2 * (e.flush || 0)); }
  const nt = at(0, 1.92, 1.1); if (vis(0, 1.92) > 0) blob(nt[0], nt[1], R * .1, R * .08, 0, D.bloodRGB, .3);
  const un = at(-L[0] * .15, 2.03, 1.0); if (vis(0, 2.03) > -.2) blob(un[0], un[1], R * .14, R * .05, 0, D.coreRGB, .3);
  const ul = at(0, 2.3, 1.0); if (vis(0, 2.3) > -.2) blob(ul[0], ul[1], R * .16, R * .05, 0, D.coreRGB, .28);
  const jw = at(-Math.sign(L[0] || 1) * .6, 2.45); blob(jw[0], jw[1], R * .35, R * .2, 0, '255,170,120', .18);
  if (D.beard) { const ch = at(0, 2.35); blob(ch[0], ch[1], R * .5, R * .35, 0, '90,100,120', .12 * D.beard); }
  g.restore();
  rim(HP, V, L, st.rim || '170,210,255', st.rimA ?? .6, R); grainIn(HP, .3);
  g.save(); g.clip(HP);
  // features in their surface frames: only where that bit of the face looks toward us
  const F = (ph, th, fn, d = 1) => { const s = surfN(D, ph, th), n = rot(V.M, s.n); if (n[2] < .08) return; g.save(); g.globalAlpha = clamp((n[2] - .08) * 4); inFrame(frameAt(V, [s.p[0] * d, s.p[1] * d, s.p[2] * d], s.u, s.v)); fn(); g.restore(); useCam(); };
  for (const s of [-1, 1]) { F(s * D.eyeX, 1.3, () => browPart(D, ex, s), 1.01); F(s * D.eyeX, D.eyeTh, () => eyePart(D, ex, s, R), 1.0); }
  if (!D.mask) F(0, D.mouthTh, () => mouthPart(D, ex), 1.01);
  if (D.age) for (const s of [-1, 1]) F(s * .3, 2.1, () => { g.strokeStyle = rgba(D.lineRGB, .35 * D.age); g.lineWidth = .012; g.stroke(smooth(bez([0, -.12], [s * .06, 0], [s * .02, .14]), false)); });
  g.restore();
  g.strokeStyle = D.lineC; g.lineWidth = lwk; g.lineJoin = 'round'; g.stroke(HP);
  nose(D, V, L, R);
  // tears and sweat and the patient's tape (all in surface frames)
  if (e.tear) { const s = e.tearSide || 1, p = e.tearP ?? ((t * .22) % 1); F(s * (D.eyeX - .1), D.eyeTh + .1, () => tearPart(p, e.tear)); }
  if (e.sweat) for (let i = 0; i < 6; i++) F((hash(i) - .5) * 1.2, .9 + hash(i * 3) * .4, () => { const r = .02 + .015 * hash(i * 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(0, ((t * .03 * hash(i)) % .15), r, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-r * .3, -r * .3 + ((t * .03 * hash(i)) % .15), r * .3, 0, TAU); g.fill(); });
  if (e.taped) for (const s of [-1, 1]) F(s * D.eyeX, D.eyeTh, () => { g.save(); g.rotate(s * -.08); g.fillStyle = 'rgba(240,244,248,.42)'; g.fillRect(-.28, -.09, .56, .18); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = .008; g.strokeRect(-.28, -.09, .56, .18); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-.26, -.07, .52, .03); g.restore(); }, 1.02);
  // hair or cap, then mask
  if (D.cap) cap(D, V, L, R, HP, st); else if (D.hairStyle) hair(D, V, L, R, st);
  if (D.mask) mask(D, V, L, R, st);
  if (bunC && bunC[2] >= 0) bun(D, bunC, R, V, L);
  useCam();
  return { V, HP, at: (ph, th, d) => proj(V, surf(D, ph, th, d)) };
}
function tearPart(p, a) {
  const len = .1 + .5 * ss(p); g.save(); g.globalAlpha *= a; g.lineCap = 'round';
  g.strokeStyle = 'rgba(210,235,255,.5)'; g.lineWidth = .03; g.stroke(smooth(bez([0, 0], [-.03, len * .5], [.01, len]), false));
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = .008; g.stroke(smooth(bez([.004, 0], [-.026, len * .5], [.014, len]), false));
  const gr = g.createRadialGradient(-.008, len - .01, 0, 0, len, .04); gr.addColorStop(0, '#fff'); gr.addColorStop(.5, 'rgba(200,225,250,.7)'); gr.addColorStop(1, 'rgba(120,150,190,.5)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, len - .045); g.bezierCurveTo(.035, len, .025, len + .04, 0, len + .04); g.bezierCurveTo(-.025, len + .04, -.035, len, 0, len - .045); g.fill(); g.restore();
}
function nose(D, V, L, R) {
  const P = ph => proj(V, surf(D, ph, 0, 1)), at = (ph, th, d) => proj(V, surf(D, ph, th, d));
  const br = at(0, 1.62, 1.0), tip = at(0, 1.9, 1 + D.nose), und = at(0, 2.0, 1.03), wl = at(-.17, 1.98, 1.03), wr = at(.17, 1.98, 1.03);
  const yawS = rot(V.M, [0, 0, 1])[0];          // where the nose points on screen (- left, + right)
  const near = yawS > 0 ? wl : wr, far = yawS > 0 ? wr : wl, side = Math.abs(yawS);
  // the nose's own body (it can stand out of the face outline at three-quarter and in profile)
  const body = smooth([br, [tip[0] + yawS * R * .02, tip[1]], und, near, [lerp(br[0], near[0], .5), lerp(br[1], near[1], .5)]]);
  g.save(); g.globalAlpha = clamp(side * 2.5); g.fillStyle = D.skin[1]; g.fill(body); g.restore();
  g.save(); g.clip(body); g.globalAlpha = clamp(.3 + side * 2); blob(tip[0], tip[1], R * .1, R * .08, 0, D.bloodRGB, .3); blob(tip[0] + L[0] * R * .04, tip[1] - R * .03, R * .05, R * .035, 0, '255,245,235', .55); g.restore();
  g.lineCap = 'round'; g.strokeStyle = rgba(D.lineRGB, clamp(side * 2.2)); g.lineWidth = R * .011; g.stroke(smooth([br, [lerp(br[0], tip[0], .6) + yawS * R * .02, lerp(br[1], tip[1], .6)], tip, und], false));
  // nostril wings and holes, the far wing only from the front
  g.strokeStyle = D.lineC; g.lineWidth = R * .011; g.stroke(smooth(bez([near[0], near[1] - R * .05], [near[0] + (near[0] - tip[0]) * .5, near[1]], [lerp(near[0], und[0], .5), und[1]]), false));
  if (side < .45) { g.strokeStyle = rgba(D.lineRGB, .7); g.stroke(smooth(bez([far[0], far[1] - R * .05], [far[0] + (far[0] - tip[0]) * .5, far[1]], [lerp(far[0], und[0], .5), und[1]]), false)); }
  for (const w of side < .6 ? [wl, wr] : [near]) { g.fillStyle = rgba(D.coreRGB, .8); g.beginPath(); g.ellipse(lerp(w[0], und[0], .45), und[1] - R * .005, R * .022, R * .011, 0, 0, TAU); g.fill(); }
}
function bun(D, c, R, V, L) {
  const r = R * .38, P = new Path2D(); P.ellipse(c[0], c[1], r, r * .86, 0, 0, TAU);
  const gr = g.createRadialGradient(c[0] + L[0] * r * .4, c[1] - L[1] * r * .4, r * .1, c[0], c[1], r); gr.addColorStop(0, D.hair[2]); gr.addColorStop(.6, D.hair[1]); gr.addColorStop(1, D.hair[0]); g.fillStyle = gr; g.fill(P);
  g.save(); g.clip(P); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; g.strokeStyle = k % 2 ? rgba(D.hairHi, .35) : 'rgba(0,0,0,.25)'; g.lineWidth = R * .012; g.beginPath(); g.arc(c[0], c[1], r * (.3 + .07 * k), a, a + 2.2); g.stroke(); } g.restore();
  g.strokeStyle = D.lineC; g.lineWidth = R * .012; g.stroke(P);
}
// hair: an offset shell above the hairline, cut where the forehead shows; a sheen band; front locks with their own outlines
function hair(D, V, L, R, st) {
  const hl = (ph) => { const a = Math.abs(ph); return a < .75 ? lerp(D.hairline, D.hairline + .22, ss(a / .75)) : a < 1.35 ? lerp(D.hairline + .22, 1.68, ss((a - .75) / .6)) : a < 1.85 ? lerp(1.68, 1.5, ss((a - 1.35) / .5)) : lerp(1.5, 2.3, ss((a - 1.85) / 1.3)); };
  const vol = (ph, th) => D.hairVol * Math.pow(Math.max(0, Math.cos(th * .85)), .7) * (1 + .25 * Math.sin(ph * 3 + 1)) - .03 * ss((th - 1.1) / .5);
  const pts = cloud(D, V, (ph, th) => th < hl(ph) + .05, D.hairD, vol);
  const face = cloud(D, V, (ph, th) => th > hl(ph) + .02 && Math.abs(ph) < 1.45 && th < 2.9).filter(q => q.n[2] > 0).map(q => [q.p2[0], q.p2[1]]);
  const HP = pathOfCloud(pts, R), cut = face.length > 2 ? smooth(hull(face)) : null;
  layerCut(() => {
    const gr = g.createLinearGradient(V.x + L[0] * R, V.y - R, V.x - L[0] * R, V.y + R * .5); gr.addColorStop(0, D.hair[2]); gr.addColorStop(.5, D.hair[1]); gr.addColorStop(1, D.hair[0]); g.fillStyle = gr; g.fill(HP);
    lightRegion(pts, HP, L, 'rgba(0,0,0,.35)', 'rgba(0,0,0,.25)', R, .05);
    // strands: projected meridians from the crown, a sheen band across the top
    g.save(); g.clip(HP);
    for (let k = 0; k < 46; k++) { const ph0 = -Math.PI + k / 46 * TAU + hash(k) * .1, line = []; for (let j = 0; j <= 10; j++) { const th = lerp(.05, hl(ph0) + .1, j / 10); line.push(proj(V, surf(D, ph0 + Math.sin(j * .4 + k) * .05, th, D.hairD + .005))); }
      if (rot(V.M, surfN(D, ph0, .8).n)[2] < -.2) continue; g.strokeStyle = k % 3 ? 'rgba(0,0,0,.22)' : rgba(D.hairHi, .22); g.lineWidth = R * (.006 + .006 * hash(k * 3)); g.stroke(smooth(line, false)); }
    const sheen = []; for (let k = 0; k <= 16; k++) sheen.push(proj(V, surf(D, -1.2 + k * .15, .55 + .08 * Math.sin(k), D.hairD + .01))); g.strokeStyle = rgba(D.hairHi, .45); g.lineWidth = R * .08; g.filter = `blur(${(R * .03 * camZoom()).toFixed(1)}px)`; g.stroke(smooth(sheen, false)); g.filter = 'none';
    g.restore();
    rim(HP, V, L, st.rim || '170,210,255', (st.rimA ?? .6) * .8, R);
    g.strokeStyle = D.lineC; g.lineWidth = R * .012; g.stroke(HP);
  }, cut);
  // front locks over the hairline
  for (const [ph, len, bend] of D.locks || []) { const a = []; for (let j = 0; j <= 8; j++) a.push(proj(V, surf(D, ph + bend * j / 8, lerp(hl(ph) - .3, hl(ph) + len, j / 8), D.hairD + vol(ph, hl(ph) - .3) * (1 - j / 8) + .01 - .02 * j / 8)));
    if (rot(V.M, surfN(D, ph, hl(ph)).n)[2] < .05) continue; const P = taper(a, R * .085, R * .006, D.hair[(Math.round(ph * 7) % 2 + 2) % 2]); g.save(); g.clip(P); blob(a[2][0] + L[0] * R * .05, a[2][1], R * .1, R * .2, 0, D.hairHi, .3); g.restore(); g.strokeStyle = D.lineC; g.lineWidth = R * .009; g.stroke(P); }
}
function cap(D, V, L, R, HP_, st) {
  const hl = ph => { const a = Math.abs(ph); return a < 1.5 ? lerp(1.2, 1.5, ss(a / 1.5)) : lerp(1.5, 1.95, ss((a - 1.5) / 1.6)); };
  const pts = cloud(D, V, (ph, th) => th < hl(ph) + .05, 1.1, (ph, th) => .06 * Math.max(0, Math.cos(th)) + .015 * Math.sin(ph * 10) * Math.max(0, Math.cos(th)));
  const face = cloud(D, V, (ph, th) => th > hl(ph) + .03 && Math.abs(ph) < 1.5 && th < 2.95).filter(q => q.n[2] > 0).map(q => [q.p2[0], q.p2[1]]);
  const CP = pathOfCloud(pts, R), cut = face.length > 2 ? smooth(hull(face)) : null;
  layerCut(() => {
    const gr = g.createLinearGradient(V.x + L[0] * R, V.y - R, V.x - L[0] * R, V.y + R * .3); gr.addColorStop(0, D.cap[0]); gr.addColorStop(.6, D.cap[1]); gr.addColorStop(1, D.cap[2]); g.fillStyle = gr; g.fill(CP);
    lightRegion(pts, CP, L, 'rgba(10,30,50,.3)', 'rgba(10,30,50,.2)', R, .05);
    g.save(); g.clip(CP);
    if (D.capDots) for (let i = 0; i < 70; i++) { const ph = -Math.PI + hash(i * 1.3) * TAU, th = .2 + hash(i * 2.7) * 1.1; if (rot(V.M, surfN(D, ph, th).n)[2] < 0) continue; const p = proj(V, surf(D, ph, th, 1.14)); g.fillStyle = rgba(D.capDots, .55); g.beginPath(); g.arc(p[0], p[1], R * .025, 0, TAU); g.fill(); }
    for (let k = 0; k < 14; k++) { const ph0 = -Math.PI + k / 14 * TAU, ln = []; for (let j = 0; j <= 8; j++) ln.push(proj(V, surf(D, ph0 + .08 * Math.sin(j), lerp(.15, hl(ph0), j / 8), 1.13))); g.strokeStyle = 'rgba(0,20,40,.18)'; g.lineWidth = R * .02; g.filter = `blur(${(R * .008 * camZoom()).toFixed(1)}px)`; g.stroke(smooth(ln, false)); g.filter = 'none'; }
    g.restore();
    rim(CP, V, L, st.rim || '170,210,255', (st.rimA ?? .6) * .7, R);
    g.strokeStyle = D.lineC; g.lineWidth = R * .012; g.stroke(CP);
    const band = []; for (let k = 0; k <= 30; k++) { const ph = -Math.PI * .95 + k / 30 * Math.PI * 1.9; if (rot(V.M, surfN(D, ph, hl(ph)).n)[2] < -.1) continue; band.push(proj(V, surf(D, ph, hl(ph) - .04, 1.13))); }
    if (band.length > 2) { g.strokeStyle = D.cap[2]; g.lineWidth = R * .06; g.stroke(smooth(band, false)); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = R * .012; g.stroke(smooth(band, false)); }
  }, cut);
}
function mask(D, V, L, R, st) {
  const inside = (ph, th) => Math.abs(ph) < 1.32 && th > 1.72 && th < 2.95;
  const bulge = (ph, th) => .14 * Math.exp(-((ph / .55) ** 2) - (((th - 2.05) / .35) ** 2)) + .05;
  const pts = cloud(D, V, inside, 1.04, bulge).filter(q => q.n[2] > -.05);
  if (pts.length < 3) return;
  const MP = pathOfCloud(pts, R);
  const gr = g.createLinearGradient(V.x + L[0] * R, V.y, V.x - L[0] * R, V.y + R); gr.addColorStop(0, '#e6f3f7'); gr.addColorStop(.6, '#b6d3dd'); gr.addColorStop(1, '#7ea2b0'); g.fillStyle = gr; g.fill(MP);
  lightRegion(pts, MP, L, 'rgba(20,60,80,.3)', 'rgba(20,60,80,.2)', R, .05);
  g.save(); g.clip(MP);
  for (const th of [1.98, 2.22, 2.46]) { const ln = []; for (let k = 0; k <= 24; k++) { const ph = -1.3 + k / 24 * 2.6; if (rot(V.M, surfN(D, ph, th).n)[2] < 0) continue; ln.push(proj(V, surf(D, ph, th, 1.04 + bulge(ph, th) + .005))); }
    if (ln.length > 2) { g.strokeStyle = 'rgba(30,70,90,.35)'; g.lineWidth = R * .016; g.stroke(smooth(ln, false)); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = R * .007; g.save(); g.translate(0, -R * .012); g.stroke(smooth(ln, false)); g.restore(); } }
  const top = proj(V, surf(D, 0, 1.78, 1.12)); blob(top[0], top[1], R * .2, R * .05, 0, '255,255,255', .5);
  g.restore();
  rim(MP, V, L, st.rim || '170,210,255', (st.rimA ?? .6) * .6, R);
  g.strokeStyle = 'rgba(40,70,85,.8)'; g.lineWidth = R * .01; g.stroke(MP);
  for (const s of [-1, 1]) for (const [th0, th1] of [[1.8, 1.55], [2.6, 1.9]]) { const a = proj(V, surf(D, s * 1.3, th0, 1.08)), b = proj(V, surf(D, s * 1.62, th1, 1.04)); if (rot(V.M, surfN(D, s * 1.45, th0).n)[2] < -.2) continue; g.strokeStyle = 'rgba(230,240,245,.85)'; g.lineWidth = R * .02; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
}

// ---------- the body: neck, shoulders and chest as a lit volume; clothes with a neckline and folds ----------
// B: { x, y (the head centre), R, yaw, pitch, roll (the torso's own turn) }
export function bust(D, st) {
  const { R } = st, V = view(st.x, st.y, st.R, st.bodyYaw ?? (st.yaw || 0) * .5, st.bodyPitch ?? (st.pitch || 0) * .6, st.bodyRoll ?? (st.roll || 0)), L = norm(st.light || [-.6, .45, .65]);
  useCam();
  const ring = (yy, rx, rz, n = 28) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push({ p: [Math.sin(a) * rx, yy, Math.cos(a) * rz], n: norm([Math.sin(a) / rx, 0, Math.cos(a) / rz]) }); } return o; };
  const br = Math.sin((st.t || 0) * 1.7 + (D.seed || 0)) * .015 * (st.breathe ?? 1);
  const rings = [ring(-.7, .33, .31), ring(-1.7, .42, .38), ring(-1.38, .9, .48), ring(-1.58, 1.48 + br, .7 + br), ring(-2.15, 1.6 + br, .8 + br), ring(-3.4, 1.55, .78), ring(-5.0, 1.5, .76)];
  const neckPts = [...rings[0], ...rings[1]].map(q => ({ p2: proj(V, q.p), n: rot(V.M, q.n) })), body = [...rings[2], ...rings[3], ...rings[4], ...rings[5], ...rings[6]].map(q => ({ p2: proj(V, q.p), n: rot(V.M, q.n), y: q.p[1], x: q.p[0], z: q.p[2] }));
  // the neck first: the collar covers its foot
  const NPth = pathOfCloud(neckPts, R); let gr = g.createLinearGradient(st.x + L[0] * R * .4, 0, st.x - L[0] * R * .4, 0); gr.addColorStop(0, D.skin[1]); gr.addColorStop(1, D.skin[2]); g.fillStyle = gr; g.fill(NPth);
  g.save(); g.clip(NPth); const jt = proj(V, [0, -.6, .1]); blob(jt[0], jt[1] + R * .1, R * .5, R * .3, 0, D.coreRGB, .6); g.restore();
  g.strokeStyle = D.lineC; g.lineWidth = R * .011; g.stroke(NPth);
  // the torso in its clothes
  const TP = pathOfCloud(body, R);
  gr = g.createLinearGradient(st.x + L[0] * R * 1.6, 0, st.x - L[0] * R * 1.6, 0); gr.addColorStop(0, D.wear[0]); gr.addColorStop(.6, D.wear[1]); gr.addColorStop(1, D.wear[2]); g.fillStyle = gr; g.fill(TP);
  lightRegion(body, TP, L, rgba(D.wearShade, .45), rgba(D.wearShade, .3), R, .1);
  g.save(); g.clip(TP);
  // folds: from the shoulders toward the armpits, a few soft verticals
  for (let k = 0; k < 10; k++) { const s = k % 2 ? 1 : -1, a = proj(V, [s * (.5 + .1 * k), -1.5, .6]), b = proj(V, [s * (1.25 + .02 * k), -2.4 - .2 * hash(k), .45]), c = proj(V, [s * (.8 + .05 * k), -2.0, .75]);
    g.strokeStyle = k % 3 ? rgba(D.wearShade, .25) : 'rgba(255,255,255,.12)'; g.lineWidth = R * (.03 + .03 * hash(k)); g.filter = `blur(${(R * .015 * camZoom()).toFixed(1)}px)`; g.stroke(smooth([a, c, b], false)); g.filter = 'none'; }
  if (D.print) for (let i = 0; i < 70; i++) { const a = -1.3 + hash(i * 1.7) * 2.6, yy = -1.75 - hash(i * 2.9) * 3.2; const p = proj(V, [Math.sin(a) * 1.55, yy, Math.cos(a) * .78]); if (rot(V.M, [Math.sin(a), 0, Math.cos(a)])[2] < 0) continue;
    for (let q = 0; q < 5; q++) { const an = q / 5 * TAU; g.fillStyle = rgba(D.print, .7); g.beginPath(); g.ellipse(p[0] + Math.cos(an) * R * .05, p[1] + Math.sin(an) * R * .05, R * .04, R * .028, an, 0, TAU); g.fill(); } g.fillStyle = '#e8b040'; g.beginPath(); g.arc(p[0], p[1], R * .025, 0, TAU); g.fill(); }
  g.restore();
  rim(TP, V, L, st.rim || '170,210,255', (st.rimA ?? .6) * .7, R);
  g.strokeStyle = D.lineC; g.lineWidth = R * .012; g.stroke(TP);
  // the neckline: a V for scrubs and gowns, round for the house dress, a collar and shirt for the jacket
  const neckline = D.neckline === 'round' ? [[-.55, -1.42], [-.3, -1.7], [0, -1.78], [.3, -1.7], [.55, -1.42]] : D.neckline === 'collar' ? [[-.42, -1.4], [-.2, -2.05], [0, -2.25], [.2, -2.05], [.42, -1.4]] : [[-.48, -1.42], [-.2, -1.85], [0, -2.2], [.2, -1.85], [.48, -1.42]];
  const NL = neckline.map(([xx, yy]) => proj(V, [xx, yy, Math.sqrt(Math.max(0, 1 - (xx / 1.5) ** 2)) * .72 + .02]));
  if (rot(V.M, [0, 0, 1])[2] > -.2) { const NP = smooth(NL, true); g.fillStyle = D.neckline === 'collar' ? '#e6e0d4' : D.skin[1]; g.fill(NP); g.save(); g.clip(NP); blob(NL[2][0], NL[0][1], R * .6, R * .35, 0, D.coreRGB, .45); g.restore(); g.strokeStyle = D.neckline === 'collar' ? '#1a1a20' : D.wear[2]; g.lineWidth = R * (D.neckline === 'collar' ? .05 : .035); g.stroke(smooth(NL, false)); }
  if (D.chain) { const ch = []; for (let k = 0; k <= 16; k++) { const a = -1.1 + k / 16 * 2.2; ch.push(proj(V, [Math.sin(a) * .45, -1.4 - .25 * Math.cos(a * 1.4), Math.cos(a) * .42 + .02])); } g.strokeStyle = '#e9c25a'; g.lineWidth = R * .025; g.setLineDash([R * .02, R * .012]); g.stroke(smooth(ch, false)); g.setLineDash([]); }
  return V;
}
// the whole person from the chest up: body, then head on top (a head turned away is still drawn after the body)
export function person(D, st) { bust(D, st); return head(D, st); }

// ---------- hands: the back of a hand resting on a surface, seen from above (x along the fingers, units = palm width) ----------
// curl (per finger, 0..1) folds a finger down into the surface: from above it gets shorter. lift raises the index toward the camera:
// it shortens, its tip grows a little, and its shadow on the surface slides away from it.
export function hand(D, x, y, s, ang, o = {}) {
  const curl = o.curl || [.2, .15, .15, .2, .25], flip = o.flip ? -1 : 1, lift = o.lift || 0;
  g.save(); useCam(); g.translate(x, y); g.rotate(ang); g.scale(s, s * flip);
  const fingerPts = k => { const base = [[.62, -.33], [.68, -.11], [.66, .11], [.6, .32]][k], len = [.78, .88, .82, .64][k], spread = [-.12, -.04, .04, .12][k];
    const c = clamp(curl[k + 1] ?? .2), lf = k === 0 ? lift : 0, L = len * (1 - .38 * c) * (1 - .45 * lf), a = spread * (1 - c * .5);
    return { b: base, tip: [base[0] + Math.cos(a) * L, base[1] + Math.sin(a) * L], w: [.19, .2, .195, .17][k] * (1 + .25 * lf), lf, c }; };
  const F = [0, 1, 2, 3].map(fingerPts);
  // shadow on the surface first: the whole hand's soft contact shadow, and the lifted finger's shadow sliding off
  g.save(); g.filter = `blur(${(.06 * s * camZoom()).toFixed(1)}px)`; g.fillStyle = 'rgba(10,25,35,.45)';
  g.beginPath(); g.ellipse(.35, .08, 1.1, .62, 0, 0, TAU); g.fill();
  for (const f of F) { const off = f.lf * .35; g.beginPath(); g.moveTo(f.b[0] + off, f.b[1] + .06 + off * .6); g.lineTo(f.tip[0] + off * 1.6, f.tip[1] + .06 + off); g.lineWidth = f.w * .9; g.lineCap = 'round'; g.strokeStyle = `rgba(10,25,35,${.45 - .2 * f.lf})`; g.stroke(); }
  g.restore();
  const skinFill = (P, x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, D.skin[0]); gr.addColorStop(.55, D.skin[1]); gr.addColorStop(1, D.skin[2]); g.fillStyle = gr; g.fill(P); };
  // wrist and forearm, the sleeve
  const arm = smooth([[-1.7, -.44], [-.6, -.42], [.05, -.38], [.1, 0], [.05, .4], [-.6, .44], [-1.7, .46]]); skinFill(arm, 0, -.45, 0, .45); g.strokeStyle = D.lineC; g.lineWidth = .02; g.stroke(arm);
  g.save(); g.clip(arm); g.strokeStyle = 'rgba(120,90,150,.22)'; g.lineWidth = .035; g.stroke(smooth(bez([-1.6, -.05], [-.9, -.15], [-.1, -.08]), false)); g.stroke(smooth(bez([-1.4, .12], [-.8, .05], [-.2, .12]), false)); g.restore();
  if (o.sleeve) { const sl = smooth([[-1.8, -.56], [-1.05, -.58], [-.98, -.2], [-1.0, .2], [-1.05, .58], [-1.8, .6]]); g.fillStyle = o.sleeve; g.fill(sl); g.save(); g.clip(sl); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-1.1, -.6, .15, 1.2); g.restore(); g.strokeStyle = D.lineC; g.lineWidth = .02; g.stroke(sl); }
  // fingers, little finger first so the index sits on top; each a smooth tapered form with two knuckle creases and a nail
  for (let k = 3; k >= 0; k--) { const f = F[k], dx = f.tip[0] - f.b[0], dy = f.tip[1] - f.b[1], L = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    g.save(); g.translate(f.b[0], f.b[1]); g.rotate(a);
    const w0 = f.w / 2, w1 = f.w * .42, P = new Path2D(); P.moveTo(-.05, -w0); P.bezierCurveTo(L * .4, -w0 * 1.04, L * .75, -w1 * 1.05, L - w1, -w1); P.arc(L - w1, 0, w1, -Math.PI / 2, Math.PI / 2); P.bezierCurveTo(L * .75, w1 * 1.05, L * .4, w0 * 1.04, -.05, w0); P.closePath();
    skinFill(P, 0, -w0, 0, w0); g.save(); g.clip(P);
    g.fillStyle = rgba(D.shadeRGB, .25 + .2 * f.c); g.fillRect(-.1, w0 * .2, L + .2, w0);                     // the side away from the light
    g.fillStyle = 'rgba(255,240,230,.25)'; g.fillRect(-.1, -w0 * .55, L + .2, w0 * .3);                          // a highlight along the top
    for (const u of [.42, .72]) { g.strokeStyle = rgba(D.lineRGB, .45); g.lineWidth = .012; g.beginPath(); g.moveTo(L * u, -w0 * .5); g.quadraticCurveTo(L * u + .025, 0, L * u, w0 * .5); g.stroke(); g.beginPath(); g.moveTo(L * u + .03, -w0 * .35); g.quadraticCurveTo(L * u + .05, 0, L * u + .03, w0 * .35); g.stroke(); }
    const nl = Math.min(.17, L * .26); g.fillStyle = 'rgba(255,214,205,.9)'; g.beginPath(); g.roundRect(L - nl - w1 * .25, -w1 * .62, nl, w1 * 1.24, w1 * .55); g.fill(); g.strokeStyle = rgba(D.lineRGB, .5); g.lineWidth = .01; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(L - nl * .55 - w1 * .25, -w1 * .25, nl * .3, w1 * .12, 0, 0, TAU); g.fill();
    g.restore(); g.strokeStyle = D.lineC; g.lineWidth = .02; g.stroke(P); g.restore(); }
  // the back of the hand: tendons fanning to the knuckles, the knuckles lit, a vein
  const palm = smooth([[-.02, -.43], [.32, -.47], [.66, -.43], [.74, -.2], [.74, .12], [.66, .4], [.3, .48], [-.02, .44]]); skinFill(palm, 0, -.45, 0, .45);
  g.save(); g.clip(palm); for (const k of [0, 1, 2, 3]) { const kn = F[k].b; blob(kn[0] - .02, kn[1], .08, .06, 0, '255,240,230', .5); g.strokeStyle = rgba(D.shadeRGB, .18); g.lineWidth = .03; g.stroke(smooth(bez([.05, kn[1] * .4], [.35, kn[1] * .75], [kn[0] - .08, kn[1]]), false)); }
  blob(.35, .3, .45, .2, 0, D.shadeRGB, .25); g.strokeStyle = 'rgba(120,90,150,.25)'; g.lineWidth = .025; g.stroke(smooth(bez([0, .05], [.25, -.12], [.5, -.05]), false)); g.restore();
  g.strokeStyle = D.lineC; g.lineWidth = .02; g.stroke(palm);
  // the thumb, tucked along the side
  const tc = clamp(curl[0]), th = new Path2D(), tb = [.12, .42], tt = [.52 - .15 * tc, .7 - .08 * tc]; th.moveTo(tb[0] - .08, tb[1] - .1); th.bezierCurveTo(.3, .5, tt[0] - .1, tt[1] - .14, tt[0], tt[1] - .08); th.arc(tt[0] - .02, tt[1], .09, -1.2, 1.9); th.bezierCurveTo(.3, .72, .1, .62, tb[0] - .14, tb[1] + .1); th.closePath();
  skinFill(th, 0, .4, 0, .8); g.strokeStyle = D.lineC; g.lineWidth = .02; g.stroke(th); g.fillStyle = 'rgba(255,214,205,.85)'; g.beginPath(); g.ellipse(tt[0] - .02, tt[1] - .01, .045, .035, .6, 0, TAU); g.fill();
  g.restore(); useCam();
}
