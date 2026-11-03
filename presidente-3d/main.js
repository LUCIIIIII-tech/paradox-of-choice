// Ikaw ang Presidente, 3D (10 s): the hook as one handheld long take down a palace back corridor at night, three.js, 1080x1920.
// You walk; the guards along the walls turn to look; the camera circles round to your face on "ikaw", stays in front of you, swings back
// behind you, and the double doors at the end open on light and camera flashes. Blocky characters, warm fluorescent practicals, digital grain.
// renderAt(t) builds the frame from t alone; the 3D frame is drawn onto the 2D canvas #c, then the title and the captions go on top.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920, DUR = 10; window.DUR = DUR;
const TL = await (await fetch('timeline.json')).json(), LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const wordT = (id, w) => (LN[id].words.find(x => x[0].toLowerCase().startsWith(w)) || [0, LN[id].t0])[1];
const W_NAMATAY = wordT('h1', 'namatay'), W_IKAW = wordT('h1', 'ikaw'), DOOR = 8.4, FLASH = [9.05, 9.3, 9.42, 9.6, 9.75, 9.88];   // score.py uses the same times
const lerp = (a, b, u) => a + (b - a) * u, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), ss = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); gl.setPixelRatio(1); gl.setSize(W, H); gl.domElement.id = 'gl'; document.body.appendChild(gl.domElement);
gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1;
const out = document.getElementById('c'), cx = out.getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x120e0a); scene.fog = new THREE.Fog(0x1a140c, 9, 24);
const camera = new THREE.PerspectiveCamera(58, W / H, .05, 60);
const std = (color, rough = .8, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: o.metal || 0, emissive: o.emis ? color : 0x000000, emissiveIntensity: o.emis || 0, map: o.map || null });
const add = (geo, m, x = 0, y = 0, z = 0, p = scene) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); p.add(me); return me; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), rbox = (w, h, d, r = .05) => new RoundedBoxGeometry(w, h, d, 3, r);
function ctex(w, h, fn, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
const grime = (g, w, h, n, a) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,240' : '20,14,8'},${a})`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2 + 3 * hash(i * 4), 2 + 3 * hash(i * 5)); } };

// ---------- the corridor ----------
const XW = 1.6, Z0 = -15.2, Z1 = 4, HT = 3.0, WAIN = 1.1, LEN = Z1 - Z0, ZM = (Z0 + Z1) / 2;
const lino = ctex(512, 512, (g, w, h) => { g.fillStyle = '#5c6858'; g.fillRect(0, 0, w, h); grime(g, w, h, 9000, .12); g.strokeStyle = 'rgba(20,24,18,.6)'; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, k * 128); g.lineTo(w, k * 128); g.stroke(); } }, 2, 10);
const cream = ctex(512, 512, (g, w, h) => { g.fillStyle = '#d6c58e'; g.fillRect(0, 0, w, h); grime(g, w, h, 6000, .06); for (let i = 0; i < 6; i++) { const x = hash(i * 7) * w; g.fillStyle = 'rgba(120,90,40,.08)'; g.fillRect(x, 0, 30 + 40 * hash(i), h); } }, 6, 1);
const red = ctex(256, 256, (g, w, h) => { g.fillStyle = '#7a2a22'; g.fillRect(0, 0, w, h); grime(g, w, h, 3000, .08); for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 4, h); } }, 12, 1);
add(new THREE.PlaneGeometry(2 * XW, LEN).rotateX(-Math.PI / 2), std(0xffffff, .55, { map: lino }), 0, 0, ZM);
add(new THREE.PlaneGeometry(2 * XW, LEN).rotateX(Math.PI / 2), std(0xbdb49a, .9), 0, HT, ZM);
for (const s of [-1, 1]) {
  const lo = add(new THREE.PlaneGeometry(LEN, WAIN), std(0xffffff, .7, { map: red }), s * XW, WAIN / 2, ZM); lo.rotation.y = -s * Math.PI / 2;
  const hi = add(new THREE.PlaneGeometry(LEN, HT - WAIN), std(0xffffff, .85, { map: cream }), s * XW, WAIN + (HT - WAIN) / 2, ZM); hi.rotation.y = -s * Math.PI / 2;
  add(box(.05, .06, LEN), std(0x3a1c10, .5), s * (XW - .02), WAIN, ZM); add(box(.04, .12, LEN), std(0x2a1a10, .6), s * (XW - .02), .06, ZM);
  add(new THREE.CylinderGeometry(.05, .05, LEN, 10).rotateX(Math.PI / 2), std(0x9a9a8a, .4, { metal: .6 }), s * .9, HT - .12, ZM);
}
const back = add(new THREE.PlaneGeometry(2 * XW, HT), std(0xd6c58e, .85, { map: cream }), 0, HT / 2, Z0 - .01);
// side doors, portraits, a bulletin board, the pipe, the fire extinguisher
for (const [s, z] of [[-1, -3.6], [1, -8.2], [-1, -11.6]]) { const g = new THREE.Group(); g.position.set(s * (XW - .03), 0, z); g.rotation.y = -s * Math.PI / 2; scene.add(g);
  add(box(1.0, 2.2, .06), std(0x3a2214, .6), 0, 1.1, 0, g); add(box(1.12, 2.3, .03), std(0x24140a, .6), 0, 1.15, -.02, g); add(box(.3, .12, .02), std(0xd8c070, .4, { metal: .5 }), 0, 1.75, .04, g); add(new THREE.SphereGeometry(.035, 10, 8), std(0xd8b050, .3, { metal: .8 }), .38, 1.05, .05, g); }
