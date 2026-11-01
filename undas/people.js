// The people, built from rounded blocks like the other 3D reels but jointed (shoulder, elbow, hip, knee, neck) so they breathe, blink and tremble.
// guard(): the night-shift guard (white polo, navy cap and trousers). reliever(): the morning guard. girl(): the child in the hospital gown.
import * as THREE from 'three';
import { add, group, rbox, box, toon, paintTex, hash, wob, clamp, lerp, ss } from './kit.js';

function limb(p, x, y, len, w, mat, endMat, endLen = .12, endW) {   // two segments: upper (from the joint down) and lower (from the second joint down)
  const cap = (r, l) => new THREE.CapsuleGeometry(r, Math.max(.001, l - 2 * r), 4, 12);
  const j1 = group(p, x, y, 0); add(j1, cap(w / 2, len + w * .3), mat, 0, -len / 2, 0);
  const j2 = group(j1, 0, -len, 0); add(j2, cap(w * .45, len * .95 + w * .3), mat, 0, -len * .47, 0);
  const end = group(j2, 0, -len * .95, 0); add(end, new THREE.SphereGeometry(1, 14, 10), endMat, 0, -endLen / 2, 0).scale.set((endW || w) * .55, endLen * .6, (endW || w) * .5);
  return { j1, j2, end };
}
// a face: eyes with lids (blink), brows, a mouth that can stretch into a wide grin (a dark arc)
function face(head, skin, o) {
  const ink = toon(0x0c0908), white = toon(0xe8e2d4), lidM = toon(o.lid ?? skin.color.getHex());
  const eyes = [], lids = [];
  for (const s of [-1, 1]) {
    const e = group(head, s * o.eyeX, o.eyeY, o.z); add(e, new THREE.SphereGeometry(o.eyeR, 14, 10), white, 0, 0, -.01).scale.set(1.15, 1, .5);
    add(e, new THREE.SphereGeometry(o.eyeR * .55, 12, 8), ink, 0, -.003, o.eyeR * .25).scale.set(1, 1, .5); eyes.push(e);
    const lid = add(e, new THREE.SphereGeometry(o.eyeR * 1.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lidM, 0, 0, .002); lid.scale.set(1.2, 1, .62); lid.rotation.x = -.2; lids.push(lid);
    if (o.brow) add(head, box(o.eyeR * 2.6, .022, .02), toon(o.brow), s * o.eyeX, o.eyeY + o.eyeR * 2.1, o.z + .005).rotation.z = s * -.08;
  }
  const mouth = group(head, 0, o.mouthY, o.z + .004);
  const flat = add(mouth, box(o.mouthW, .014, .006), toon(0x3a1410), 0, 0, 0);
  const grin = add(mouth, new THREE.TorusGeometry(o.mouthW * .6, .012, 6, 24, Math.PI * .9), toon(0x140806), 0, .02, 0); grin.rotation.z = Math.PI * 1.05; grin.visible = false;
  return { eyes, lids, mouth, flat, grin };
}

export function guard(o = {}) {
  const g = new THREE.Group(), seed = o.seed || 1;
  const polo = toon(0xffffff, { map: paintTex(o.shirt ?? 0xdedbd0, { seed, n: 400, spread: .05 }) }), pants = toon(0xffffff, { map: paintTex(o.pants ?? 0x1c2438, { seed: seed + 1, n: 300 }) });
  const skin = toon(0xffffff, { map: paintTex(o.skin ?? 0xa8704a, { seed: seed + 2, n: 300, spread: .06, len: 12 }) }); skin.color.set(0xffffff);
  const skinC = toon(o.skin ?? 0xa8704a), shoe = toon(0x121010), navy = toon(0x1a2034), hairM = toon(0x16110e), gold = toon(0xc9a548, { emis: .15 });
  const hips = group(g, 0, .92, 0);
  add(hips, new THREE.SphereGeometry(1, 18, 12), pants, 0, -.02, 0).scale.set(.24, .14, .15); add(hips, box(.46, .05, .27), toon(0x111111), 0, .09, 0);   // belt
  add(hips, rbox(.06, .12, .04, .015), toon(0x222222), .2, .02, .12);                                                // radio on the belt
  const torso = group(hips, 0, .1, 0); const chest = add(torso, new THREE.CapsuleGeometry(.2, .26, 6, 18), polo, 0, .28, 0); chest.scale.set(1.25, 1, .78);
  add(torso, new THREE.TorusGeometry(.085, .025, 6, 16), polo, 0, .55, .02).rotation.x = Math.PI / 2;                                                              // collar
  add(torso, box(.1, .03, .01), navy, -.12, .42, .158); add(torso, new THREE.CircleGeometry(.03, 6), gold, .12, .43, .159);       // name patch, badge
  add(torso, box(.012, .2, .006), toon(0xb8b4a8), 0, .45, .158); for (let k = 0; k < 3; k++) add(torso, new THREE.SphereGeometry(.009, 6, 4), toon(0xf0ece0), .02, .5 - k * .06, .16);
  const arms = [-1, 1].map(s => { const a = limb(torso, s * .3, .52, .3, .13, polo, skin, .13, .11); a.j1.children[0].material = polo; a.j2.children[0].material = skin;
    add(a.j1, new THREE.CircleGeometry(.035, 12), navy, s * .068, -.08, 0).rotation.y = s * Math.PI / 2; return a; });                                      // sleeve patch
  const legs = [-1, 1].map(s => { const l = limb(hips, s * .12, -.08, .42, .17, pants, shoe, .09, .17); l.end.children[0].position.set(0, -.03, .06); l.end.children[0].scale.set(.09, .06, .16); return l; });
  const neck = group(torso, 0, .58, 0); add(neck, new THREE.CylinderGeometry(.065, .07, .12, 12), skinC, 0, .04, 0);
  const head = group(neck, 0, .08, 0); add(head, new THREE.SphereGeometry(1, 24, 18), skin, 0, .21, 0).scale.set(.205, .24, .21);
  add(head, new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * .5), hairM, 0, .25, -.012).scale.set(.215, .21, .22);
  add(head, new THREE.SphereGeometry(1, 16, 10), hairM, 0, .2, -.06).scale.set(.2, .17, .16);
  for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(1, 10, 8), skinC, s * .2, .2, 0).scale.set(.03, .055, .04);
  add(head, new THREE.SphereGeometry(1, 12, 8), skinC, 0, .19, .2).scale.set(.024, .028, .022);                    // nose
  if (!o.noCap) { const cap = group(head, 0, .4, -.01); add(cap, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * .5), navy, 0, -.04, 0).scale.set(.225, .13, .23);
    add(cap, new THREE.CylinderGeometry(.226, .226, .05, 20), navy, 0, -.04, 0); const brim = add(cap, new THREE.SphereGeometry(1, 16, 6), navy, 0, -.065, .2); brim.scale.set(.17, .015, .11); add(cap, new THREE.CircleGeometry(.03, 6), gold, 0, .0, .213).rotation.x = -.35; }
  const F = face(head, skinC, { eyeX: .072, eyeY: .245, z: .186, eyeR: .024, mouthY: .125, mouthW: .08, brow: 0x16110e }); F.mouth.position.z = .188;
  if (o.mustache) add(head, new THREE.CapsuleGeometry(.013, .08, 4, 8), hairM, 0, .145, .2).rotation.z = Math.PI / 2;
  return { g, hips, torso, chest, neck, head, arms, legs, ...F, kind: 'guard' };
}

