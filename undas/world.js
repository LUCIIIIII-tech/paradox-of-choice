// The four sets, each its own THREE.Scene: EXT (the old hospital at night), LOBBY (lobby + stairs + the guard house with its four CCTV monitors),
// HALL (the burnt third-floor pediatric corridor), HOME (the guard's room, years later). Each set returns its scene, its lights and an update(t).
import * as THREE from 'three';
import { add, group, box, rbox, toon, std, basic, ctex, brush, grime, paintTex, txt, hash, dust, fogSheets, wisps, softDot, puff, clamp, ss, seg, lerp } from './kit.js';

const wallTex = (base, seed, o = {}) => ctex(512, 512, (g, w, h) => { brush(g, w, h, base, 700, .06, 30, 0, seed); grime(g, w, h, 4000, .2, seed);
  for (let i = 0; i < (o.stains || 8); i++) { const x = hash(seed + i) * w, r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, 'rgba(60,50,30,0)'); r.addColorStop(.6 + .3 * hash(i), 'rgba(70,55,30,.18)'); r.addColorStop(1, 'rgba(40,30,20,.3)'); g.fillStyle = r; g.fillRect(x, 0, 12 + 40 * hash(seed * 3 + i), h); }
  if (o.soot) { const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, 'rgba(8,6,5,.96)'); r.addColorStop(.45, 'rgba(14,10,8,.7)'); r.addColorStop(1, 'rgba(20,14,10,.15)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = hash(seed * 9 + i) * w; g.fillStyle = `rgba(5,4,3,${.3 + .4 * hash(i * 3)})`; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 20 * (hash(i) - .5), h * .4, x + 6, h * (.4 + .5 * hash(i * 7))); g.lineTo(x + 14, 0); g.fill(); }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(200,190,160,.25)'; const x = hash(seed * 5 + i) * w, y = h * (.5 + .5 * hash(i * 11)); g.beginPath(); g.ellipse(x, y, 20 + 30 * hash(i), 8 + 10 * hash(i * 2), hash(i) * 3, 0, 7); g.fill(); } } }, o.rx || 1, o.ry || 1);
const tileTex = (a, b, n, seed, rx, ry) => ctex(512, 512, (g, w, h) => { const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); }
  brush(g, w, h, 0x000000, 0); grime(g, w, h, 9000, .22, seed); g.strokeStyle = 'rgba(10,8,6,.35)'; g.lineWidth = 2; for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s, h); g.stroke(); g.beginPath(); g.moveTo(0, k * s); g.lineTo(w, k * s); g.stroke(); } }, rx, ry);