for (const [s, z] of [[1, -2.0], [-1, -6.4], [1, -12.4]]) { const g = new THREE.Group(); g.position.set(s * (XW - .03), 1.85, z); g.rotation.y = -s * Math.PI / 2; scene.add(g);
  add(box(.7, .85, .05), std(0xb08a40, .4, { metal: .5 }), 0, 0, 0, g); add(box(.58, .73, .02), std(0x1a1e2a, .7), 0, 0, .03, g); add(new THREE.SphereGeometry(.12, 12, 10), std(0x0a0a10, .8), 0, .1, .045, g).scale.set(1, 1.15, .2); add(box(.36, .26, .01), std(0x0a0a10, .8), 0, -.22, .045, g); }
{ const g = new THREE.Group(); g.position.set(-XW + .03, 1.7, .6); g.rotation.y = Math.PI / 2; scene.add(g); add(box(1.0, .7, .04), std(0x8a6a3a, .9), 0, 0, 0, g);
  for (let i = 0; i < 6; i++) add(box(.18, .22, .01), std([0xf0f0e8, 0xf0e070, 0xa8d0f0][i % 3], .9), -.35 + (i % 3) * .3 + .05 * hash(i), .12 - Math.floor(i / 3) * .3, .03, g); }
add(new THREE.CylinderGeometry(.06, .06, HT, 14), std(0xd8d4c4, .5), XW - .15, HT / 2, -5.0);
add(new THREE.CylinderGeometry(.08, .08, .45, 14), std(0xc0201a, .4), -XW + .12, .45, -9.4);
// the fluorescent tubes (they flicker on "namatay")
const LAMPS = []; for (let i = 0; i < 6; i++) { const z = 2.6 - i * 3.2; add(box(.25, .06, 1.3), std(0xffffff, .5), 0, HT - .05, z); const tube = add(box(.16, .04, 1.2), std(0xfff4d8, .3, { emis: 2.5 }), 0, HT - .1, z);
  const L = new THREE.PointLight(0xffe6b8, 7, 8, 1.6); L.position.set(0, HT - .3, z); scene.add(L); LAMPS.push([L, tube, 7]); }
