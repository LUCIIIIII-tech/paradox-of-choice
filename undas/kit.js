// Shared helpers for the reel: math, painterly canvas textures, materials, mesh shortcuts. Everything is seeded (hash), so a frame depends on t alone.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const lerp = (a, b, u) => a + (b - a) * u, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = u => { u = clamp(u); return u * u * (3 - 2 * u); }, sss = u => ss(ss(u));
export const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
// smooth value noise in time: a slow wander for breathing, tremble, handheld (sum of incommensurate sines)
export const wob = (t, k = 0, f = 1) => .5 * Math.sin(t * f * 1.13 + k * 1.7) + .3 * Math.sin(t * f * 2.31 + k * 3.1) + .2 * Math.sin(t * f * 4.07 + k * 5.3);

export function ctex(w, h, fn, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}
const hex = c => '#' + new THREE.Color(c).getHexString();
// painterly: a base colour covered in short directional brush strokes of nearby tones (the look of the 2D reels, wrapped on 3D)
export function brush(g, w, h, base, n = 900, spread = .08, len = 22, ang = 0, seed = 1) {
  const c = new THREE.Color(base); g.fillStyle = hex(c); g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const k = seed * 1000 + i, hsl = {}; c.getHSL(hsl);
    const cc = new THREE.Color().setHSL(hsl.h + (hash(k) - .5) * spread * .3, clamp(hsl.s + (hash(k * 1.7) - .5) * spread), clamp(hsl.l + (hash(k * 2.3) - .5) * spread * 1.4));
    g.save(); g.translate(hash(k * 3.1) * w, hash(k * 4.7) * h); g.rotate(ang + (hash(k * 5.9) - .5) * .7);
    g.globalAlpha = .25 + .35 * hash(k * 6.1); g.fillStyle = hex(cc); const L = len * (.5 + hash(k * 7.3)), T = 3 + 5 * hash(k * 8.9);
    g.beginPath(); g.ellipse(0, 0, L, T, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.globalAlpha = 1;
}
export function grime(g, w, h, n, a, seed = 1) { for (let i = 0; i < n; i++) { const k = seed * 77 + i; g.fillStyle = `rgba(${hash(k) > .55 ? '230,225,210' : '18,14,10'},${a * hash(k * 9.1)})`; const s = 1 + 4 * hash(k * 4); g.fillRect(hash(k * 1.3) * w, hash(k * 2.9) * h, s, s); } }
export function paintTex(base, o = {}) { return ctex(o.w || 256, o.h || 256, (g, w, h) => { brush(g, w, h, base, o.n || 500, o.spread ?? .08, o.len || 20, o.ang || 0, o.seed || 1); if (o.grime) grime(g, w, h, o.grime, .25, o.seed || 1); if (o.fn) o.fn(g, w, h); }, o.rx || 1, o.ry || 1); }

// toon-ish shading with a soft 4-step ramp, so forms read like painted cartoons under real lights
const ramp = (() => { const d = new Uint8Array([40, 40, 40, 255, 110, 110, 110, 255, 185, 185, 185, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 4, 1); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
export const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, map: o.map || null, emissive: o.emis ? (o.emisColor ?? color) : 0x000000, emissiveIntensity: o.emis || 0, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side || THREE.FrontSide });
export const std = (color, rough = .8, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: o.metal || 0, map: o.map || null, emissive: o.emis ? (o.emisColor ?? color) : 0x000000, emissiveIntensity: o.emis || 0, emissiveMap: o.emisMap || null, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side || THREE.FrontSide });
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, map: o.map || null, transparent: true, opacity: o.opacity ?? 1, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !!o.depthWrite, side: o.side || THREE.FrontSide, fog: o.fog ?? true });

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), rbox = (w, h, d, r = .05) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
export function add(p, geo, m, x = 0, y = 0, z = 0, cast = true) { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = cast; me.receiveShadow = true; p.add(me); return me; }
export function group(p, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; }

// a soft round sprite (for dust, steam, glows, fog puffs)
export const softDot = ctex(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
export const puff = ctex(128, 128, (g, w, h) => { for (let i = 0; i < 14; i++) { const x = 64 + (hash(i) - .5) * 50, y = 64 + (hash(i * 3) - .5) * 40, r0 = 18 + 22 * hash(i * 5); const r = g.createRadialGradient(x, y, 0, x, y, r0); r.addColorStop(0, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); } });

// dust motes floating in a volume; update(t) moves them along slow seeded drifts
export function dust(p, n, bx, by, bz, cx = 0, cy = 0, cz = 0, size = .02, color = 0xfff2dc, op = .5) {
  const pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size, map: softDot, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = new THREE.Points(geo, m); p.add(pts);
  return { pts, m, update(t) { for (let i = 0; i < n; i++) { const s = t * (.02 + .03 * hash(i * 1.9));
    pos[i * 3] = cx + ((hash(i) + s * (hash(i * 2.2) - .5) + .05 * Math.sin(t * .3 + i)) % 1 + 1) % 1 * bx - bx / 2;
    pos[i * 3 + 1] = cy + ((hash(i * 3.3) - s * .4) % 1 + 1) % 1 * by;
    pos[i * 3 + 2] = cz + ((hash(i * 5.1) + .04 * Math.sin(t * .23 + i * 2)) % 1 + 1) % 1 * bz - bz / 2; } geo.attributes.position.needsUpdate = true; } };
}
// layered fog sheets that slide slowly (ground fog / haze), y = height, each sheet a soft puff texture
export function fogSheets(p, n, w, d, y, color = 0x9aa8b8, op = .12, seed = 1) {
  const sheets = []; for (let i = 0; i < n; i++) { const tx = puff.clone(); tx.needsUpdate = true; tx.repeat.set(2, 1); tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    const m = basic(color, { map: tx, opacity: op * (.6 + .6 * hash(seed + i)), side: THREE.DoubleSide }); const me = add(p, new THREE.PlaneGeometry(w, d), m, 0, y + i * .12, 0, false); me.rotation.x = -Math.PI / 2; me.receiveShadow = false; me.renderOrder = 5; sheets.push([me, tx, i]); }
  return { sheets, update(t) { for (const [me, tx, i] of sheets) { tx.offset.set(t * (.006 + .004 * hash(seed + i * 7)) * (i % 2 ? 1 : -1), t * .002 * (i % 3 - 1)); me.position.y = y + i * .12 + .03 * Math.sin(t * .2 + i); } } };
}
// rising steam / smoke: sprites that rise, widen and fade on a loop
export function wisps(p, n, x, y, z, h = .4, color = 0xffffff, op = .18, size = .12, spread = .04) {
  const sp = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color, transparent: true, opacity: 0, depthWrite: false })); p.add(s); sp.push(s); }
  return { sp, update(t, k = 1) { sp.forEach((s, i) => { const u = ((t * .25 + i / n) % 1); s.position.set(x + spread * Math.sin(t * .9 + i * 2.1) * u * 3, y + u * h, z + spread * Math.cos(t * .7 + i) * u * 2); const sc = size * (.5 + 1.6 * u); s.scale.set(sc, sc, 1); s.material.opacity = op * k * Math.sin(Math.PI * u); }); } };
}
export function txt(g, s, x, y, px, color = '#fff', font = 'Anton', align = 'center') { g.font = `${px}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
