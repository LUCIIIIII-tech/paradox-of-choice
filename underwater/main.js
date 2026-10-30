// Lunod (a flooded 1960s bathroom, seen from under the water): a 10-second real-time 3D reel in three.js, 1080x1920.
// Look: every surface is lit by moving caustics from the water surface above, shafts of light fall through the room, warm practical
// lamps (the window, a brass lamp on the shelf) glow orange, bubbles rise, and the frame is graded teal in the shadows, gold in the highlights.
// renderAt(t) builds the frame from t alone (nothing accumulates), so any frame can be rendered in any order.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

THREE.ColorManagement.enabled = false;       // colours are display values: the grade at the end is the only tone curve
const W = 1080, H = 1920, DUR = 10; window.DUR = DUR;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.domElement.id = 'c'; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020a0c);
const camera = new THREE.PerspectiveCamera(62, W / H, .05, 60);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z), lerp = (a, b, u) => a + (b - a) * u, ss = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// ---------- the water light: one shader for every surface ----------
const U = { time: { value: 0 }, camPos: { value: v3(0, 0, 0) }, lampPos: { value: [v3(-1.3, 2.5, -7.3), v3(1.7, 1.75, -5.6)] }, lampCol: { value: [v3(1.0, .46, .13).multiplyScalar(2.6), v3(1.0, .62, .26).multiplyScalar(1.5)] } };
const VS = `varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() { mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
#endif
  vec4 w = m * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(m) * normal); vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CAUS = `float caus(vec2 p, float t) {            // bright wandering lines: a domain-warped interference of sines
  vec2 q = p; float v = 0.0;
  for (int k = 0; k < 4; k++) { float fk = float(k);
    q += 0.45 * vec2(sin(q.y * 1.9 + t * 0.8 + fk * 1.7), cos(q.x * 1.6 - t * 0.7 + fk * 2.3));
    v += sin(q.x * 2.2 + t * 0.6) * sin(q.y * 2.0 - t * 0.5); }
  return pow(clamp(1.0 - abs(v) * 0.5, 0.0, 1.0), 7.0); }