scene.add(new THREE.HemisphereLight(0xfff0d0, 0x302418, .35));
const exitTex = ctex(256, 96, (g, w, h) => { g.fillStyle = '#0a5a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8ffe0'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EXIT', w / 2, h / 2 + 4); });
add(box(.5, .18, .06), std(0xffffff, .5, { map: exitTex, emis: 1.2 }), 0, 2.7, Z0 + .05).material.emissiveMap = exitTex;
// the double doors at the end, and the light of the hall behind them
const flagTex = ctex(600, 300, (g, w, h) => { g.fillStyle = '#0038a8'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#ce1126'; g.fillRect(0, h / 2, w, h / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(260, 150); g.lineTo(0, 300); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#fcd116'; g.beginPath(); g.arc(87, 150, 30, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.moveTo(87 + Math.cos(a) * 34, 150 + Math.sin(a) * 34); g.lineTo(87 + Math.cos(a + .12) * 60, 150 + Math.sin(a + .12) * 60); g.lineTo(87 + Math.cos(a - .12) * 60, 150 + Math.sin(a - .12) * 60); g.fill(); } }, 1, 1);
add(new THREE.PlaneGeometry(2.4, 2.6), std(0xfff2d8, .9, { emis: 1.6 }), 0, 1.3, Z0 - .6);
add(new THREE.PlaneGeometry(1.2, .6), std(0xffffff, .8, { map: flagTex, emis: 1.4 }), .1, 1.9, Z0 - .5).material.emissiveMap = flagTex;
const hallLight = new THREE.PointLight(0xfff0d0, 0, 14, 1.2); hallLight.position.set(0, 1.8, Z0 + .6); scene.add(hallLight);
const flashLight = new THREE.PointLight(0xffffff, 0, 16, 1.0); flashLight.position.set(0, 1.9, Z0 + .4); scene.add(flashLight);
add(box(1.9, .12, .14), std(0x2a1a10, .6), 0, 2.36, Z0 + .02); for (const s of [-1, 1]) add(box(.12, 2.4, .14), std(0x2a1a10, .6), s * .95, 1.2, Z0 + .02);
const leaves = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .88, 0, Z0 + .05); scene.add(p); const d = add(box(.86, 2.28, .07), std(0x5a3418, .55), -s * .43, 1.14, 0, p);
  add(box(.6, .9, .02), std(0x4a2a12, .6), 0, .55, .045, d); add(box(.6, .7, .02), std(0x4a2a12, .6), 0, -.45, .045, d); add(box(.04, .3, .05), std(0xd8b050, .3, { metal: .8 }), s * .35, 0, .07, d); return [p, s]; });
// the door's light spills out: a bright cone on the floor (only once it opens)
const spillM = new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const spill = add(new THREE.PlaneGeometry(1.8, 6).rotateX(-Math.PI / 2), spillM, 0, .01, Z0 + 3.0);

// ---------- the people: blocky ----------
function blocky(o) {
  const g = new THREE.Group(), suit = std(o.suit, .65), skin = std(o.skin, .55), shoe = std(0x141010, .4), hair = std(o.hair || 0x1a1410, .7), ink = std(0x14100e, .5);
  const legs = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .13, .86, 0); g.add(p); add(rbox(.19, .82, .21, .04), suit, 0, -.41, 0, p); add(rbox(.21, .1, .32, .03), shoe, 0, -.82, .05, p); return p; });
  add(rbox(.58, .64, .34, .07), suit, 0, 1.18, 0, g); add(box(.17, .42, .01), std(0xf4f0e6, .6), 0, 1.27, .172, g);
  if (!o.noTie) add(box(.07, .36, .012), std(o.tie || 0xa01a24, .5), 0, 1.24, .18, g);
  const arms = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .35, 1.44, 0); g.add(p); add(rbox(.16, .6, .18, .04), suit, 0, -.3, 0, p); add(rbox(.14, .14, .14, .03), skin, 0, -.66, 0, p); return p; });
  const head = new THREE.Group(); head.position.set(0, 1.52, 0); g.add(head); add(box(.16, .1, .16), skin, 0, .04, 0, head);
  add(rbox(.52, .5, .48, .09), skin, 0, .32, 0, head); add(rbox(.55, .16, .51, .06), hair, 0, .56, -.01, head); add(rbox(.55, .3, .12, .05), hair, 0, .4, -.2, head);
  for (const s of [-1, 1]) { add(box(.07, .1, .02), ink, s * .12, .35, .245, head); add(box(.13, .03, .02), hair, s * .12, .45, .245, head); add(rbox(.06, .12, .08, .02), skin, s * .27, .32, 0, head); }
  add(rbox(.08, .09, .07, .02), skin, 0, .27, .26, head); add(box(.15, .025, .01), std(0x5a2018, .6), 0, .16, .243, head);
  if (o.glasses) { add(box(.42, .08, .02), std(0x050505, .2, { metal: .4 }), 0, .35, .255, head); add(box(.03, .1, .03), std(0x101010, .4), .28, .26, .02, head); }
  return { g, legs, arms, head };
}
const ME = blocky({ suit: 0x253252, skin: 0xc4885e, hair: 0x15100c }); ME.g.rotation.y = Math.PI; scene.add(ME.g);
const GUARDS = []; for (const z of [-2.8, -6.0, -9.4]) for (const s of [-1, 1]) { const b = blocky({ suit: 0x121216, skin: [0xb07a52, 0xc89068, 0x9a6a46][GUARDS.length % 3], glasses: 1, tie: 0x101014 });
  b.g.position.set(s * 1.32, 0, z + (s > 0 ? .5 : 0)); b.g.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(b.g); GUARDS.push([b, s]); }