export function girl() {
  const g = new THREE.Group();
  const gown = toon(0xffffff, { map: paintTex(0xd8d6cc, { seed: 31, n: 500, spread: .05, len: 16, ang: Math.PI / 2, fn: (c, w, h) => { const r = c.createLinearGradient(0, h, 0, h * .55); r.addColorStop(0, 'rgba(40,34,30,.55)'); r.addColorStop(1, 'rgba(40,34,30,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); } }) });
  const skin = toon(0xffffff, { map: paintTex(0xb8b4ac, { seed: 32, n: 260, spread: .04, len: 10 }) }), skinC = toon(0xa9a49c), hairM = toon(0x0a0808);
  const hips = group(g, 0, .55, 0);
  const body = add(hips, new THREE.CylinderGeometry(.13, .24, .62, 14, 1, true), gown, 0, .05, 0); body.material.side = THREE.DoubleSide;
  const torso = group(hips, 0, .3, 0); add(torso, new THREE.SphereGeometry(1, 16, 12), gown, 0, .06, 0).scale.set(.14, .13, .1);
  const arms = [-1, 1].map(s => { const a = limb(torso, s * .15, .14, .21, .062, skin, skin, .07, .06); return a; });
  arms.forEach(a => a.j1.children[0].scale.set(1, 1, 1));
  const legs = [-1, 1].map(s => { const l = limb(hips, s * .06, -.18, .2, .065, skin, skinC, .05, .07); l.end.children[0].position.set(0, -.02, .03); l.end.children[0].scale.set(.035, .025, .06); return l; });
  const neck = group(torso, 0, .17, 0); add(neck, new THREE.CylinderGeometry(.03, .035, .08, 10), skin, 0, .03, 0);
  const head = group(neck, 0, .05, 0); add(head, new THREE.SphereGeometry(1, 22, 16), skin, 0, .15, 0).scale.set(.13, .155, .125);
  // the face: hollow dark eyes (no whites), a tiny glint each, a mouth that can grin far too wide
  const ink = toon(0x050404), eyes = [];
  for (const s of [-1, 1]) { const e = group(head, s * .05, .17, .112); add(e, new THREE.SphereGeometry(.05, 14, 10), toon(0x3a3430), 0, -.004, -.004).scale.set(1.1, 1.2, .4); add(e, new THREE.SphereGeometry(.037, 12, 8), ink, 0, 0, .004).scale.set(1.1, 1.35, .45);
    add(e, new THREE.SphereGeometry(.004, 6, 4), toon(0xffffff, { emis: 1.2 }), .008, .01, .012); eyes.push(e); }
  const mouth = group(head, 0, .085, .117); const flat = add(mouth, box(.04, .008, .01), toon(0x2a1414), 0, 0, 0);
  const grin = add(mouth, new THREE.TorusGeometry(.052, .013, 6, 28, Math.PI * .96), ink, 0, .018, 0); grin.rotation.z = Math.PI * 1.04; grin.visible = false;
  // hair: a cap and long strands, the front ones hang over the face; each strand has two joints so it can sway; part (0..1) sweeps the front ones aside
  add(head, new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * .5), hairM, 0, .205, -.012).scale.set(.136, .115, .13);
  const strands = [];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2, front = Math.cos(a) > .45, len = front ? .3 : .44 + .1 * hash(i);
    const root = group(head, Math.sin(a) * .128, .24, Math.cos(a) * (front ? .112 : .128)); root.rotation.y = a;
    const s1 = group(root, 0, 0, 0); add(s1, box(.03 + .015 * hash(i * 2), len * .52, .008), hairM, 0, -len * .26, .01, false);
    const s2 = group(s1, 0, -len * .5, 0); add(s2, box(.026, len * .56, .007), hairM, 0, -len * .27, .008, false);
    strands.push({ root, s1, s2, front, a, side: Math.sin(a), i });
  }
  return { g, hips, torso, neck, head, arms, legs, eyes, mouth, flat, grin, strands, kind: 'girl', part: 0, wind: 0 };
}

// ---- motion: every pose comes from t and a few knobs, so any frame can be rendered alone ----
export function breathe(p, t, rate = .26, amt = 1, k = 0) {   // chest rises, shoulders lift a little, the head bobs
  const b = Math.sin(t * Math.PI * 2 * rate + k); p.chest && p.chest.scale.set(1 + .012 * amt * b, 1 + .018 * amt * b, 1 + .03 * amt * b);
  p.torso.position.y = (p.kind === 'girl' ? .3 : .1) + .006 * amt * b; p.arms.forEach((a, i) => a.j1.rotation.z += (i ? -1 : 1) * .012 * amt * b); return b;
}
export function blink(p, t, period = 3.7, k = 0, force = -1) {   // quick lid closes at seeded times, or held shut with force 0..1
  let c = 0; const n = Math.floor((t + k) / period), u = (t + k) - n * period - (period * .6 * hash(n + k * 13));
  if (u > 0 && u < .16) c = Math.sin(u / .16 * Math.PI);
  if (force >= 0) c = Math.max(c, force);
  p.lids && p.lids.forEach(l => { l.rotation.x = lerp(-1.75, -.08, c); });
}
export function tremble(p, t, amt) {   // a fine tremor in hands and arms (fear), sum of fast sines
  p.arms.forEach((a, i) => { a.j2.rotation.x += amt * .05 * Math.sin(t * 37 + i * 2) + amt * .03 * Math.sin(t * 23.7 + i); a.end.rotation.z += amt * .06 * Math.sin(t * 41 + i * 3); });
  p.head.rotation.z += amt * .006 * Math.sin(t * 29);
}
export function seat(p, lean = 0) {   // sitting on a chair: thighs forward, shins down
  p.legs.forEach((l, i) => { l.j1.rotation.set(-1.5, 0, (i ? -1 : 1) * .05); l.j2.rotation.set(1.45, 0, 0); });
  p.torso.rotation.x = lean;
}
export function stand(p) { p.legs.forEach(l => { l.j1.rotation.set(0, 0, 0); l.j2.rotation.set(0, 0, 0); }); p.torso.rotation.set(0, 0, 0); }
export function resetArms(p) { p.arms.forEach((a, i) => { a.j1.rotation.set(0, 0, (i ? -1 : 1) * .06); a.j2.rotation.set(0, 0, 0); a.end.rotation.set(0, 0, 0); }); p.head.rotation.set(0, 0, 0); p.neck.rotation.set(0, 0, 0); }
export function setArm(a, sx, sy, sz, el, ex = 0) { a.j1.rotation.set(sx, sy, sz); a.j2.rotation.set(el, 0, ex); }
export function grin(p, u) { p.grin.visible = u > .02; p.flat.visible = u < .5; p.grin.scale.set(lerp(.4, p.kind === 'girl' ? 2.5 : 2.6, ss(u)), lerp(.3, p.kind === 'girl' ? 1.5 : 1.6, ss(u)), 1); }
// the girl's hair: it hangs and sways in a wind that isn't there; part pulls the front strands aside so the face shows
export function hair(p, t, wind = 0, part = 0) {
  const hx = p.head.rotation.x;
  for (const s of p.strands) {
    const w = wind * (.1 * Math.sin(t * 1.3 + s.i * .7) + .06 * Math.sin(t * 2.9 + s.i * 1.9)), c = Math.cos(s.a);
    // hang outward a little (a bell of hair), keep hanging down when the head tilts, and sweep the front ones aside by part
    s.s1.rotation.x = -.05 + (s.front ? 0 : hx * c * .8) + w; s.s2.rotation.x = .02 + w * .8;
    s.s1.rotation.z = (s.front ? part * Math.sign(s.side || .01) * (.3 + .25 * Math.abs(c)) : 0) + w * .3; s.s2.rotation.z = w * .4;
  }
}