vec3 fogCol(vec3 w) { return mix(vec3(0.004, 0.035, 0.042), vec3(0.035, 0.21, 0.22), smoothstep(-0.5, 6.5, w.y)); }`;
const FS = `uniform float time; uniform vec3 camPos; uniform vec3 lampPos[2]; uniform vec3 lampCol[2];
uniform vec3 tint; uniform sampler2D map; uniform float useMap; uniform float emis; uniform float spec;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
${CAUS}
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N; vec3 V = normalize(camPos - vW);
  vec3 alb = tint * (useMap > 0.5 ? texture2D(map, vUv).rgb : vec3(1.0));
  vec3 S = normalize(vec3(0.25, 1.0, 0.15)); float up = max(dot(N, S), 0.0);
  vec2 cp = vW.xz * 1.15 + vec2(vW.y * 0.35, -vW.y * 0.2);
  float c = caus(cp, time * 1.1) * 0.7 + caus(cp * 1.7 + 3.1, time * 1.4) * 0.45;
  float depth = smoothstep(-0.5, 6.0, vW.y);
  vec3 sun = vec3(0.45, 1.0, 0.9) * (0.25 + 1.9 * c) * (0.3 + 0.7 * up) * (0.55 + 0.45 * depth);
  vec3 amb = vec3(0.025, 0.13, 0.14) * (0.75 + 0.25 * N.y);
  vec3 lamp = vec3(0.0);
  for (int i = 0; i < 2; i++) { vec3 L = lampPos[i] - vW; float d = length(L); L /= d; float att = 1.0 / (1.0 + d * d * 0.35);
    lamp += lampCol[i] * att * (max(dot(N, L), 0.0) * 0.9 + 0.1);
    lamp += lampCol[i] * att * pow(max(dot(N, normalize(L + V)), 0.0), 40.0) * spec * 2.0; }
  float sp = pow(max(dot(N, normalize(S + V)), 0.0), 30.0) * spec * c * 2.0;
  vec3 col = alb * (amb + sun * 0.75 + lamp) + vec3(0.5, 1.0, 0.9) * sp + tint * emis;
  col = mix(col, fogCol(vW), 1.0 - exp(-length(camPos - vW) * 0.13));
  gl_FragColor = vec4(col, 1.0); }`;
function mat(o = {}) {
  const { color = 0xffffff, map = null, emis = 0, spec = 0 } = o;
  return new THREE.ShaderMaterial({ uniforms: { ...U, tint: { value: new THREE.Color(color) }, map: { value: map }, useMap: { value: map ? 1 : 0 }, emis: { value: emis }, spec: { value: spec } }, vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide });
}
const add = (geo, m, x = 0, y = 0, z = 0, parent = scene) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); parent.add(me); return me; };

// ---------- painted textures: the tiles ----------
function canvasTex(w, h, fn, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
const floorTex = canvasTex(1024, 1024, (g, w, h) => {      // a chequerboard of mint and deep teal, with grime in the grout
  const n = 8, s = w / n; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const v = hash(r * 31 + c) * .12; g.fillStyle = (r + c) % 2 ? `rgb(${Math.round(150 + 40 * v)},${Math.round(212 + 30 * v)},${Math.round(196 + 30 * v)})` : `rgb(${Math.round(24 + 30 * v)},${Math.round(82 + 30 * v)},${Math.round(84 + 30 * v)})`; g.fillRect(c * s, r * s, s, s); }
  g.strokeStyle = 'rgba(20,30,28,.85)'; g.lineWidth = 6; for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s, h); g.stroke(); g.beginPath(); g.moveTo(0, k * s); g.lineTo(w, k * s); g.stroke(); }
  for (let i = 0; i < 40000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
}, 4, 6);
const wallTex = canvasTex(1024, 1024, (g, w, h) => {       // subway tiles, pale aqua
  g.fillStyle = '#2a3a38'; g.fillRect(0, 0, w, h); const tw = 128, th = 64;
  for (let r = 0; r < h / th; r++) for (let c = -1; c < w / tw + 1; c++) { const x = c * tw + (r % 2) * tw / 2, y = r * th, v = hash(r * 17 + c) * .1;
    g.fillStyle = `rgb(${Math.round(168 + 40 * v)},${Math.round(222 + 20 * v)},${Math.round(212 + 20 * v)})`; g.fillRect(x + 3, y + 3, tw - 6, th - 6); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 6, y + 6, tw - 12, 8); }
  for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
}, 4, 1.2);

// ---------- the room ----------
const X0 = -4, X1 = 4, Z0 = -8, Z1 = 2.5, TOP = 6.2, TILE = 2.4;
add(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2), mat({ map: floorTex, spec: .6 }), 0, 0, (Z0 + Z1) / 2);
function wall(w, cx, cz, ry) {
  const lo = add(new THREE.PlaneGeometry(w, TILE), mat({ map: wallTex.clone(), spec: .5 }), cx, TILE / 2, cz); lo.rotation.y = ry; lo.material.uniforms.map.value.repeat.set(w / 2, 1.2);
  const hi = add(new THREE.PlaneGeometry(w, TOP - TILE), mat({ color: 0x3e6f6a }), cx, TILE + (TOP - TILE) / 2, cz); hi.rotation.y = ry;
  const tr = add(new THREE.BoxGeometry(w, .12, .08), mat({ color: 0x1e4a46, spec: .4 }), cx, TILE, cz); tr.rotation.y = ry;
}
wall(X1 - X0, 0, Z0, 0); wall(Z1 - Z0, X0, (Z0 + Z1) / 2, Math.PI / 2); wall(Z1 - Z0, X1, (Z0 + Z1) / 2, -Math.PI / 2);
// the surface, seen from below: bright, moving
const surf = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, side: THREE.DoubleSide,
  fragmentShader: `uniform float time; uniform vec3 camPos; varying vec3 vW; ${CAUS}
  void main() { float c = caus(vW.xz * 0.9, time * 1.2) + 0.5 * caus(vW.xz * 1.9 + 2.0, time * 1.6);
    vec3 col = mix(vec3(0.05, 0.3, 0.3), vec3(0.75, 1.0, 0.92), clamp(c, 0.0, 1.0)) * 1.1;
    col = mix(col, fogCol(vW), 1.0 - exp(-length(camPos - vW) * 0.08)); gl_FragColor = vec4(col, 1.0); }` }));
surf.position.y = TOP; scene.add(surf);
// the window on the back wall: a dark frame, six panes lit orange from outside
{ const g = new THREE.Group(); g.position.set(-1.3, 2.6, Z0 + .02); scene.add(g);
  add(new THREE.BoxGeometry(1.9, 2.3, .12), mat({ color: 0x2a1a10 }), 0, 0, 0, g);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) add(new THREE.PlaneGeometry(.78, .64), mat({ color: 0xffa040, emis: 3.2 }), -.42 + c * .84, -.72 + r * .72, .07, g); }
// a brass floor lamp, still standing, still lit
{ add(new THREE.CylinderGeometry(.22, .26, .05, 24), mat({ color: 0xc8a050, spec: 1 }), 1.7, .03, -5.6);
  add(new THREE.CylinderGeometry(.025, .025, 1.75, 12), mat({ color: 0xc8a050, spec: 1.2 }), 1.7, .9, -5.6);
  add(new THREE.CylinderGeometry(.16, .32, .32, 32, 1, true), mat({ color: 0xb87a30, spec: .5, emis: .5 }), 1.7, 1.85, -5.6);
  add(new THREE.SphereGeometry(.08, 16, 12), mat({ color: 0xffd080, emis: 3 }), 1.7, 1.78, -5.6); }
// the clawfoot tub and the pedestal sink
{ const tub = add(new RoundedBoxGeometry(1.9, .72, .9, 4, .3), mat({ color: 0xe8ece6, spec: 1 }), 2.3, .52, -6.6);
  add(new THREE.PlaneGeometry(1.6, .62).rotateX(-Math.PI / 2), mat({ color: 0x0e2a2a }), 2.3, .89, -6.6);
  for (const [dx, dz] of [[-.75, -.32], [.75, -.32], [-.75, .32], [.75, .32]]) add(new THREE.SphereGeometry(.07, 12, 8), mat({ color: 0xc8a050, spec: 1 }), 2.3 + dx, .1, -6.6 + dz);
  add(new THREE.CylinderGeometry(.12, .18, .85, 20), mat({ color: 0xe8ece6, spec: 1 }), -3.1, .42, -7.6);
  add(new RoundedBoxGeometry(.8, .22, .55, 3, .08), mat({ color: 0xe8ece6, spec: 1 }), -3.1, .93, -7.6);
  add(new THREE.BoxGeometry(.7, .9, .06), mat({ color: 0x8aa8a0, spec: 1.5 }), -3.1, 1.9, -7.95); }

// ---------- what floats ----------
const suitcase = new THREE.Group(); scene.add(suitcase);
add(new RoundedBoxGeometry(1.0, .7, .3, 4, .06), mat({ color: 0xf08a6e, spec: .4, emis: .18 }), 0, 0, 0, suitcase);
for (const dx of [-.3, .3]) add(new THREE.BoxGeometry(.08, .06, .32), mat({ color: 0xd8b060, spec: 1.2 }), dx, .35, 0, suitcase);
add(new THREE.TorusGeometry(.1, .025, 8, 16, Math.PI), mat({ color: 0x3a2014 }), 0, .37, 0, suitcase);
const chair = new THREE.Group(); scene.add(chair); const wood = mat({ color: 0x8a5a34, spec: .3 });
add(new THREE.BoxGeometry(.5, .06, .5), wood, 0, 0, 0, chair); add(new THREE.BoxGeometry(.5, .55, .05), wood, 0, .3, -.23, chair);
for (const [dx, dz] of [[-.21, -.21], [.21, -.21], [-.21, .21], [.21, .21]]) add(new THREE.BoxGeometry(.05, .5, .05), wood, dx, -.27, dz, chair);
const books = []; for (let i = 0; i < 6; i++) { const b = add(new THREE.BoxGeometry(.26, .04, .36), mat({ color: [0xb83a3a, 0x2a5a8a, 0xd8b050, 0x3a7a4a][i % 4] }), 0, 0, 0); books.push(b); }
const fish = []; for (let i = 0; i < 4; i++) { const f = new THREE.Group(); scene.add(f); const m = mat({ color: 0xff9a3a, emis: .25, spec: .8 });
  const body = add(new THREE.SphereGeometry(1, 16, 12), m, 0, 0, 0, f); body.scale.set(.2, .085, .07);
  const tail = add(new THREE.ConeGeometry(.09, .16, 3).rotateZ(Math.PI / 2), m, -.24, 0, 0, f); tail.scale.set(1, 1, .3); f.userData.tail = tail; fish.push(f); }

// ---------- her: a woman in a gold dress, floating, hair streaming up ----------
const her = new THREE.Group(); scene.add(her);
const skin = mat({ color: 0xf0c098, spec: .5, emis: .08 }), dressM = mat({ color: 0xd8a83a, spec: .3 }), hairM = mat({ color: 0x1a0e0a, spec: .6 });
const head = add(new THREE.SphereGeometry(.115, 24, 16), skin, 0, .8, 0, her); head.scale.set(.9, 1.08, .95);
add(new THREE.SphereGeometry(.125, 24, 16), hairM, 0, .03, -.03, head).scale.set(1.04, 1.0, 1.02);
add(new THREE.CylinderGeometry(.045, .05, .12, 12), skin, 0, .64, 0, her);
const torso = add(new THREE.CapsuleGeometry(.12, .3, 6, 16), dressM, 0, .38, 0, her); torso.scale.set(1, 1, .75);
const dressGeo = new THREE.CylinderGeometry(.15, .5, .85, 48, 12, true), dressBase = dressGeo.attributes.position.array.slice();
add(dressGeo, dressM, 0, -.15, 0, her);
const limb = (len, r, m, end) => { const g = new THREE.Group(); const c = add(new THREE.CapsuleGeometry(r, len, 4, 12), m, 0, -len / 2, 0, g); c.scale.set(1, 1, .9); const e = add(new THREE.SphereGeometry(r * 1.25, 12, 8), m, 0, -len - r * .6, end ? r * 1.4 : 0, g); e.scale.set(1, end ? .6 : 1.25, end ? 2.2 : .7); return g; };
const limb2 = (len, r, m, end) => {      // two segments (upper, lower) with a joint; returns the root, lower in userData
  const g = new THREE.Group(), up = add(new THREE.CapsuleGeometry(r, len / 2, 4, 12), m, 0, -len / 4, 0, g), lo = limb(len / 2, r * .85, m, end); lo.position.y = -len / 2; g.add(lo); g.userData.lo = lo; return g; };
const armL = limb2(.56, .032, skin), armR = limb2(.56, .032, skin); armL.position.set(-.15, .55, 0); armR.position.set(.15, .55, 0); her.add(armL, armR);
const legL = limb2(.76, .044, skin, 1), legR = limb2(.76, .044, skin, 1); legL.position.set(-.08, -.3, 0); legR.position.set(.08, -.3, 0); her.add(legL, legR);
const strands = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BufferGeometry(), hairM); head.add(m); strands.push(m); }
function hair(t) {
  strands.forEach((m, i) => { const a = (hash(i * 3.7) - .5) * 2.6, b = hash(i * 1.3), pts = []; let p = v3(Math.sin(a) * .11, .05 + .06 * b, -.05 - .06 * Math.cos(a));
    for (let k = 0; k < 10; k++) { pts.push(p.clone()); const s = k / 9; p = p.clone().add(v3(Math.sin(a) * .028 * (1 + s) + .03 * s * Math.sin(t * 1.1 + k * .45 + i * .7), .06 + .012 * Math.sin(t * .8 + i), -.04 - .02 * s + .025 * s * Math.cos(t * .9 + k * .4 + i * 1.3))); }
    m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .022 + .012 * hash(i), 6, false); });
}

// ---------- light shafts, bubbles, dust ----------
const shafts = []; for (let i = 0; i < 7; i++) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.12 + .1 * hash(i), .8 + .5 * hash(i + 3), 8, 32, 1, true), new THREE.ShaderMaterial({ uniforms: { ...U, seed: { value: i } }, vertexShader: VS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    fragmentShader: `uniform float time; uniform vec3 camPos; uniform float seed; varying vec3 vW; varying vec3 vN;
    void main() { float edge = pow(abs(dot(normalize(vN), normalize(camPos - vW))), 2.0);
      float fl = 0.55 + 0.45 * sin(time * 0.9 + seed * 3.0) * sin(time * 1.7 + seed);
      float a = edge * smoothstep(-0.5, 5.5, vW.y) * fl * 0.2; gl_FragColor = vec4(vec3(0.55, 1.0, 0.9) * a, 1.0); }` }));
  m.position.set(-3 + i * 1.0 + hash(i * 7) * .6, TOP - 3.6, -2.5 - 7 * hash(i * 3)); m.rotation.set(.18 + .1 * hash(i), 0, -.22 + .1 * hash(i + 1)); scene.add(m); shafts.push(m); }
const bubbleMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  fragmentShader: `uniform vec3 camPos; varying vec3 vW; varying vec3 vN; void main() { float r = 1.0 - abs(dot(normalize(vN), normalize(camPos - vW)));
    gl_FragColor = vec4(vec3(0.6, 1.0, 0.95) * (pow(r, 2.5) * 0.9 + 0.04) + vec3(1.0, 0.95, 0.8) * pow(max(dot(normalize(vN), normalize(vec3(0.3, 1.0, 0.4))), 0.0), 60.0), 1.0); }` });
const NB = 260, bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), bubbleMat, NB); scene.add(bubbles); const dummy = new THREE.Object3D();
const dustGeo = new THREE.BufferGeometry(), dustN = 1600, dust0 = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) { dust0[i * 3] = lerp(X0, X1, hash(i * 1.1)); dust0[i * 3 + 1] = TOP * hash(i * 2.3); dust0[i * 3 + 2] = lerp(Z0, Z1, hash(i * 3.7)); }
const dot = canvasTex(64, 64, (g, w) => { g.fillStyle = (() => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); return r; })(); g.fillRect(0, 0, 64, 64); });
dustGeo.setAttribute('position', new THREE.BufferAttribute(dust0.slice(), 3)); scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9ff0e0, map: dot, size: .02, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---------- the grade: a little refraction wobble, chromatic fringe, teal shadows and gold highlights, vignette, grain ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .85, .55, .6));
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 } }, vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() { vec2 uv = vUv; uv.x += sin(uv.y * 24.0 + time * 1.7) * 0.0012; uv.y += cos(uv.x * 19.0 + time * 1.3) * 0.001;
    vec2 d = uv - 0.5; vec3 c = vec3(texture2D(tDiffuse, uv + d * 0.004).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d * 0.004).b);
    c = c / (1.0 + c * 0.35) * 1.15; float l = dot(c, vec3(0.299, 0.587, 0.114));
    c += vec3(-0.01, 0.05, 0.055) * (1.0 - smoothstep(0.0, 0.45, l)); c = mix(c, c * vec3(1.18, 0.98, 0.66), smoothstep(0.35, 1.0, l) * 0.6);
    c *= mix(0.32, 1.0, smoothstep(0.95, 0.25, length(d * vec2(0.85, 1.0))));
    c += (h(vUv * vec2(1080.0, 1920.0) + time * 37.0) - 0.5) * 0.035; gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade);

// ---------- one frame ----------
window.renderAt = (t) => {
  const e = ss(t / DUR); U.time.value = t; grade.uniforms.time.value = t;
  camera.position.set(lerp(1.1, -.15, e), lerp(.85, 1.65, e) + .05 * Math.sin(t * 1.1), lerp(2.2, -.2, e));
  camera.lookAt(lerp(.15, -.45, e), lerp(2.55, 2.95, e), -6); camera.rotateZ(.025 * Math.sin(t * .6)); U.camPos.value.copy(camera.position);
  // her: drifting, turning slowly, the dress breathing, arms and legs loose
  her.position.set(-.35 + .15 * Math.sin(t * .4), 2.3 + .12 * Math.sin(t * .7), -3.0); her.rotation.set(-.15 + .05 * Math.sin(t * .5), .5 + t * .045, -.32 + .05 * Math.sin(t * .45));
  armL.rotation.set(.3 + .2 * Math.sin(t * .8), 0, -1.9 + .2 * Math.sin(t * .9)); armR.rotation.set(-.2 + .2 * Math.sin(t * .7 + 1), 0, 1.6 + .2 * Math.sin(t * .8 + 2));
  legL.rotation.set(.35 + .15 * Math.sin(t * .6), 0, -.12); legR.rotation.set(-.05 + .15 * Math.sin(t * .6 + 1.5), 0, .1);
  armL.userData.lo.rotation.set(0, 0, .6 + .15 * Math.sin(t * .9)); armR.userData.lo.rotation.set(0, 0, -.5 - .15 * Math.sin(t * .8 + 1));
  legL.userData.lo.rotation.set(-.7 - .2 * Math.sin(t * .6), 0, 0); legR.userData.lo.rotation.set(-.35 - .2 * Math.sin(t * .6 + 1.2), 0, 0);
  const P = dressGeo.attributes.position.array; for (let i = 0; i < P.length; i += 3) { const x = dressBase[i], y = dressBase[i + 1], z = dressBase[i + 2], hh = (.425 - y) / .85, a = Math.atan2(z, x), k = 1 + .2 * hh * Math.sin(a * 3 + t * 2.1) + .12 * hh;
    P[i] = x * k; P[i + 1] = y + hh * .1 * Math.sin(a * 2 + t * 1.7) + hh * hh * .12; P[i + 2] = z * k; } dressGeo.attributes.position.needsUpdate = true; dressGeo.computeVertexNormals();
  hair(t);
  suitcase.position.set(1.05 + .1 * Math.sin(t * .5), 2.75 + .15 * Math.sin(t * .6 + 1), -2.6); suitcase.rotation.set(.4 + t * .05, -.5 + t * .03, .25 + .08 * Math.sin(t * .4));
  chair.position.set(-1.7, 4.1 + .1 * Math.sin(t * .5), -7.0); chair.rotation.set(2.4 + t * .04, .6, .4 + t * .03);
  books.forEach((b, i) => { b.position.set(-2 + i * .9 + .2 * Math.sin(t * .4 + i), 4.6 + .4 * hash(i) + .1 * Math.sin(t * .6 + i), -4 - 3 * hash(i * 5)); b.rotation.set(t * .1 + i, t * .07 + i * 2, .3 * i); });
  fish.forEach((f, i) => { const w = .35 + .1 * i, ph = i * 1.9 + t * w, R = 1.2 + .5 * i, cx = .3 - .5 * i, cz = -4.5 - .8 * i;
    f.position.set(cx + R * Math.cos(ph), 1.4 + .9 * i * .5 + .15 * Math.sin(t + i), cz + R * .6 * Math.sin(ph)); f.rotation.set(0, -Math.atan2(R * .6 * Math.cos(ph), -R * Math.sin(ph)), 0); f.userData.tail.rotation.y = .5 * Math.sin(t * 9 + i); });
  // bubbles: a rush of them in the first second (you just went under), a field rising everywhere, a thin stream from her lips
  let k = 0; const hp = head.getWorldPosition(v3(0, 0, 0));
  for (let i = 0; i < NB; i++) { let x, y, z, r;
    if (i < 70) { const sp = 2.5 + 2 * hash(i), y0 = -.4 + .6 * hash(i * 3); y = .6 + y0 + t * sp; x = .9 + (hash(i * 5) - .5) * 1.6 + .1 * Math.sin(t * 6 + i); z = 1.0 - 1.4 * hash(i * 7); r = .02 + .05 * hash(i * 9); if (y > TOP + .5 || t > 2.6) r = 0; }
    else if (i < 230) { const sp = .35 + .5 * hash(i), y0 = TOP * hash(i * 3); y = (y0 + t * sp) % TOP; x = lerp(X0 + .3, X1 - .3, hash(i * 5)) + .08 * Math.sin(t * 2 + i); z = lerp(Z0 + .3, 1.5, hash(i * 7)); r = .008 + .025 * hash(i * 9); }
    else { const p = ((t * .6 + (i - 230) / 30) % 1); y = hp.y + .05 + p * 3; x = hp.x + .05 * Math.sin(t * 5 + i) + .03; z = hp.z + .1; r = .01 + .015 * hash(i); }
    dummy.position.set(x, y, z); dummy.scale.setScalar(r); dummy.updateMatrix(); bubbles.setMatrixAt(k++, dummy.matrix); }
  bubbles.instanceMatrix.needsUpdate = true;
  const D = dustGeo.attributes.position.array; for (let i = 0; i < dustN; i++) { D[i * 3] = dust0[i * 3] + .15 * Math.sin(t * .3 + i); D[i * 3 + 1] = (dust0[i * 3 + 1] + t * .05) % TOP; D[i * 3 + 2] = dust0[i * 3 + 2] + .15 * Math.cos(t * .25 + i * 1.3); } dustGeo.attributes.position.needsUpdate = true;
  composer.render();
};
window.fontsReady = Promise.resolve(true);