// ---------- the look: a little bloom, then digital-cinema grain, a soft vignette, a faint chromatic edge ----------
const composer = new EffectComposer(gl); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .55, .5, .82)); composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 } }, vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv; float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() { vec2 d = vUv - 0.5; vec3 c = vec3(texture2D(tDiffuse, vUv + d * 0.003).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * 0.003).b);
    float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(c, c * vec3(1.04, 1.0, 0.86), 0.6); c += vec3(0.0, 0.012, 0.02) * (1.0 - smoothstep(0.0, 0.3, l));
    c *= mix(0.45, 1.0, smoothstep(0.95, 0.3, length(d * vec2(0.9, 1.0))));
    float n = h(floor(vUv * vec2(540.0, 960.0)) + floor(time * 24.0) * 1.37) - 0.5; c += n * (0.05 + 0.04 * (1.0 - l)); gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade);

// ---------- the walk and the long take ----------
const zMe = t => 1.0 - 1.42 * Math.min(t, 8.4) - (t > 8.4 ? 1.42 * (t - 8.4) - .55 * (t - 8.4) ** 2 : 0);   // you slow to a stop in front of the doors
function walkPose(b, ph, amt = 1) { b.legs[0].rotation.x = .55 * Math.sin(ph) * amt; b.legs[1].rotation.x = -.55 * Math.sin(ph) * amt; b.arms[0].rotation.x = -.4 * Math.sin(ph) * amt; b.arms[1].rotation.x = .4 * Math.sin(ph) * amt; }
function frame3d(t) {
  const z = zMe(Math.min(t, 9.65)), ph = (1.0 - z) / .72 * Math.PI, moving = t < 9.6 ? 1 - ss(seg(t, 9.0, 9.6)) : 0;
  ME.g.position.set(0, .03 * Math.abs(Math.sin(ph)) * moving, z); walkPose(ME, ph, moving); ME.head.rotation.set(.04 * Math.sin(t * .9), .08 * Math.sin(t * .5), 0);
  // the guards: they turn their heads to you on "ikaw", and salute as you pass the last of them
  GUARDS.forEach(([b, s], i) => { const p = b.g.position, look = ss(seg(t, W_IKAW - .2 + i * .08, W_IKAW + .5 + i * .08)), want = Math.atan2(-(z - p.z) * s, Math.abs(p.x)) * .8;
    b.head.rotation.y = lerp(0, clamp(want, -1.1, 1.1), look); const sal = ss(seg(t, 7.2 + i * .1, 7.6 + i * .1)); b.arms[s > 0 ? 0 : 1].rotation.set(-2.5 * sal, 0, (s > 0 ? -.5 : .5) * sal); });
  // the lights: a stutter on "namatay"; the hall behind the doors
  const fl = t > W_NAMATAY && t < W_NAMATAY + .55 ? (hash(Math.floor(t * 30)) > .45 ? .25 : 1) : 1;
  LAMPS.forEach(([L, tube, base], i) => { const f = i === 2 ? fl * (t > W_NAMATAY + .55 && t < W_NAMATAY + .9 ? .3 : 1) : fl; L.intensity = base * f; tube.material.emissiveIntensity = 2.5 * f; });
  const op = ss(seg(t, DOOR, DOOR + 1.0)); leaves.forEach(([p, s]) => { p.rotation.y = s * 1.35 * op; });
  hallLight.intensity = 6 * op; spillM.opacity = .16 * op; let fz = 0; for (const f of FLASH) if (t > f) fz = Math.max(fz, Math.exp(-(t - f) * 14)); flashLight.intensity = 22 * fz;
  // the camera: behind you, round your left to your face on "ikaw", in front of you walking backwards, round your right, behind you to the doors
  const a = Math.PI * (ss(seg(t, W_IKAW - .5, W_IKAW + 1.4)) + ss(seg(t, 7.5, 9.0))), dist = lerp(2.9, 2.1, Math.sin(a / 2) ** 2);
  const camX = clamp(-.95 * Math.sin(a) + .35 * Math.cos(a / 2) ** 2, -1.3, 1.3), camZ = z + dist * Math.cos(a) - 1.15 * Math.sin(a), hh = 1.95 - .15 * Math.sin(a / 2) ** 2 + .05 * Math.sin(t * 1.3);
  const sh = (k, f) => .025 * Math.sin(t * f * 1.7 + k) + .014 * Math.sin(t * f * 3.3 + k * 2) + .007 * Math.sin(t * f * 7.1 + k * 3);
  camera.position.set(camX + sh(1, 1), hh + sh(2, .9), camZ + sh(3, .8) + (t > 9 ? -.3 * ss(seg(t, 9, 10)) : 0));
  const wface = clamp(Math.sin(a / 2) * 2.5), ahead = new THREE.Vector3(0, 1.62, z - 5), face = new THREE.Vector3(0, 1.78, z);
  camera.lookAt(ahead.lerp(face, wface * (1 - ss(seg(t, 8.6, 9.2))))); camera.rotateZ(.018 * Math.sin(t * .7) + sh(4, .6) * .6);
  grade.uniforms.time.value = t; composer.render();
}