// ======================= EXT: the hospital at night =======================
export function makeExt() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x070a12); S.fog = new THREE.FogExp2(0x0c1220, .028);
  const moonL = new THREE.DirectionalLight(0x9db4e8, 2.6); moonL.position.set(18, 30, 10); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); Object.assign(moonL.shadow.camera, { left: -25, right: 25, top: 30, bottom: -5, far: 80 }); S.add(moonL); S.add(moonL.target); moonL.target.position.set(0, 0, -25);
  S.add(new THREE.HemisphereLight(0x3a4a70, 0x0a0806, .5));
  const sky = new THREE.Mesh(new THREE.SphereGeometry(110, 24, 12), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: ctex(16, 256, (g, w, h) => { const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, '#020308'); r.addColorStop(.42, '#0a1124'); r.addColorStop(.5, '#1a2238'); r.addColorStop(.52, '#0a0c10'); r.addColorStop(1, '#050505'); g.fillStyle = r; g.fillRect(0, 0, w, h); }) })); S.add(sky);
  const ground = add(S, new THREE.PlaneGeometry(120, 120), toon(0xffffff, { map: paintTex(0x2a2c2a, { seed: 3, n: 1400, len: 26, grime: 3000, rx: 20, ry: 20 }) }), 0, 0, -20); ground.rotation.x = -Math.PI / 2;
  const road = add(S, new THREE.PlaneGeometry(120, 7), toon(0x1a1b1e), 0, .01, 3); road.rotation.x = -Math.PI / 2;
  for (let i = -12; i < 12; i++) { const d = add(S, new THREE.PlaneGeometry(1.4, .14), toon(0x8a8670), i * 4, .02, 3); d.rotation.x = -Math.PI / 2; }
  // the building: 8 floors, window grid; the third floor charred, soot climbing above its windows
  const FL = 8, FH = 3.2, BW = 30, Z = -30;
  const facade = ctex(1024, 1024, (g, w, h) => { brush(g, w, h, 0x8c8676, 1800, .06, 30, 0, 9); grime(g, w, h, 12000, .25, 9);
    const cols = 12, cw = w / cols, rh = h / FL;
    for (let f = 0; f < FL; f++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * .2, y = h - (f + 1) * rh + rh * .22, ww = cw * .6, hh = rh * .52;
      const lit = f === 0 && (c === 7 || c === 8) ? 'rgba(200,190,120,.9)' : f === 0 && c > 3 && c < 8 ? 'rgba(60,70,60,.9)' : f === 2 ? '#050403' : `rgba(${14 + 20 * hash(f * 31 + c)},${18 + 20 * hash(f * 31 + c)},${26 + 24 * hash(f * 31 + c)},1)`;
      g.fillStyle = lit; g.fillRect(x, y, ww, hh); g.strokeStyle = 'rgba(30,28,24,.8)'; g.lineWidth = 4; g.strokeRect(x, y, ww, hh); g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + hh); g.stroke();
      if (f === 2) { const r = g.createLinearGradient(0, y + hh, 0, y - rh * 1.4); r.addColorStop(0, 'rgba(6,5,4,.9)'); r.addColorStop(1, 'rgba(6,5,4,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(x - 8, y + 4); g.quadraticCurveTo(x + ww / 2, y - rh * (1 + .6 * hash(c)), x + ww + 8, y + 4); g.fill(); }
      if (f > 3 && hash(f * 7 + c) > .8) { g.fillStyle = 'rgba(20,18,14,.6)'; g.fillRect(x, y, ww, hh * .4); } }
    for (let i = 0; i < 30; i++) { const x = hash(i * 4) * w; g.fillStyle = 'rgba(30,26,20,.25)'; g.fillRect(x, 0, 3 + 8 * hash(i), h); } });
  const bld = group(S, 0, 0, Z); add(bld, box(BW, FL * FH, 14), [toon(0x5a564c), toon(0x5a564c), toon(0x48443c), toon(0x48443c), toon(0xffffff, { map: facade }), toon(0x5a564c)], 0, FL * FH / 2, 0);
  for (let f = 1; f <= FL; f++) add(bld, box(BW + .4, .18, .5), toon(0x6a665a), 0, f * FH, 7.1);   // floor ledges
  add(bld, box(10, .3, 4), toon(0x3a3830), 1, 3.6, 9); for (const s of [-1, 1]) add(bld, box(.25, 3.6, .25), toon(0x3a3830), 1 + s * 4.6, 1.8, 10.8);   // entrance canopy
  const signT = ctex(1024, 192, (g, w, h) => { g.fillStyle = '#1a1c1a'; g.fillRect(0, 0, w, h); txt(g, 'OSPITAL', w / 2, h / 2 + 6, 140, '#c8d0b8'); });
  const sign = add(bld, box(7, 1.2, .2), std(0xffffff, .6, { map: signT, emis: .35, emisMap: signT }), 1, 4.4, 10.9);
  const lobbyGlow = new THREE.PointLight(0xd8c890, 6, 14, 1.6); lobbyGlow.position.set(4, 2, 9); bld.add(lobbyGlow);
  // gate and fence
  const iron = toon(0x141414); for (let x = -26; x <= 26; x += .5) { if (Math.abs(x - 1) < 3.2) continue; add(S, box(.05, 2.4, .05), iron, x, 1.2, -12); }
  add(S, box(52, .08, .08), iron, 0, 2.3, -12); add(S, box(52, .08, .08), iron, 0, .3, -12);
  for (const s of [-1, 1]) { const leaf = group(S, 1 + s * 3.2, 0, -12, s * .6); for (let x = 0; x <= 3; x += .3) add(leaf, box(.05, 2.6, .05), iron, -s * x, 1.3, 0); add(leaf, box(3.1, .08, .08), iron, -s * 1.55, 2.5, 0); add(leaf, box(3.1, .08, .08), iron, -s * 1.55, .3, 0); }
  for (const s of [-1, 1]) add(S, box(.6, 3, .6), toon(0x6a665a), 1 + s * 3.5, 1.5, -12);
  // street lamp (sodium), a cone of light with dust in it
  const lamp = group(S, 7, 0, -9); add(lamp, new THREE.CylinderGeometry(.08, .12, 6, 8), iron, 0, 3, 0); add(lamp, box(1.4, .08, .08), iron, -.6, 6, 0);
  const bulb = add(lamp, new THREE.SphereGeometry(.16, 12, 8), basic(0xffb45a, { opacity: 1 }), -1.2, 5.85, 0, false);
  const sodium = new THREE.SpotLight(0xffa04a, 60, 22, .7, .6, 1.6); sodium.position.set(-1.2, 5.8, 0); sodium.target.position.set(-1.6, 0, 0); sodium.castShadow = true; sodium.shadow.mapSize.set(512, 512); lamp.add(sodium); lamp.add(sodium.target);
  const cone = add(lamp, new THREE.ConeGeometry(2.6, 5.8, 32, 1, true), basic(0xffa860, { opacity: .07, add: true, side: THREE.DoubleSide }), -1.3, 2.9, 0, false);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: 0xffa860, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(2.2, 2.2, 1); glow.position.set(-1.2, 5.85, 0); lamp.add(glow);
  const lampDust = dust(S, 260, 4, 6, 4, 5.6, 0, -9, .05, 0xffc890, .55);
  // the moon behind drifting cloud, stars
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(256, 256, (g, w, h) => { g.fillStyle = '#e8ecf4'; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.fill(); brush(g, 0, 0, 0); for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(150,160,180,${.15 + .2 * hash(i)})`; g.beginPath(); g.arc(128 + (hash(i) - .5) * 160, 128 + (hash(i * 3) - .5) * 160, 6 + 18 * hash(i * 5), 0, 7); g.fill(); } g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.fill(); }), transparent: true, fog: false }));
  moon.scale.set(7, 7, 1); moon.position.set(6, 56, -72); S.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: 0x8aa0d0, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); halo.scale.set(30, 30, 1); halo.position.copy(moon.position); S.add(halo);
  const clouds = []; for (let i = 0; i < 9; i++) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, color: 0x3a4460, transparent: true, opacity: .55, depthWrite: false, fog: false })); c.scale.set(26 + 14 * hash(i), 9 + 4 * hash(i * 2), 1); S.add(c); clouds.push([c, i]); }
  const starG = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 300; i++) sp.push((hash(i) - .5) * 200, 20 + 60 * hash(i * 3), -70 - 10 * hash(i * 5)); starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  S.add(new THREE.Points(starG, new THREE.PointsMaterial({ size: .25, color: 0xc8d4ff, transparent: true, opacity: .6, fog: false })));
  // trees: acacia silhouettes whose canopies sway
  const trees = []; const leafM = toon(0xffffff, { map: paintTex(0x18221c, { seed: 21, n: 600, len: 14, spread: .1 }) }), bark = toon(0x16120e);
  for (const [x, z, s] of [[-12, -14, 1.3], [-17, -8, 1.6], [14, -15, 1.2], [19, -7, 1.7], [-22, -18, 1.1], [24, -19, 1.2]]) {
    const tr = group(S, x, 0, z); add(tr, new THREE.CylinderGeometry(.25 * s, .4 * s, 5 * s, 8), bark, 0, 2.5 * s, 0); const top = group(tr, 0, 5 * s, 0);
    for (let k = 0; k < 7; k++) { const b = group(top, 0, 0, 0, k * .9); add(b, new THREE.CylinderGeometry(.06 * s, .12 * s, 2.2 * s, 6), bark, 0, .8 * s, .5 * s).rotation.x = .7;
      add(b, new THREE.SphereGeometry(1.4 * s, 10, 8), leafM, 0, 1.6 * s + .4 * hash(k), 1.2 * s + .3 * hash(k * 2)).scale.set(1.3, .6, 1.1); }
    trees.push([top, x]); }
  const fog = fogSheets(S, 4, 90, 60, .25, 0x8090a8, .16, 4);
  return { S, moon, sodium, lampDust, fog, update(t) {
    lampDust.update(t); fog.update(t);
    clouds.forEach(([c, i]) => { c.position.set(-40 + ((t * (.25 + .15 * hash(i)) + hash(i * 7) * 80) % 80), 30 + 14 * hash(i * 9), -55); });
    halo.material.opacity = .45 + .1 * Math.sin(t * .3);
    trees.forEach(([top, x], i) => { top.rotation.z = .025 * Math.sin(t * .7 + i) + .015 * Math.sin(t * 1.9 + i * 2); top.rotation.x = .02 * Math.sin(t * .5 + i * 3); });
  } };
}

// ======================= LOBBY + GUARD HOUSE =======================
export function makeLobby() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x050608); S.fog = new THREE.FogExp2(0x080a0c, .04);
  const R = { S };
  const floorT = tileTex('#7a7868', '#5e5c50', 8, 2, 4, 4), wallT = wallTex(0xb8b294, 4, { rx: 4, ry: 1 }), ceilT = wallTex(0x8a8670, 5);
  const floor = add(S, new THREE.PlaneGeometry(18, 18), std(0xffffff, .35, { map: floorT }), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
  const ceil = add(S, new THREE.PlaneGeometry(18, 18), toon(0xffffff, { map: ceilT }), 0, 4.2, 0); ceil.rotation.x = Math.PI / 2;
  const wm = toon(0xffffff, { map: wallT }), wainM = toon(0x3e4a40);
  for (const [x, z, ry, len] of [[0, -8, 0, 18], [-8, 0, Math.PI / 2, 18], [8, 0, -Math.PI / 2, 18]]) { const w = group(S, x, 0, z, ry); add(w, new THREE.PlaneGeometry(len, 4.2), wm, 0, 2.1, 0, false); add(w, new THREE.PlaneGeometry(len, 1.1), wainM, 0, .55, .01, false); }
  // the front: glass doors to the night (moonlight comes through)
  const front = group(S, 0, 0, 8, Math.PI); add(front, new THREE.PlaneGeometry(18, 1.2), wm, 0, 3.6, 0, false);
  for (const x of [-8, -5, 5, 8]) add(front, new THREE.PlaneGeometry(x > 0 ? 3 : 3, 3), wm, x > 0 ? x - 1.5 : x + 1.5, 1.5, 0, false);
  add(front, new THREE.PlaneGeometry(10, 3), std(0x24304a, .05, { opacity: .5, emis: .25, emisColor: 0x1a2440 }), 0, 1.5, .02, false);
  for (let x = -5; x <= 5; x += 2.5) add(front, box(.08, 3, .08), toon(0x222222), x, 1.5, 0);
  const moonIn = new THREE.SpotLight(0x7d96d8, 40, 24, .8, .7, 1.5); moonIn.position.set(2, 5, 12); moonIn.target.position.set(0, 0, 2); moonIn.castShadow = true; moonIn.shadow.mapSize.set(1024, 1024); S.add(moonIn, moonIn.target); R.moonIn = moonIn;
  S.add(new THREE.HemisphereLight(0x405060, 0x0a0806, .32));
  // one tired fluorescent tube over the waiting chairs; an EXIT sign; posters
  const tube = add(S, box(.16, .05, 1.3), basic(0xd8f0e0, { opacity: 1 }), -3, 4.15, 3, false);
  const fluo = new THREE.PointLight(0xc8e8d8, 5, 9, 1.6); fluo.position.set(-3, 3.9, 3); S.add(fluo); R.fluo = fluo; R.tube = tube;
  const exitT = ctex(256, 96, (g, w, h) => { g.fillStyle = '#0a5a2a'; g.fillRect(0, 0, w, h); txt(g, 'EXIT', w / 2, h / 2 + 4, 66, '#d8ffe0'); });
  add(S, box(.7, .25, .06), std(0xffffff, .5, { map: exitT, emis: 1.4, emisMap: exitT }), -5, 3.5, -7.95, false);
  const exitL = new THREE.PointLight(0x40ff80, 1.4, 4, 2); exitL.position.set(-5, 3.3, -7.6); S.add(exitL);
  const posT = (s, c) => ctex(256, 360, (g, w, h) => { brush(g, w, h, c, 300, .1, 16); txt(g, s, w / 2, 80, 40, '#1a1a1a'); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(20,20,20,.5)'; g.fillRect(30, 140 + i * 30, 196 * (.5 + .5 * hash(i)), 10); } grime(g, w, h, 1500, .3); });
  for (const [x, s, c] of [[-1.5, 'MAGHUGAS NG KAMAY', 0xd8d0b0], [.5, 'BAWAL MANIGARILYO', 0xd0b8a8]]) add(S, new THREE.PlaneGeometry(.8, 1.1), toon(0xffffff, { map: posT(s, c) }), x, 2.2, -7.97, false);
  const chairM = toon(0x3a5a6a); for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const c = group(S, -5.5 + i * .62, 0, 2 + r * 1.6, Math.PI); add(c, rbox(.5, .06, .45, .02), chairM, 0, .45, 0); add(c, rbox(.5, .5, .06, .02), chairM, 0, .72, -.2); add(c, box(.04, .45, .04), toon(0x222222), 0, .22, 0); }
  // stairs up (left back): 16 steps, a rail; the girl comes down them
  R.stairs = { x: -6.2, z0: -2.0, step: .3, rise: .21, n: 16 };
  const stepM = std(0xffffff, .4, { map: tileTex('#6e6c60', '#68665a', 2, 7, 1, 1) });
  for (let i = 0; i < 16; i++) { add(S, box(2.2, .21, .3), stepM, -6.2, .105 + i * .21, -2.0 - i * .3); }
  add(S, box(2.2, 3.36, 4.8), toon(0x2e2c26), -6.2, 3.36 / 2 - .21, -4.6 - 2.4 + 2.2).visible = false;
  for (let i = 0; i < 9; i++) add(S, box(.04, .9, .04), toon(0x777770), -5.1, .1 + i * .42 + .45, -2 - i * .6);
  { const rail = add(S, box(.06, .06, 5.4), toon(0x888880), -5.1, 0, -4.4); rail.position.y = 2.0; rail.rotation.x = Math.atan2(.21, .3) * -1 + Math.PI * 0; rail.rotation.x = Math.atan(.21 / .3); }
  // the guard house: lower walls all round, glass above on the lobby (west) and entrance (south) sides, a door with glass on the west; desk + monitors on the east wall
  const B = group(S, 3.6, 0, 1.2); R.booth = B; const bw = 2.6, bd = 2.4, bh = 2.5, lowH = 1.0;
  const boothM = toon(0xffffff, { map: wallTex(0xa8a488, 12, { stains: 4 }) }), trimM = toon(0x2a3a34);
  add(B, box(bw, .06, bd), toon(0x2a2824), 0, bh, 0); add(B, box(bw - .1, .02, bd - .1), std(0x4a4a40, .6), 0, .01, 0, false);
  add(B, box(.08, bh, bd), boothM, bw / 2, bh / 2, 0); add(B, box(bw, bh, .08), boothM, 0, bh / 2, -bd / 2);       // east + north walls (solid)
  add(B, box(bw, lowH, .08), boothM, 0, lowH / 2, bd / 2); add(B, box(.08, lowH, bd * .55), boothM, -bw / 2, lowH / 2, -bd * .225);   // south low wall, west low wall (north part)
  const glassM = std(0x9ab0c0, .04, { opacity: .13, metal: .2 }); glassM.depthWrite = false;
  R.glassS = add(B, new THREE.PlaneGeometry(bw, bh - lowH), glassM, 0, lowH + (bh - lowH) / 2, bd / 2, false);
  R.glassW = add(B, new THREE.PlaneGeometry(bd * .55, bh - lowH), glassM, -bw / 2, lowH + (bh - lowH) / 2, -bd * .225, false); R.glassW.rotation.y = -Math.PI / 2;
  for (const [x, z, w, d] of [[0, bd / 2, bw, .05], [-bw / 2, -bd * .225, .05, bd * .55]]) { add(B, box(w, .06, d), trimM, x, lowH, z); add(B, box(w, .06, d), trimM, x, bh - .03, z); }
  const door = group(B, -bw / 2, 0, bd * .05); R.door = door;   // hinge at the north end of the opening; the door is 1.0 wide toward +z
  add(door, box(.06, 2.2, 1.0), boothM, 0, 1.1, .5); const dg = add(door, new THREE.PlaneGeometry(.7, .8), glassM, -.035, 1.6, .5, false); dg.rotation.y = -Math.PI / 2; add(door, box(.07, .82, .72), trimM, 0, 1.6, .5).scale.set(1, 1, 1).constructor;
  door.children[door.children.length - 1].visible = false; add(door, new THREE.SphereGeometry(.035, 8, 6), std(0xb8b8b0, .3, { metal: .8 }), -.05, 1.05, .9);
  // desk, the 4 CRT monitors (2x2) on a shelf, a DVR, logbook, mug with steam, flashlight, radio, rosary, wall clock, calendar, a small fan
  const deskM = toon(0xffffff, { map: paintTex(0x5a3e28, { seed: 14, n: 300, ang: 0, len: 30 }) });
  add(B, box(.7, .06, 2.2), deskM, bw / 2 - .4, .78, -.05); add(B, box(.6, .74, .05), deskM, bw / 2 - .4, .37, -1.1); add(B, box(.6, .74, .05), deskM, bw / 2 - .4, .37, 1.0);
  add(B, box(.5, .05, 1.9), deskM, bw / 2 - .3, 1.42, -.05);
  const crt = toon(0x2c2c2a), bez = toon(0x1a1a1a); R.screens = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const m = group(B, bw / 2 - .32, .81 + r * .66, -.47 + c * .84); m.rotation.y = -Math.PI / 2;
    add(m, rbox(.66, .52, .5, .05), crt, 0, .26, -.18); add(m, rbox(.58, .46, .04, .03), bez, 0, .27, .07);
    const scr = add(m, new THREE.PlaneGeometry(.5, .375), new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false }), 0, .27, .095, false); R.screens.push(scr);
    add(m, new THREE.CylinderGeometry(.012, .012, .01, 8).rotateX(Math.PI / 2), basic(0x40ff60, { opacity: 1 }), .23, .06, .09, false); }
  R.monLight = new THREE.SpotLight(0xb8d0d8, 6, 5, 1.1, .8, 1.4); R.monLight.position.set(bw / 2 - .7, 1.25, -.05); R.monLight.target.position.set(-1, 1.3, 0); R.monLight.castShadow = true; R.monLight.shadow.mapSize.set(512, 512); R.monLight.shadow.bias = -.002; B.add(R.monLight, R.monLight.target);
  add(B, rbox(.4, .08, .3, .02), toon(0x202020), bw / 2 - .45, .85, .55);                                              // DVR
  const book = add(B, box(.3, .03, .42), toon(0x6a2a1e), bw / 2 - .6, .825, -.75); book.rotation.y = .2;
  const mug = group(B, bw / 2 - .62, .81, .2); add(mug, new THREE.CylinderGeometry(.045, .04, .11, 14), toon(0xd8d4c8), 0, .055, 0); add(mug, new THREE.CylinderGeometry(.04, .04, .005, 14), toon(0x2a160c), 0, .1, 0);
  R.steam = wisps(B, 8, bw / 2 - .62, .93, .2, .32, 0xffffff, .14, .06, .02);
  const fl = group(B, bw / 2 - .7, .84, -.3, .5); R.flashDesk = fl; add(fl, new THREE.CylinderGeometry(.03, .03, .26, 12).rotateZ(Math.PI / 2), toon(0x111111), 0, 0, 0); add(fl, new THREE.CylinderGeometry(.045, .032, .07, 12).rotateZ(Math.PI / 2), toon(0x222222), -.15, 0, 0);
  const radio = add(B, rbox(.08, .2, .05, .015), toon(0x1a1a1a), bw / 2 - .55, .91, .75); add(B, new THREE.CylinderGeometry(.006, .006, .15), toon(0x111111), bw / 2 - .55, 1.07, .74);
  const clockT = () => ctex(256, 256, (g, w, h) => { g.fillStyle = '#e8e4d8'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = '#222'; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#222'; g.fillRect(128 + Math.sin(a) * 96 - 3, 128 - Math.cos(a) * 96 - 8, 6, 16); } grime(g, w, h, 600, .2); });
  const clock = group(B, 0, 2.05, -bd / 2 + .05); add(clock, new THREE.CylinderGeometry(.17, .17, .04, 24).rotateX(Math.PI / 2), toon(0xffffff, { map: clockT() }), 0, 0, 0);
  const hand = (l, w) => { const p = group(clock, 0, 0, .03); add(p, box(w, l, .006), toon(0x111111), 0, l / 2 - .02, 0); return p; };
  R.clock = { hr: hand(.09, .014), min: hand(.13, .01), sec: hand(.14, .004) }; R.clock.sec.children[0].material = toon(0xaa2020);
  const cal = ctex(256, 320, (g, w, h) => { g.fillStyle = '#efe8d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#9a2020'; g.fillRect(0, 0, w, 60); txt(g, 'OKTUBRE 2019', w / 2, 32, 34, '#fff'); for (let i = 0; i < 35; i++) { const d = i - 1; if (d < 1 || d > 31) continue; txt(g, String(d), 28 + (i % 7) * 33, 90 + Math.floor(i / 7) * 46, 22, '#333', 'Anton'); if (d === 31) { g.strokeStyle = '#c01818'; g.lineWidth = 4; g.beginPath(); g.arc(28 + (i % 7) * 33, 90 + Math.floor(i / 7) * 46, 18, 0, 7); g.stroke(); } } grime(g, w, h, 800, .2); });
  add(B, new THREE.PlaneGeometry(.32, .4), toon(0xffffff, { map: cal }), -.6, 1.8, -bd / 2 + .05, false);
  const fan = group(B, -1.0, 2.3, -1.0, .7); add(fan, new THREE.CylinderGeometry(.12, .12, .05, 16).rotateX(Math.PI / 2), toon(0x8aa0a8, { opacity: .7 }), 0, 0, 0); R.fanBlades = group(fan, 0, 0, .02); for (let k = 0; k < 3; k++) add(R.fanBlades, box(.04, .2, .005), toon(0x7a9098), 0, .08, 0).parent.children[k].rotation.z = k * 2.09;
  const chair = group(B, .1, 0, -.05, -Math.PI / 2); R.chair = chair; add(chair, rbox(.46, .07, .46, .02), toon(0x2a2a2e), 0, .48, 0); add(chair, rbox(.44, .5, .06, .02), toon(0x2a2a2e), 0, .8, -.22); add(chair, new THREE.CylinderGeometry(.03, .03, .45), toon(0x111111), 0, .23, 0);
  // a framed Sto. Nino picture and a tiny red votive light on the north wall (a real guard house thing)
  const nino = ctex(200, 260, (g, w, h) => { brush(g, w, h, 0x5a1a14, 200, .1, 14); g.fillStyle = '#c8a050'; g.beginPath(); g.ellipse(100, 120, 40, 60, 0, 0, 7); g.fill(); g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(100, 80, 18, 0, 7); g.fill(); g.strokeStyle = '#c8a050'; g.lineWidth = 12; g.strokeRect(0, 0, w, h); });
  add(B, new THREE.PlaneGeometry(.24, .32), toon(0xffffff, { map: nino }), .45, 1.85, -bd / 2 + .05, false);
  const votive = add(B, new THREE.CylinderGeometry(.025, .02, .05, 10), basic(0xff3020, { opacity: .9 }), .45, 1.6, -bd / 2 + .1, false); const vl = new THREE.PointLight(0xff4020, .06, 1.0, 2); vl.position.set(.45, 1.62, -bd / 2 + .15); B.add(vl); R.votive = vl;
  // the CCTV cameras themselves (props on the walls)
  const camProp = (p, x, y, z, ry) => { const c = group(p, x, y, z, ry); add(c, rbox(.12, .1, .22, .02), toon(0xd8d8d0), 0, 0, 0); add(c, new THREE.CylinderGeometry(.03, .03, .02, 10).rotateX(Math.PI / 2), toon(0x111111), 0, 0, .11); add(c, new THREE.SphereGeometry(.008, 6, 4), basic(0xff2020, { opacity: 1 }), .04, .03, .1); return c; };
  camProp(S, -7.6, 3.7, 7.4, Math.PI * .75); camProp(S, -2.8, 3.8, -1.2, -Math.PI * .6); camProp(B, bw / 2 - .1, bh - .15, bd / 2 - .1, -Math.PI * .75);
  // flashlight beam (a held torch): SpotLight + a soft additive cone + dust inside
  R.torch = new THREE.SpotLight(0xfff0d0, 0, 14, .32, .45, 1.4); R.torch.castShadow = true; R.torch.shadow.mapSize.set(1024, 1024); S.add(R.torch, R.torch.target);
  R.beam = add(S, new THREE.ConeGeometry(.9, 6, 32, 1, true).translate(0, -3, 0).rotateX(-Math.PI / 2), basic(0xfff0d8, { opacity: 0, add: true, side: THREE.DoubleSide }), 0, 0, 0, false);
  R.beamDust = dust(S, 420, 5, 3, 7, -3.5, 0, -1, .03, 0xfff4e0, 0);
  R.lobbyDust = dust(S, 300, 12, 4, 12, 0, 0, 0, .025, 0xb8c8e0, .35);
  R.fog = fogSheets(S, 3, 18, 18, .08, 0x8090a0, .06, 7);
  return R;
}

// ======================= HALL: the burnt pediatric corridor (third floor) =======================
export function makeHall() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x030304); S.fog = new THREE.FogExp2(0x0a0a0c, .05);
  const R = { S }; const L = 24, Wd = 3.2, Ht = 3.0;
  const floor = add(S, new THREE.PlaneGeometry(Wd, L), std(0xffffff, .55, { map: tileTex('#4a4840', '#3a3832', 2, 31, 2, 14) }), 0, 0, -L / 2); floor.rotation.x = -Math.PI / 2;
  const ceil = add(S, new THREE.PlaneGeometry(Wd, L), toon(0xffffff, { map: wallTex(0x5a5650, 33, { soot: 1, rx: 1, ry: 6 }) }), 0, Ht, -L / 2); ceil.rotation.x = Math.PI / 2;
  const burnt = toon(0xffffff, { map: wallTex(0x9a9a84, 34, { soot: 1, rx: 6, ry: 1 }) });
  for (const s of [-1, 1]) { const w = add(S, new THREE.PlaneGeometry(L, Ht), burnt, s * Wd / 2, Ht / 2, -L / 2, false); w.rotation.y = -s * Math.PI / 2; }
  add(S, new THREE.PlaneGeometry(Wd, Ht), toon(0xffffff, { map: wallTex(0x8a8a78, 35, { soot: 1 }) }), 0, Ht / 2, -L + .01, false);
  // doors 301..310 along the right wall, some ajar onto darkness; a PEDIA WARD sign hanging crooked
  for (let i = 0; i < 5; i++) { const z = -3 - i * 4.2, d = group(S, Wd / 2 - .02, 0, z, -Math.PI / 2); add(d, box(1.0, 2.2, .05), toon(0x2a2018), 0, 1.1, 0);
    const n = ctex(128, 64, (g, w, h) => { g.fillStyle = '#c8c0a0'; g.fillRect(0, 0, w, h); txt(g, String(301 + i * 2), w / 2, h / 2 + 3, 44, '#222'); grime(g, w, h, 300, .5); }); add(d, new THREE.PlaneGeometry(.22, .11), toon(0xffffff, { map: n }), 0, 1.95, .03, false);
    if (i % 2) { d.children[0].visible = false; add(d, new THREE.PlaneGeometry(1, 2.2), basic(0x000000, { opacity: 1, depthWrite: true }), 0, 1.1, -.02, false); add(d, box(1.0, 2.2, .05), toon(0x2a2018), -.45, 1.1, .45).rotation.y = 1.1; } }
  const pedT = ctex(512, 128, (g, w, h) => { g.fillStyle = '#d8d0b0'; g.fillRect(0, 0, w, h); txt(g, 'PEDIA WARD', w / 2, h / 2 + 5, 80, '#222'); const r = g.createLinearGradient(0, 0, w, 0); r.addColorStop(0, 'rgba(10,8,6,.85)'); r.addColorStop(.6, 'rgba(10,8,6,.2)'); r.addColorStop(1, 'rgba(10,8,6,.7)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const ped = add(S, new THREE.PlaneGeometry(1.0, .25), toon(0xffffff, { map: pedT, side: THREE.DoubleSide }), -.3, 2.8, -10, false); ped.rotation.z = .12;
  // barred windows on the left wall: moonlight shafts with dust
  R.shafts = []; for (let i = 0; i < 4; i++) { const z = -2.5 - i * 5; const win = group(S, -Wd / 2 + .01, 0, z, Math.PI / 2);
    add(win, new THREE.PlaneGeometry(1.2, 1.3), basic(0x30406a, { opacity: 1, depthWrite: true }), 0, 1.8, 0, false); for (let b = -2; b <= 2; b++) add(win, box(.03, 1.3, .03), toon(0x111111), b * .24, 1.8, .02);
    }
  const moonA = new THREE.SpotLight(0x6a80c8, 18, 16, .9, .8, 1.4); moonA.position.set(-3.5, 3.2, -6); moonA.target.position.set(1, 0, -7); moonA.castShadow = true; moonA.shadow.mapSize.set(512, 512); S.add(moonA, moonA.target);
  const moonB = moonA.clone(); moonB.position.set(-3.5, 3.2, -16); moonB.target.position.set(1, 0, -17); S.add(moonB, moonB.target);
  S.add(new THREE.HemisphereLight(0x303848, 0x050404, .12));
  // props: rusted beds, a wheelchair, an IV pole, a fallen chair, a teddy bear, papers, children's drawings, fallen ceiling tiles
  const metal = std(0x5a5852, .7, { metal: .5 }), rust = toon(0x4a3426), matt = toon(0xffffff, { map: paintTex(0x8a8070, { seed: 41, grime: 800, fn: (g, w, h) => { g.fillStyle = 'rgba(10,8,6,.6)'; g.beginPath(); g.ellipse(w * .6, h * .4, 60, 40, .4, 0, 7); g.fill(); } }) });
  const bed = (x, z, ry) => { const b = group(S, x, 0, z, ry); add(b, box(.9, .06, 1.9), metal, 0, .55, 0); add(b, rbox(.85, .14, 1.8, .05), matt, 0, .65, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(b, box(.04, .55, .04), rust, sx * .42, .27, sz * .9); add(b, box(.9, .5, .04), metal, 0, .85, -.95); return b; };
  bed(-.9, -4.5, .1); bed(.95, -9.5, -.15).rotation.z = .04; bed(-.85, -14, .3);
  const wc = group(S, .7, 0, -12, -.6); for (const s of [-1, 1]) { add(wc, new THREE.TorusGeometry(.28, .02, 6, 20), metal, s * .25, .3, 0).rotation.y = Math.PI / 2; } add(wc, box(.48, .04, .45), toon(0x2a2a2a), 0, .5, 0); add(wc, box(.48, .45, .04), toon(0x2a2a2a), 0, .75, -.22); R.wheelchair = wc;
  const iv = group(S, -1.1, 0, -7.5); add(iv, new THREE.CylinderGeometry(.015, .015, 1.9), metal, 0, .95, 0); add(iv, box(.3, .02, .02), metal, 0, 1.9, 0); add(iv, rbox(.08, .14, .03, .01), std(0xc8d0d0, .2, { opacity: .5 }), .1, 1.8, 0);
  const ch = group(S, .4, 0, -17, 1.2); add(ch, box(.42, .04, .42), rust, 0, .2, 0).rotation.z = 1.2; add(ch, box(.42, .42, .04), rust, .2, .2, 0).rotation.x = .3;
  const bear = group(S, -.6, 0, -19.5, .7); const fur = toon(0x6a5440); add(bear, new THREE.SphereGeometry(.12, 12, 10), fur, 0, .12, 0); add(bear, new THREE.SphereGeometry(.09, 12, 10), fur, 0, .3, .02); for (const s of [-1, 1]) { add(bear, new THREE.SphereGeometry(.035, 8, 6), fur, s * .07, .38, 0); add(bear, new THREE.SphereGeometry(.05, 8, 6), fur, s * .1, .05, .08); }
  add(bear, new THREE.SphereGeometry(.012, 6, 4), toon(0x050505), -.03, .32, .09); bear.rotation.z = .5;
  for (let i = 0; i < 40; i++) { const p = add(S, new THREE.PlaneGeometry(.21, .28), toon(hash(i) > .5 ? 0xb8b098 : 0x8a8270), (hash(i * 3) - .5) * 2.8, .005 + i * .0002, -1 - hash(i * 7) * 21, false); p.rotation.set(-Math.PI / 2, 0, hash(i) * 6); }
  for (let i = 0; i < 9; i++) { const t = add(S, box(.6, .02, .6), toon(0x5a5650), (hash(i * 5) - .5) * 2.4, .02, -2 - hash(i * 9) * 19); t.rotation.set(.1 * hash(i), hash(i) * 3, .15 * hash(i * 2)); }
  const draw = k => ctex(256, 200, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.lineWidth = 5; g.lineCap = 'round';
    g.strokeStyle = '#d8a020'; g.beginPath(); g.arc(200, 40, 22, 0, 7); g.stroke(); g.strokeStyle = '#2a6a2a'; g.beginPath(); g.moveTo(0, 170); g.lineTo(w, 165); g.stroke();
    g.strokeStyle = '#a02020'; g.strokeRect(40, 90, 70, 70); g.beginPath(); g.moveTo(35, 92); g.lineTo(75, 55); g.lineTo(115, 92); g.stroke();
    const fig = (x, s) => { g.strokeStyle = '#203a8a'; g.beginPath(); g.arc(x, 110 - 30 * s, 10 * s, 0, 7); g.moveTo(x, 120 - 20 * s); g.lineTo(x, 150); g.moveTo(x - 14 * s, 130); g.lineTo(x + 14 * s, 130); g.moveTo(x, 150); g.lineTo(x - 10, 168); g.moveTo(x, 150); g.lineTo(x + 10, 168); g.stroke(); };
    fig(140, 1.3); fig(170, 1.2); fig(196, .8 + .2 * k); txt(g, ['MAMA', 'AKO', 'BAHAY'][k % 3], 60, 30, 26, '#333', 'Caveat');
    const r = g.createRadialGradient(w * hash(k), h * hash(k * 2), 10, w / 2, h / 2, 200); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(.6, 'rgba(30,20,10,.5)'); r.addColorStop(1, 'rgba(5,4,3,.95)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, d = add(S, new THREE.PlaneGeometry(.42, .33), toon(0xffffff, { map: draw(i) }), s * (Wd / 2 - .015), 1.35 + .2 * hash(i), -2 - i * 3.3, false); d.rotation.y = -s * Math.PI / 2; d.rotation.z = (hash(i) - .5) * .2; }
  // the bulb at the end, on its cord: dead, then glows on (slowly)
  const cord = add(S, new THREE.CylinderGeometry(.006, .006, .6), toon(0x111111), 0, Ht - .3, -21.6, false);
  R.bulb = add(S, new THREE.SphereGeometry(.06, 12, 10), basic(0x332a1e, { opacity: 1, depthWrite: true }), 0, Ht - .65, -21.6, false);
  R.bulbL = new THREE.PointLight(0xffc880, 0, 7, 1.5); R.bulbL.position.set(0, Ht - .72, -21.6); R.bulbL.castShadow = true; R.bulbL.shadow.mapSize.set(512, 512); S.add(R.bulbL);
  R.bulbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: 0xffc070, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); R.bulbGlow.scale.set(.7, .7, 1); R.bulbGlow.position.copy(R.bulbL.position); S.add(R.bulbGlow);
  R.dust = dust(S, 500, 3, 3, 22, 0, 0, -11, .022, 0xc8d0e0, .4); R.haze = fogSheets(S, 3, Wd, L, .1, 0x707888, .07, 9); R.haze.sheets.forEach(([m]) => m.position.z = -L / 2);
  R.spot = new THREE.Vector3(0, 0, -22.9);   // where the girl (and later the guard) stands, facing the end wall
  return R;
}

// ======================= HOME: years later, the guard's room at 3 AM =======================
export function makeHome() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x040508); S.fog = new THREE.FogExp2(0x06070a, .06);
  const R = { S };
  const floor = add(S, new THREE.PlaneGeometry(8, 8), toon(0xffffff, { map: paintTex(0x3a2a1e, { seed: 51, n: 600, len: 40, ang: 0, rx: 3, ry: 3 }) }), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
  const wm = toon(0xffffff, { map: wallTex(0x7a8a8a, 52, { rx: 2 }) }); for (const [x, z, ry] of [[0, -3, 0], [-3, 0, Math.PI / 2], [3, 0, -Math.PI / 2]]) add(S, new THREE.PlaneGeometry(8, 3), wm, x, 1.5, z, false).rotation.y = ry;
  const win = group(S, -1.2, 0, -2.98); add(win, new THREE.PlaneGeometry(1.1, 1.2), basic(0x2a3a6a, { opacity: 1, depthWrite: true }), 0, 1.7, 0, false); for (let b = -1; b <= 1; b++) add(win, box(.03, 1.2, .03), toon(0x111111), b * .36, 1.7, .02);
  R.curtains = [-1, 1].map(s => { const c = group(S, -1.2 + s * .62, 2.35, -2.9); add(c, new THREE.PlaneGeometry(.5, 1.5, 1, 6), toon(0xffffff, { map: paintTex(0x5a3a3a, { seed: 53 + s, n: 300, ang: Math.PI / 2 }), side: THREE.DoubleSide }), 0, -.75, 0, false); return c; });
  const moon = new THREE.SpotLight(0x7088d0, 14, 10, .6, .7, 1.4); moon.position.set(-1.6, 2.6, -4.5); moon.target.position.set(.4, 0, 0); moon.castShadow = true; moon.shadow.mapSize.set(512, 512); S.add(moon, moon.target);
  S.add(new THREE.HemisphereLight(0x303850, 0x050404, .15));
  const table = group(S, .4, 0, -.4); const wood = toon(0xffffff, { map: paintTex(0x4a3020, { seed: 55, n: 300, len: 30 }) }); add(table, box(1.0, .05, .6), wood, 0, .72, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(table, box(.05, .72, .05), wood, sx * .45, .36, sz * .25);
  const bed = group(S, -1.6, 0, .8); add(bed, box(1.3, .4, 2.0), toon(0x2a2422), 0, .2, 0); add(bed, rbox(1.25, .18, 1.95, .06), toon(0x4a5a6a), 0, .48, 0); add(bed, rbox(.5, .12, .3, .05), toon(0xc8c4b8), 0, .62, -.8);
  // the old phone lying on the table; its screen is a canvas redrawn per frame; it lights the ceiling and whoever looks at it
  const ph = group(S, .45, .75, -.35, .25); R.phone = ph; add(ph, rbox(.09, .012, .18, .008), toon(0x111111), 0, 0, 0);
  R.phoneCanvas = document.createElement('canvas'); R.phoneCanvas.width = 270; R.phoneCanvas.height = 540; R.phoneTex = new THREE.CanvasTexture(R.phoneCanvas); R.phoneTex.colorSpace = THREE.SRGBColorSpace;
  R.phoneScr = add(ph, new THREE.PlaneGeometry(.08, .16), new THREE.MeshBasicMaterial({ map: R.phoneTex, toneMapped: false, transparent: true }), 0, .007, 0, false); R.phoneScr.rotation.x = -Math.PI / 2;
  R.phoneL = new THREE.PointLight(0xb8d8ff, 0, 3, 1.6); R.phoneL.position.set(.45, .95, -.35); S.add(R.phoneL);
  R.dust = dust(S, 200, 3, 2.5, 3, 0, 0, 0, .02, 0xb8c8e8, .3);
  return R;
}