// ---------- the title and the captions (2D, on top) ----------
function rr(x, y, w, h, r) { cx.beginPath(); cx.roundRect(x, y, w, h, r); }
function title(a) { if (a <= 0) return; cx.save(); cx.globalAlpha = a; cx.translate(540, 300); rr(-480, -150, 960, 300, 36); cx.fillStyle = 'rgba(8,10,22,.72)'; cx.fill(); cx.shadowColor = 'rgba(255,179,87,.6)'; cx.shadowBlur = 26; cx.strokeStyle = 'rgba(255,179,87,.55)'; cx.lineWidth = 3; cx.stroke(); cx.shadowBlur = 0;
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; const fit = (s, px, maxw) => { cx.font = `${px}px Anton`; return Math.min(1, maxw / cx.measureText(s).width); };
  let k = fit('IMAGINE NAMATAY ANG PRESIDENTE', 90, 880); cx.save(); cx.translate(0, -62); cx.scale(k, k); cx.font = '90px Anton'; cx.lineWidth = 12; cx.strokeStyle = '#07080f'; cx.strokeText('IMAGINE NAMATAY ANG PRESIDENTE', 0, 0); cx.fillStyle = '#f4f1ea'; cx.fillText('IMAGINE NAMATAY ANG PRESIDENTE', 0, 0); cx.restore();
  k = fit('IKAW ANG PAPALIT', 150, 880); cx.save(); cx.translate(0, 62); cx.scale(k, k); cx.font = '150px Anton'; cx.lineWidth = 14; cx.strokeStyle = '#07080f'; cx.strokeText('IKAW ANG PAPALIT', 0, 0); cx.shadowColor = 'rgba(255,60,80,.9)'; cx.shadowBlur = 34; cx.fillStyle = '#ff5068'; cx.fillText('IKAW ANG PAPALIT', 0, 0); cx.restore(); cx.restore(); }
function captions(t) {
  const l = [...TL.lines].reverse().find(x => t >= x.t0 - .02); if (!l || t > l.t1 + .3) return;
  let k = -1; l.words.forEach((w, i) => { if (t >= w[1] - .02) k = i; }); if (k < 0) return;
  const a = Math.floor(k / 3) * 3, ws = l.words.slice(a, a + 3), keys = l.key.map(x => x.toLowerCase().replace(/[^a-z0-9']/g, ''));
  cx.font = '96px Anton'; const widths = ws.map(w => cx.measureText(w[0].toUpperCase()).width), gap = 44, total = widths.reduce((s, v) => s + v, 0) + gap * (ws.length - 1), sc = Math.min(1, 980 / total); let x = 540 - total * sc / 2;
  ws.forEach((w, i) => { const idx = a + i; if (idx > k) return; const isKey = keys.some(kk => w[0].toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(kk)), p = clamp((t - w[1]) / .16), s = sc * (idx === k ? lerp(1.12, 1, p) : 1);
    cx.save(); cx.translate(x + widths[i] * sc / 2, 1480); cx.scale(s, s); cx.font = '96px Anton'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.shadowColor = 'rgba(0,0,0,.8)'; cx.shadowBlur = 18; cx.lineWidth = 16; cx.strokeStyle = '#07080f'; cx.lineJoin = 'round'; cx.strokeText(w[0].toUpperCase(), 0, 0);
    cx.shadowBlur = isKey ? 26 : 0; cx.shadowColor = 'rgba(255,49,80,.85)'; cx.fillStyle = isKey ? '#ff3150' : '#fff'; cx.fillText(w[0].toUpperCase(), 0, 0); cx.restore(); x += (widths[i] + gap) * sc; });
}
window.renderAt = (t) => { frame3d(t); cx.globalAlpha = 1; cx.drawImage(gl.domElement, 0, 0); title(t < 4.4 ? 1 : 1 - seg(t, 4.4, 4.8)); captions(t); };
window.fontsReady = Promise.all([document.fonts.load('80px Anton')]).then(() => true);
