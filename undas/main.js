// Ang Bata sa CCTV (Halloween special, ~3 min, 1080x1920, three.js). A night-shift guard in an old Manila hospital watches a child on the CCTV
// walk from the burnt third floor down to his guard house. Four real CCTV cameras render to textures shown on CRT monitors (scanlines, grain, OSD).
// renderAt(t) builds the frame from t alone: pick the shot from timeline.json, pose everyone, render the feeds that are on screen, render the
// main camera through the post chain (depth of field when a shot racks focus, bloom, an ink-and-grain grade), then the 2D title/captions on top.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { lerp, clamp, seg, ss, sss, hash, wob } from './kit.js';
import { makeExt, makeLobby, makeHall, makeHome } from './world.js';
import { guard, girl, breathe, blink, tremble, seat, stand, resetArms, setArm, grin, hair } from './people.js';

const W = 1080, H = 1920;
const TL = await (await fetch('timeline.json')).json(), LN = Object.fromEntries(TL.lines.map(l => [l.id, l])), DUR = TL.dur; window.DUR = DUR;
const at = (id, w, k = 0) => { const l = LN[id]; if (!l) return 0; if (!w || !l.words) return l.t0; const m = l.words.filter(x => x[0].toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(w)); return (m[k] || m[0] || [0, l.t0])[1]; };
const endOf = id => LN[id] ? LN[id].t1 : 0;
// shots: consecutive lines with the same shot name; a cut sits in the middle of the silence between two lines
const SHOTS = []; TL.lines.forEach(l => { if (l.shot === 'cam3' && l.id !== 's5') l.shot = 'bulb'; });   // older timelines named s6/s7 'cam3' too
TL.lines.forEach((l, i) => { const prev = TL.lines[i - 1]; if (!prev || prev.shot !== l.shot) { const a = prev ? (prev.t1 + l.t0) / 2 : 0; if (SHOTS.length) SHOTS[SHOTS.length - 1].b = a; SHOTS.push({ name: l.shot, a, b: DUR }); } });
const SH = Object.fromEntries(SHOTS.map(s => [s.name, s]));
window.SHOTS = SHOTS;

// ---------- renderer, sets, people ----------
const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); gl.setPixelRatio(1); gl.setSize(W, H); gl.domElement.style.display = 'none'; document.body.appendChild(gl.domElement);
gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
const out = document.getElementById('c'), cx = out.getContext('2d');
const EXT = makeExt(), LOB = makeLobby(), HALL = makeHall(), HOME = makeHome();
const ME = guard({ seed: 3 }); ME.g.position.set(3.68, 0, 1.15); ME.g.rotation.y = Math.PI / 2; LOB.S.add(ME.g);
LOB.chair.rotation.y = Math.PI / 2;
const REL = guard({ seed: 8, skin: 0x8a5a3a, mustache: 1, shirt: 0xd4d0c4 }); LOB.S.add(REL.g);
const DOUBLE = guard({ seed: 3 }); HALL.S.add(DOUBLE.g);                 // the guard on the recording (same face, same uniform)
const OLD = guard({ seed: 3, noCap: 1, shirt: 0x2a3440 }); HOME.S.add(OLD.g);
const KID = girl();
// a held flashlight in the guard's right hand
const torchProp = new THREE.Group(); { const m = new THREE.MeshToonMaterial({ color: 0x111111 }); const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .26, 12), m); a.rotation.x = Math.PI / 2; torchProp.add(a); const b = new THREE.Mesh(new THREE.CylinderGeometry(.045, .032, .07, 12), m); b.rotation.x = Math.PI / 2; b.position.z = .15; torchProp.add(b); }
ME.arms[1].end.add(torchProp); torchProp.position.set(0, -.08, .1); torchProp.visible = false;
// a rosary for the prayer
const rosary = new THREE.Mesh(new THREE.TorusGeometry(.07, .006, 6, 24), new THREE.MeshToonMaterial({ color: 0x6a4a2a })); rosary.visible = false; ME.arms[0].end.add(rosary); rosary.position.set(.04, -.12, .04);

// ---------- the CCTV: 4 cameras, render targets, a CRT shader with an on-screen display ----------
const FEEDS = [
  { name: 'CAM 1', where: 'LOBBY', set: LOB, pos: [-7.4, 3.6, 7.2], look: [2.6, 1.0, 1.3], fov: 50 },
  { name: 'CAM 2', where: 'HAGDAN', set: LOB, pos: [-3.0, 3.7, -1.0], look: [-6.2, 1.8, -4.6], fov: 58 },
  { name: 'CAM 3', where: '3F HALLWAY', set: HALL, pos: [1.15, 2.75, -.6], look: [0, 1.0, -22], fov: 46 },
  { name: 'CAM 4', where: 'GUARD HOUSE', set: LOB, pos: [4.75, 2.32, 2.25], look: [3.72, 1.0, .95], fov: 72 },
].map((f, i) => { f.cam = new THREE.PerspectiveCamera(f.fov, 4 / 3, .05, 60); f.cam.position.set(...f.pos); f.cam.lookAt(...f.look); f.base = { look: new THREE.Vector3(...f.look), fov: f.fov };
  f.ir = new THREE.PointLight(0xdce8ff, [3.2, 5, 14, 1.4][i], 30, 1.2); f.ir.position.set(...f.pos); f.ir.visible = false; f.set.S.add(f.ir);
  f.rt = new THREE.WebGLRenderTarget(800, 600, { samples: 2 }); f.osdC = document.createElement('canvas'); f.osdC.width = 800; f.osdC.height = 600; f.osd = new THREE.CanvasTexture(f.osdC); f.i = i; return f; });
const SCREEN_OF = [2, 3, 0, 1];   // feed index -> monitor index (top-left CAM1, top-right CAM2, bottom-left CAM3, bottom-right CAM4)
const crtMat = f => new THREE.ShaderMaterial({ toneMapped: false, uniforms: { feed: { value: f.rt.texture }, osd: { value: f.osd }, time: { value: 0 }, sig: { value: 1 }, seed: { value: f.i * 3.1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D feed, osd; uniform float time, sig, seed; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){ vec2 c = vUv - .5; vec2 uv = .5 + c * (1. + .09 * dot(c,c) * 4.);
      if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }
      vec3 col = texture2D(feed, uv).rgb + texture2D(feed, uv + vec2(.0016, 0.)).rgb * .35; col /= 1.35;
      col = col / (1. + col); col = pow(col, vec3(1./2.2));
      float l = dot(col, vec3(.299,.587,.114)); l = smoothstep(.02, .85, l) * 1.08;
      vec3 m = vec3(l * .9, l * 1.0, l * .86);
      float n = h(floor(uv * vec2(800., 600.)) + floor(time * 24.) * 1.71 + seed) - .5; m += n * .075;
      m *= .86 + .14 * sin(uv.y * 600. * 3.14159);
      float band = exp(-pow(fract(uv.y + time * .07 + seed) - .5, 2.) * 90.); m *= 1. + .05 * band;
      m *= smoothstep(.75, .3, length(c * vec2(.9, 1.1)));
      vec4 o = texture2D(osd, vUv); m = mix(m, o.rgb, o.a * .9);
      gl_FragColor = vec4(m * sig, 1.); }` });
FEEDS.forEach(f => { f.mat = crtMat(f); LOB.screens[SCREEN_OF[f.i]].material = f.mat; });
// story clock for the timestamps (seconds since midnight): 02:41 at the start, 03:00:00 on "Alas-tres", real time after; the replay reads 03:05-03:07
const T3 = at('s6', 'alas-tres');
const clockAt = t => t < T3 ? 9660 + (t / Math.max(T3, 1)) * (10800 - 9660 - 2) : 10800 + (t - T3) * 1.0;
const fmt = s => { s = Math.floor(s); const p = n => String(n).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; };
function drawOSD(f, t, clockS, play) {
  const g = f.osdC.getContext('2d'); g.clearRect(0, 0, 800, 600); g.font = '34px Anton'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,230,.95)'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6;
  g.textAlign = 'left'; g.fillText(`${f.name}  ${f.where}`, 115, 40); g.textAlign = 'right'; g.fillText(`31-10-2019  ${fmt(clockS)}`, 685, 40);
  if (play) { g.textAlign = 'left'; g.fillText('PLAYBACK  ▶', 115, 525); } else if (Math.floor(t * 1.2) % 2 === 0) { g.fillStyle = 'rgba(255,60,50,.95)'; g.beginPath(); g.arc(127, 543, 10, 0, 7); g.fill(); g.fillStyle = 'rgba(235,240,230,.95)'; g.textAlign = 'left'; g.fillText('REC', 147, 525); }
  f.osd.needsUpdate = true;
}

// ---------- post: optional depth of field, a little bloom, then the grade (ink edges, warm/cool split, grain, vignette, the dip between shots) ----------
const camera = new THREE.PerspectiveCamera(40, W / H, .03, 140); window.__cam = camera;
const composer = new EffectComposer(gl); composer.setSize(W, H);
const rp = new RenderPass(LOB.S, camera); composer.addPass(rp);
const bokeh = new BokehPass(LOB.S, camera, { focus: 2, aperture: .004, maxblur: .008 }); composer.addPass(bokeh);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .5, .55, .78)); composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 }, bright: { value: 1 }, cool: { value: .5 }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, bright, cool; uniform vec2 res; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    float lum(vec2 uv){ return dot(texture2D(tDiffuse, uv).rgb, vec3(.299,.587,.114)); }
    void main(){ vec2 px = 1.5 / res; vec3 c = texture2D(tDiffuse, vUv).rgb;
      float gx = lum(vUv + vec2(px.x,0.)) - lum(vUv - vec2(px.x,0.)), gy = lum(vUv + vec2(0.,px.y)) - lum(vUv - vec2(0.,px.y));
      float e = smoothstep(.05, .22, length(vec2(gx, gy))); c *= 1. - .3 * e;
      float l = dot(c, vec3(.299,.587,.114));
      c = mix(c, c * vec3(.86, .98, 1.12), cool * (1. - smoothstep(.15, .6, l)));
      c = mix(c, c * vec3(1.06, 1.0, .9), smoothstep(.45, .9, l) * .6);
      c = mix(vec3(l), c, .82);
      vec2 d = vUv - .5; c *= mix(.32, 1., smoothstep(.95, .25, length(d * vec2(1., .8))));
      float n = h(floor(vUv * vec2(540., 960.)) + floor(time * 24.) * 1.37) - .5; c += n * (.035 + .045 * (1. - l));
      gl_FragColor = vec4(c * bright, 1.); }` });
composer.addPass(grade);

// ---------- poses ----------
function guardSeated(p, t, o = {}) {
  resetArms(p); seat(p, o.lean ?? .08); p.hips.position.y = .56;
  const b = breathe(p, t, o.rate ?? .24, o.breath ?? 1, 1);
  setArm(p.arms[0], -.95, .15, .1, -.55); setArm(p.arms[1], -.9, -.15, -.1, -.6);   // forearms on the desk
  p.head.rotation.x = (o.headX ?? -.05) + .02 * b; p.head.rotation.y = o.headY ?? 0; p.neck.rotation.y = o.neckY ?? 0;
  blink(p, t, o.blinkP ?? 3.4, 2, o.shut ?? -1); if (o.fear) tremble(p, t, o.fear);
  p.lids.forEach(l => l.scale.y = o.wide ? lerp(1, .6, o.wide) : 1);
}
function kidAt(set, x, y, z, ry) { set.S.add(KID.g); KID.g.visible = true; KID.g.position.set(x, y, z); KID.g.rotation.set(0, ry, 0); }
function kidIdle(t, o = {}) { resetArms(KID); KID.legs.forEach(l => { l.j1.rotation.set(0, 0, 0); l.j2.rotation.set(0, 0, 0); });
  breathe(KID, t, .18, .4, 3); KID.arms.forEach((a, i) => { a.j1.rotation.z = (i ? -1 : 1) * .05; a.j2.rotation.x = -.05; });
  KID.head.rotation.set(o.headX ?? .32, o.headY ?? 0, o.headZ ?? .06); hair(KID, t, o.wind ?? .3, o.part ?? 0); grin(KID, o.grin ?? 0); }

// world state per time (lights, bulb, steam, clock...): shared by the main camera and the feeds
function worldState(t) {
  const sMorning = SH.morning ? seg(t, SH.morning.a - .5, SH.morning.a + 1.5) : 0;
  // the bulb at the end of the third floor: dead until "umilaw" in s7, then glows on over 1.6 s, a slow uneven breathing after that (never a strobe)
  const on = ss(seg(t, at('s7', 'umilaw') - .2, at('s7', 'umilaw') + 1.4)) * (t < (SH.rub ? SH.rub.a + 2 : 1e9) || t > (SH.replay3 ? SH.replay3.a : 1e9) ? 1 : 1);
  const breatheL = .85 + .15 * Math.sin(t * 1.3) * Math.sin(t * .37);
  HALL.bulbL.intensity = 3.2 * on * breatheL; HALL.bulbGlow.material.opacity = .8 * on * breatheL; HALL.bulb.material.color.setRGB(lerp(.2, 1, on), lerp(.16, .85, on), lerp(.12, .55, on));
  HALL.dust.update(t); HALL.haze.update(t);
  LOB.steam.update(t, 1 - sMorning * .6); LOB.lobbyDust.update(t); LOB.fog.update(t);
  LOB.fanBlades.rotation.z = -t * 9;
  // morning: the light through the entrance turns pale, the tube comes on steadier
  LOB.moonIn.color.setRGB(lerp(.49, .78, sMorning), lerp(.59, .8, sMorning), lerp(.85, .86, sMorning)); LOB.moonIn.intensity = lerp(40, 90, sMorning);
  LOB.fluo.intensity = lerp(7, 11, sMorning) * (1 - .12 * Math.sin(t * 2.1) ** 8);
  LOB.S.fog.density = lerp(.04, .025, sMorning);
  // the booth clock follows the story clock (morning: 06:04)
  const cs = t > (SH.morning ? SH.morning.a : 1e9) ? 21840 + (t - SH.morning.a) : clockAt(t);
  LOB.clock.sec.rotation.z = -((cs % 60) / 60) * Math.PI * 2; LOB.clock.min.rotation.z = -((cs / 60) % 60) / 60 * Math.PI * 2; LOB.clock.hr.rotation.z = -((cs / 3600) % 12) / 12 * Math.PI * 2;
  // the monitors light the booth (their brightness follows what they show)
  LOB.monLight.intensity = 2.4 + .25 * Math.sin(t * 3.1);
  return { sMorning, cs };
}

// where the girl and the guard are for a given feed/location at time t (the same rules for the main camera and every CCTV camera)
function stage(t, view) {
  KID.g.visible = false; DOUBLE.g.visible = false; REL.g.visible = false; torchProp.visible = false; rosary.visible = false;
  LOB.torch.intensity = 0; LOB.beam.material.opacity = 0; LOB.beamDust.m.opacity = 0; LOB.door.rotation.y = 0;
  const s = SHOTS.find(x => t >= x.a && t < x.b) || SHOTS[SHOTS.length - 1], n = s.name;
  // --- the girl ---
  if (n === 'girl' || (n === 'bulb' && t > at('s7', 'umilaw') + 1.2) || (n === 'rub' && t < at('s10', 'wala') + .05)) {
    kidAt(HALL, HALL.spot.x, 0, HALL.spot.z + .25, Math.PI); const w = n === 'girl' ? lerp(.15, 1, ss(seg(t, at('s9', 'buhok'), at('s9', 'buhok') + 1.2))) : .15;
    kidIdle(t, { headX: .35, wind: w });
  }
  if (n === 'cam2') {   // one step lower on every blink: step k at each of the blinks
    const BL = blinks(); let k = 15; BL.forEach(b => { if (t > b) k--; }); const S = LOB.stairs;
    kidAt(LOB, S.x + .2, (k + 1) * S.rise, S.z0 - k * S.step + .02, 0); kidIdle(t, { headX: .5, wind: .25 });
  }
  if (n === 'cam1' || n === 'smile') {
    kidAt(LOB, 1.95, 0, 1.75, Math.PI / 2);
    if (n === 'smile') {   // she turns round to the camera (her feet don't move: the body pivots in small stiff steps), then her head tilts back and the grin opens
      const a0 = SH.smile.a, turn = seg(t, a0 + .3, at('s14', 'tumingala') + .4), stiff = Math.floor(turn * 9) / 9 * .55 + ss(turn) * .45;
      KID.g.rotation.y = Math.PI / 2 - lerp(0, Math.PI * .78, stiff);
      const up = ss(seg(t, at('s14', 'tumingala'), at('s14', 'ngumiti') + .2)), g = ss(seg(t, at('s14', 'ngumiti') - .1, at('s14', 'ngumiti') + 1.6));
      kidIdle(t, { headX: lerp(.4, -.18, up), headZ: lerp(.06, .38, up), part: lerp(0, 1, up), grin: g, wind: .15 });
    } else kidIdle(t, { headX: .3, wind: .15 });
  }
  if (n === 'door' && t > at('s16', 'katabi') - .4 || n === 'beside') {
    if (view === 'CAM 4') { kidAt(LOB, 3.72, 0, .62, .15); kidIdle(t, { headX: n === 'beside' ? -.1 : .2, headY: .25, headZ: .25, part: .6, wind: .1, grin: n === 'beside' ? .35 : 0 });
      KID.torso.rotation.x = .25; KID.torso.rotation.z = -.15; }
  }
  // --- the guard on the recording (third floor) ---
  if (n === 'replay3' || n === 'turn') {
    DOUBLE.g.visible = true; DOUBLE.g.position.set(HALL.spot.x, 0, HALL.spot.z + .35); stand(DOUBLE); resetArms(DOUBLE); DOUBLE.hips.position.y = .92; breathe(DOUBLE, t, .05, .2, 0);
    DOUBLE.g.rotation.y = Math.PI; DOUBLE.head.rotation.x = .25; grin(DOUBLE, 0); blink(DOUBLE, t, 99, 0, 0);
    if (n === 'turn') { const a0 = at('s25', 'lumingon'), hd = ss(seg(t, a0 - .2, a0 + 2.2)), bd = ss(seg(t, a0 + 1.2, at('s25', 'ngumiti') + .4));
      DOUBLE.head.rotation.y = lerp(0, -1.5, hd) * (1 - bd) + lerp(0, 0, bd); DOUBLE.g.rotation.y = Math.PI - lerp(0, Math.PI, bd); DOUBLE.head.rotation.x = lerp(.25, -.1, bd); DOUBLE.head.rotation.z = lerp(0, .32, bd); DOUBLE.lids.forEach(l => l.scale.y = lerp(1, .5, bd));
      grin(DOUBLE, ss(seg(t, at('s25', 'ngumiti') - .1, at('s25', 'ngumiti') + 1.8))); blink(DOUBLE, t, 99, 0, 0); }
  }
  // --- the reliever in the morning ---
  if (['morning', 'replay', 'replay3', 'empty', 'turn'].includes(n)) { REL.g.visible = true; stand(REL); resetArms(REL); REL.hips.position.y = .92; REL.g.position.set(2.85, 0, 2.05); REL.g.rotation.y = Math.PI * .58; breathe(REL, t, .25, 1, 2); blink(REL, t, 3.1, 5);
    setArm(REL.arms[1], -.4, 0, -.1, -.6); if (n === 'empty' || n === 'turn') { REL.head.rotation.y = .5; } if (n === 'morning') { const w = seg(t, SH.morning.a, SH.morning.a + 3.5); REL.g.position.x = lerp(1.0, 2.85, ss(w)); REL.g.position.z = lerp(3.6, 2.05, ss(w)); REL.g.rotation.y = lerp(Math.PI * .8, Math.PI * .58, ss(w)); } }
  return n;
}
const blinks = (() => { let c; return () => { if (c) return c; const a = SH.cam2.a + 1.1, b = SH.cam2.b - .6, n = 5; c = []; for (let i = 0; i < n; i++) c.push(lerp(a, b, (i + .5) / n)); return c; }; })();
window.blinksCam2 = () => blinks();

// the main guard's acting per shot
function act(t, n) {
  const p = ME; p.g.visible = true;
  switch (n) {
    case 'rub': { const a0 = at('s10', 'kinusot'), r = ss(seg(t, a0 - .3, a0 + .3)) * (1 - ss(seg(t, a0 + 1.4, a0 + 1.9)));
      guardSeated(p, t, { headX: lerp(-.05, .15, r), fear: .2 * (1 - r), wide: ss(seg(t, at('s10', 'wala'), at('s10', 'wala') + .6)) });
      for (const [i, s] of [[0, 1], [1, -1]]) setArm(p.arms[i], lerp(-.95, -2.0, r), s * lerp(.15, .35, r), s * lerp(.1, .45, r), lerp(-.55, -1.9, r)), p.arms[i].end.rotation.x = Math.sin(t * 14) * .25 * r;
      blink(p, t, 99, 0, r); break; }
    case 'flashlight': { const a0 = SH.flashlight.a, up = ss(seg(t, a0, a0 + 1.6));
      resetArms(p); p.hips.position.y = lerp(.56, .92, up); if (up < .99) seat(p, .08 * (1 - up)); else stand(p);
      p.legs.forEach(l => { l.j1.rotation.x *= (1 - up); l.j2.rotation.x *= (1 - up); });
      p.g.position.set(lerp(3.68, 3.2, up), 0, lerp(1.15, 1.0, up)); p.g.rotation.y = lerp(Math.PI / 2, -Math.PI * .72, ss(seg(t, a0 + .8, a0 + 2.2)));
      breathe(p, t, .45, 1.6, 1); blink(p, t, 2.6, 2);
      const aim = ss(seg(t, a0 + 1.6, a0 + 2.6)); setArm(p.arms[1], lerp(0, -1.45, aim), 0, 0, lerp(0, -.15, aim)); torchProp.visible = aim > .02;
      setArm(p.arms[0], lerp(0, -.3, aim), 0, .1, -.4); tremble(p, t, .5); p.head.rotation.x = .08;
      if (aim > .02) { torchProp.updateWorldMatrix(true, false); const o = new THREE.Vector3(0, 0, .18).applyMatrix4(torchProp.matrixWorld), d = new THREE.Vector3(0, 0, 1).transformDirection(torchProp.matrixWorld);
        // the beam searches the stairs: a slow sweep with the tremor in it
        const sweep = new THREE.Vector3(-6.2, lerp(.5, 2.4, .5 + .5 * Math.sin((t - a0) * .6)), lerp(-2.5, -5.8, .5 + .5 * Math.sin((t - a0) * .45 + 1))); d.copy(sweep.sub(o).normalize());
        LOB.torch.position.copy(o); LOB.torch.target.position.copy(o).addScaledVector(d, 6); LOB.torch.intensity = 130 * aim;
        LOB.beam.position.copy(o); LOB.beam.lookAt(LOB.torch.target.position); LOB.beam.material.opacity = .055 * aim; LOB.beamDust.m.opacity = .7 * aim; LOB.beamDust.update(t); }
      break; }
    case 'door': { const a0 = at('s16', 'tumingin'), look = ss(seg(t, a0 - .2, a0 + .9)) * (1 - ss(seg(t, at('s16', 'pero') - .1, at('s16', 'pero') + .7)));
      guardSeated(p, t, { neckY: lerp(0, 1.25, look), headY: lerp(0, .35, look), fear: .5, rate: .4, wide: ss(seg(t, at('s16', 'katabi') - .2, at('s16', 'katabi') + .4)) }); break; }
    case 'beside': guardSeated(p, t, { fear: 1.1, rate: .55, breath: 1.6, wide: 1, headX: .05, neckY: -.08, blinkP: 99 }); break;
    case 'pray': case 'cta': { guardSeated(p, t, { shut: 1, fear: .7, rate: .4, headX: .28, lean: .25 });
      for (const [i, s] of [[0, 1], [1, -1]]) setArm(p.arms[i], -1.25, s * .55, s * .3, -1.35); rosary.visible = true; tremble(p, t, .7); break; }
    case 'morning': case 'replay': case 'replay3': case 'turn': guardSeated(p, t, { lean: .18, fear: .25, rate: .3, headX: .02 }); break;
    case 'empty': guardSeated(p, t, { lean: .12, fear: .6, wide: .8, rate: .45, headX: -.05, blinkP: 99 }); break;
    default: guardSeated(p, t, { fear: n === 'girl' || n === 'cam2' || n === 'cam1' || n === 'smile' ? .35 : 0, rate: n === 'smile' ? .4 : .24 });
  }
  if (!['flashlight'].includes(n)) { p.g.position.set(3.68, 0, 1.15); p.g.rotation.y = Math.PI / 2; }
}

// ---------- the feeds ----------
function renderFeed(f, t, o = {}) {
  stage(t, f.name);
  if (f.name === 'CAM 4' || f.set === LOB) act(t, (SHOTS.find(x => t >= x.a && t < x.b) || {}).name);
  // a slow digital zoom when the story looks closer
  f.cam.fov = o.fov ?? f.base.fov; f.cam.position.set(...f.pos); f.cam.lookAt(o.look || f.base.look); f.cam.updateProjectionMatrix();
  f.ir.visible = true; gl.setRenderTarget(f.rt); gl.toneMapping = THREE.NoToneMapping; gl.render(f.set.S, f.cam); gl.setRenderTarget(null); f.ir.visible = false; gl.toneMapping = THREE.ACESFilmicToneMapping;
  drawOSD(f, t, o.clock ?? clockAt(t), o.play); f.mat.uniforms.time.value = t; f.mat.uniforms.sig.value = o.sig ?? 1;
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z); let POV = false;
const SC = i => { const m = LOB.screens[i]; m.updateWorldMatrix(true, false); return new THREE.Vector3().setFromMatrixPosition(m.matrixWorld); };
// a camera looking straight into monitor i from dist, drifting a little (the guard's eyes)
function intoScreen(t, i, dist, o = {}) { const c = SC(i); dist *= 1.7; POV = true; camera.fov = o.fov ?? 34; camera.position.set(c.x - dist, c.y + (o.dy ?? 0) + .006 * wob(t, 1, .4), c.z + (o.dz ?? 0) + .008 * wob(t, 2, .35)); camera.lookAt(c.x, c.y + (o.ly ?? 0), c.z + (o.lz ?? 0)); camera.rotateZ(.004 * wob(t, 3, .3)); }
function handheld(t, amt = 1, k = 0) { camera.position.x += .012 * amt * wob(t, 1 + k, .5); camera.position.y += .009 * amt * wob(t, 2 + k, .45); camera.rotateZ(.004 * amt * wob(t, 3 + k, .4)); }
function look(px, py, pz, tx, ty, tz, fov) { camera.position.set(px, py, pz); camera.fov = fov; camera.lookAt(tx, ty, tz); }
const lerpV = (a, b, u) => a.map((x, i) => lerp(x, b[i], u));

// ---------- the shots ----------
// the guard's face, from his actual pose this frame: F = a point between the eyes, FD = the way his body faces (flat)
const F = new THREE.Vector3(), FD = new THREE.Vector3();
function faceOf(t, n) { stage(t, 'MAIN'); act(t, n); ME.g.updateMatrixWorld(true); F.set(0, .22, .19).applyMatrix4(ME.head.matrixWorld); ME.g.getWorldDirection(FD); FD.y = 0; FD.normalize(); }
// a camera on the guard's face: dist away, yaw radians round toward his right (the open side of the booth), dy above, looking at the face (+ly)
function faceCam(dist, yaw, dy = .03, fov = 32, ly = 0) { dist *= 1.45; fov = Math.min(44, fov * 1.25); const c = Math.cos(yaw), s = Math.sin(yaw), d = new THREE.Vector3(FD.x * c + FD.z * s, 0, -FD.x * s + FD.z * c);
  const x = F.x + d.x * dist, z = F.z + d.z * dist, xc = Math.min(x, 4.36);   // never inside the monitors
  look(xc, F.y + dy, z + (x - xc) * .6, F.x, F.y + ly, F.z, fov); }
function shotCamera(t, n, s) {
  faceOf(t, n);
  const u = (t - s.a) / (s.b - s.a), set = { v: LOB }, dof = { on: false, focus: 2, ap: .004 }; let cool = .5;
  const feedsOn = []; const feed = (i, o) => feedsOn.push([i, o]);
  const allFeeds = (o = {}) => { for (let i = 0; i < 4; i++) feed(i, o); };
  switch (n) {
    case 'hook': { allFeeds(); const p = lerpV([2.2, 2.0, 4.0], [3.3, 1.8, 2.15], sss(u)); look(...p, 4.48, 1.4, 1.1, lerp(42, 34, u)); handheld(t, .5);
      dof.on = true; dof.focus = camera.position.distanceTo(v3(4.48, 1.4, 1.1)); dof.ap = .0025; break; }
    case 'exterior': { set.v = EXT; const up = sss(u); look(lerp(-10, -6, up), lerp(.45, 2.6, up), lerp(9, 3, up), lerp(1, 2, up), lerp(13, 8.4, ss(seg(u, .4, 1))), -30, lerp(56, 44, up)); handheld(t, .4); cool = .85; break; }
    case 'guardhouse': { allFeeds(); const k = seg(t, s.a, at('s4', 'bago'));
      if (k < 1) { look(...lerpV([1.6, 1.55, 5.2], [2.35, 1.45, 3.8], sss(k)), 3.75, 1.2, 1.1, 38); handheld(t, .5); }
      else { const r = ss(seg(t, at('s4', 'kapag') - .3, at('s4', 'camera') + .2)), p = lerpV([3.0, F.y + .02, 1.62], [3.1, F.y, 1.55], seg(t, at('s4', 'bago'), s.b));
        look(...p, 4.48, 1.08, .73, 34); dof.on = true; const ear = F.clone().add(v3(-.12, 0, .1)).distanceTo(camera.position), scr = SC(0).distanceTo(camera.position); dof.focus = lerp(ear, scr, r); dof.ap = .006; }
      break; }
    case 'cam3': case 'bulb': case 'girl': { set.v = LOB; allFeeds(); const tot = SH.girl.b - SH.cam3.a, uu = (t - SH.cam3.a) / tot; feedsOn.splice(2, 1); feed(2, { fov: lerp(46, 30, ss(uu)), look: v3(0, 1.0 + .2 * ss(uu), -22) }); intoScreen(t, 0, lerp(1.05, .56, sss(uu)), { dz: .02 }); break; }
    case 'clock': { const c = v3(3.6, 2.05, .05); look(c.x + .1, c.y - .08, c.z + lerp(.9, .6, sss(u)), c.x, c.y, c.z, 30); dof.on = true; dof.focus = camera.position.distanceTo(c); dof.ap = .01; allFeeds(); break; }
    case 'rub': { allFeeds(); const w = at('s10', 'pagtingin');
      if (t < w) { faceCam(lerp(.78, .66, seg(t, s.a, w)), -.92, .03, 32); handheld(t, .3); dof.on = true; dof.focus = camera.position.distanceTo(F); dof.ap = .01; }
      else intoScreen(t, 0, lerp(.75, .6, seg(t, w, s.b)), { dz: .02 }); feedsOn[2] = [2, { fov: 30, look: v3(0, 1.2, -22) }]; break; }
    case 'cam2': { allFeeds(); intoScreen(t, 3, lerp(.8, .58, sss(u))); let dim = 1; for (const b of blinks()) dim = Math.min(dim, 1 - .55 * Math.exp(-(((t - b) / .12) ** 2))); feedsOn[3] = [3, { sig: dim }]; break; }
    case 'flashlight': { allFeeds(); const p = lerpV([4.45, 2.15, 2.25], [4.3, 2.05, 2.1], sss(u)); look(...p, -4.5, 1.2, -3.2, 44); handheld(t, 1.0); break; }
    case 'cam1': { allFeeds(); feedsOn[0] = [0, { fov: lerp(50, 38, ss(u)), look: v3(2.2, 1.0, 1.55) }]; intoScreen(t, 2, lerp(.85, .6, sss(u))); break; }
    case 'smile': { allFeeds(); const z = ss(seg(t, s.a, at('s14', 'ngumiti') + 1.5)); feedsOn[0] = [0, { fov: lerp(38, 7, z), look: v3(lerp(2.2, 1.96, z), lerp(1.0, 1.15, z), lerp(1.55, 1.74, z)) }]; intoScreen(t, 2, lerp(.6, .5, sss(u))); break; }
    case 'door': { allFeeds(); const a0 = at('s16', 'tumingin'), pe = at('s16', 'pero'), k1 = ss(seg(t, a0 - .2, a0 + 1.2)), k2 = ss(seg(t, pe - .1, pe + 1.6));
      // in front of him, then round to look past him at the door glass (nothing out there), then back to the monitor where she is beside him
      faceCam(.8, -.95, .04, 32); const A = camera.position.toArray(), B = [A[0] - .1, A[1] + .12, A[2] + .15], C = [3.15, F.y + .1, 1.5]; let p = lerpV(A, B, k1); p = lerpV(p, C, k2);
      const tA = F.clone(), tB = v3(2.3, F.y, 1.0), tC = SC(1); const tg = tA.clone().lerp(tB, k1).lerp(tC, k2); look(...p, tg.x, tg.y, tg.z, lerp(32, 30, k2)); handheld(t, .6);
      dof.on = true; dof.focus = camera.position.distanceTo(tg); dof.ap = .005; break; }
    case 'beside': { allFeeds(); const b1 = at('B1'), s17 = at('s17'), b2 = at('B2');
      if (t < s17 - .3) { faceCam(lerp(.85, .7, sss(seg(t, s.a, s17))), -1.45, .02, 30); handheld(t, .25); dof.on = true; dof.focus = camera.position.distanceTo(F); dof.ap = .012; }
      else if (t < b2 - .4) { intoScreen(t, 1, lerp(.62, .5, seg(t, s17, b2)), { ly: .02 }); feedsOn[3] = [3, { fov: lerp(72, 40, ss(seg(t, s17 - .3, b2))), look: v3(3.72, 1.15, .9) }]; }
      else { faceCam(lerp(.66, .56, seg(t, b2, s.b)), -.9, .02, 30); handheld(t, .25); dof.on = true; dof.focus = camera.position.distanceTo(F); dof.ap = .012; }
      break; }
    case 'pray': { allFeeds(); faceCam(lerp(.9, .72, sss(u)), -.9, .02, 34, -.1); dof.on = true; dof.focus = camera.position.distanceTo(F); dof.ap = .008; break; }
    case 'cta': { allFeeds(); look(...lerpV([-.5, 1.6, 5.2], [.4, 1.5, 4.6], sss(u)), 3.6, 1.3, 1.2, 40); handheld(t, .3); break; }
    case 'morning': { allFeeds({ play: false }); look(...lerpV([1.2, 1.7, 5.5], [2.4, 1.65, 3.6], sss(u)), 3.8, 1.3, 1.3, 42); handheld(t, .4); cool = .3; break; }
    case 'replay': { const c2 = at('s20', 'camera', 1); if (t < c2 - .15) { allFeeds({ play: true, clock: 11100 + (t - s.a) * 3 }); intoScreen(t, 2, .62); } else { allFeeds({ play: true, clock: 11160 + (t - s.a) * 3 }); intoScreen(t, 3, .6); } cool = .3; break; }
    case 'replay3': { const tot = SH.replay3.b - SH.replay3.a, uu = (t - SH.replay3.a) / tot; allFeeds({ play: true, clock: 11220 + (t - SH.replay3.a) });
      feedsOn[2] = [2, { play: true, clock: 11220 + (t - SH.replay3.a), fov: lerp(46, 7, ss(uu)), look: v3(0, lerp(1.0, 1.25, ss(uu)), -22.5) }]; intoScreen(t, 0, lerp(.9, .52, sss(uu))); cool = .3; break; }
    case 'empty': { allFeeds({ play: true, clock: 11260 }); faceCam(lerp(.75, .62, sss(u)), -.9, .02, 30); dof.on = true; dof.focus = camera.position.distanceTo(F); dof.ap = .01; cool = .3; break; }
    case 'turn': { allFeeds({ play: true, clock: 11262 + (t - s.a) }); feedsOn[2] = [2, { play: true, clock: 11262 + (t - s.a), fov: lerp(7, 3.6, ss(u)), look: v3(0, lerp(1.25, 1.5, ss(u)), -22.5) }]; intoScreen(t, 0, lerp(.52, .46, u)); cool = .3; break; }
    case 'phone': case 'black': { set.v = HOME; const pp = v3(.45, .76, -.35), k = sss(seg(t, SH.phone.a, SH.phone.b)); look(lerp(1.6, .75, k), lerp(1.0, .92, k), lerp(1.2, .1, k), pp.x, pp.y + .02, pp.z, lerp(40, 28, k)); handheld(t, .3);
      dof.on = true; dof.focus = camera.position.distanceTo(pp); dof.ap = .01; cool = .9; break; }
  }
  if (window.debugCam) { const d = window.debugCam; look(d[0], d[1], d[2], d[3], d[4], d[5], d[6]); dof.on = false; POV = !!d[7]; }
  camera.updateProjectionMatrix();
  return { set: set.v, dof, feedsOn, cool };
}

// the home scene (years later): the phone lights up at 3 AM, the old guard sits on the bed edge, out of focus
function homeState(t) {
  const s = SH.phone; if (!s) return; const ring = t > s.a + 1.2, br = ss(seg(t, s.a + 1.0, s.a + 1.8));
  OLD.g.position.set(-1.35, 0, .75); OLD.g.rotation.y = Math.PI * .72; seat(OLD, .25); OLD.hips.position.y = .62; resetArms(OLD); breathe(OLD, t, .3, 1.2, 4); blink(OLD, t, 4, 6);
  setArm(OLD.arms[0], -.7, .1, .1, -.9); setArm(OLD.arms[1], -.7, -.1, -.1, -.9); OLD.head.rotation.x = .15; tremble(OLD, t, .4);
  HOME.phone.rotation.z = ring ? .015 * Math.sin(t * 60) * (Math.sin(t * 2.4) > 0 ? 1 : 0) : 0;
  HOME.phoneL.intensity = 2.4 * br; HOME.curtains.forEach((c, i) => c.rotation.x = .05 * Math.sin(t * .6 + i));
  HOME.dust.update(t);
  const g = HOME.phoneCanvas.getContext('2d'); g.fillStyle = `rgb(${8 + 14 * br},${12 + 20 * br},${20 + 30 * br})`; g.fillRect(0, 0, 270, 540);
  if (br > .01) { g.globalAlpha = br; g.textAlign = 'center'; g.fillStyle = '#e8eef8'; g.font = '64px Anton'; g.fillText('3:00', 135, 110); g.font = '22px Anton'; g.fillStyle = '#b8c4d8'; g.fillText('BIYERNES, NOBYEMBRE 1', 135, 145);
    g.font = '24px Anton'; g.fillStyle = '#c8d4e8'; g.fillText('TUMATAWAG...', 135, 250); g.font = '34px Anton'; g.fillStyle = '#fff'; g.fillText('GUARD HOUSE', 135, 295); g.font = '20px Anton'; g.fillStyle = '#9aa8c0'; g.fillText('(02) 8XXX-XXXX', 135, 328);
    g.fillStyle = '#2fae58'; g.beginPath(); g.arc(80, 460, 30, 0, 7); g.fill(); g.fillStyle = '#d83a3a'; g.beginPath(); g.arc(190, 460, 30, 0, 7); g.fill(); g.globalAlpha = 1; }
  HOME.phoneTex.needsUpdate = true;
}

// ---------- 2D on top: the hook title, the CTA card, captions ----------
function rr(x, y, w, h, r) { cx.beginPath(); cx.roundRect(x, y, w, h, r); }
function card(lines, a, y = 300) { if (a <= 0) return; cx.save(); cx.globalAlpha = a; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  lines.forEach(([s, px, col, glow, dy]) => { cx.font = `${px}px Anton`; const k = Math.min(1, 940 / cx.measureText(s).width); cx.save(); cx.translate(540, y + dy); cx.scale(k, k); cx.lineJoin = 'round'; cx.lineWidth = px * .14; cx.strokeStyle = 'rgba(4,4,6,.92)'; cx.strokeText(s, 0, 0);
    if (glow) { cx.shadowColor = glow; cx.shadowBlur = px * .3; } cx.fillStyle = col; cx.fillText(s, 0, 0); cx.restore(); }); cx.restore(); }
function captions(t) {
  const l = [...TL.lines].reverse().find(x => x.words && t >= x.t0 - .02); if (!l || t > l.t1 + .35) return;
  let k = -1; l.words.forEach((w, i) => { if (t >= w[1] - .02) k = i; }); if (k < 0) return;
  const per = 3, a = Math.floor(k / per) * per, ws = l.words.slice(a, a + per), keys = (l.key || []).map(x => x.toLowerCase().replace(/[^a-z0-9']/g, '')), child = l.voice === 'bata';
  const px = child ? 84 : 92, y = 1500; cx.font = `${px}px Anton`; const widths = ws.map(w => cx.measureText(w[0].toUpperCase()).width), gap = 40, total = widths.reduce((s, v) => s + v, 0) + gap * (ws.length - 1), sc = Math.min(1, 980 / total); let x = 540 - total * sc / 2;
  ws.forEach((w, i) => { const idx = a + i; if (idx > k) return; const isKey = keys.some(kk => kk && w[0].toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(kk)), p = clamp((t - w[1]) / .18), s = sc * (idx === k ? lerp(1.08, 1, ss(p)) : 1);
    cx.save(); cx.globalAlpha = clamp(p * 3); cx.translate(x + widths[i] * sc / 2, y); cx.scale(s, s); cx.font = `${px}px Anton`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.shadowColor = 'rgba(0,0,0,.85)'; cx.shadowBlur = 20; cx.lineWidth = 15; cx.strokeStyle = '#050507'; cx.lineJoin = 'round'; cx.strokeText(w[0].toUpperCase(), 0, 0);
    cx.shadowBlur = isKey ? 24 : 0; cx.shadowColor = child ? 'rgba(150,200,255,.8)' : 'rgba(220,30,40,.85)'; cx.fillStyle = child ? (isKey ? '#bfe0ff' : '#e6eef8') : (isKey ? '#ff2a3a' : '#f4f1ea'); cx.fillText(w[0].toUpperCase(), 0, 0); cx.restore(); x += (widths[i] + gap) * sc; });
}

// ---------- the frame ----------
function frame(t) {
  const s = SHOTS.find(x => t >= x.a && t < x.b) || SHOTS[SHOTS.length - 1];
  worldState(t); homeState(t); EXT.update(t);
  POV = false; const C = shotCamera(t, s.name, s);
  // feeds first (each poses the world for its own camera), then the main view
  for (const [i, o] of C.feedsOn) renderFeed(FEEDS[i], t, o || {});
  stage(t, 'MAIN'); act(t, s.name); ME.g.visible = !POV;
  rp.scene = C.set.S; bokeh.scene = C.set.S; bokeh.enabled = C.dof.on;
  if (C.dof.on) { bokeh.uniforms.focus.value = C.dof.focus; bokeh.uniforms.aperture.value = C.dof.ap; bokeh.uniforms.maxblur.value = .012; }
  // the dip between shots (a soft breath of dark, never a flash), and the fade at the very end
  let dip = 1; for (const x of SHOTS) if (x.a > .1) dip = Math.min(dip, 1 - .9 * Math.exp(-(((t - x.a) / .16) ** 2)));
  const end = SH.black ? 1 - ss(seg(t, SH.black.a, SH.black.a + 1.2)) : 1, start = ss(seg(t, 0, .5));
  grade.uniforms.bright.value = dip * end * lerp(.2, 1, start); grade.uniforms.cool.value = C.cool; grade.uniforms.time.value = t;
  composer.render();
}
window.renderAt = t => {
  frame(t); cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H); cx.drawImage(gl.domElement, 0, 0);
  const hook = SH.hook, ta = hook ? 1 - ss(seg(t, hook.b - .8, hook.b - .1)) : 0;
  card([['TOTOONG KWENTO', 150, '#f4f1ea', 'rgba(255,40,50,.55)', -60], ['HALLOWEEN 2019 · 3:07 AM', 74, '#ff3a44', 'rgba(255,40,50,.6)', 70]], ta * ss(seg(t, .2, 1.0)), 330);
  if (SH.cta) { const c = SH.cta, a = ss(seg(t, c.a + .3, c.a + 1.0)) * (1 - ss(seg(t, c.b - .6, c.b))); card([['PIPIKIT KA?', 130, '#f4f1ea', 'rgba(255,40,50,.5)', -70], ['O TITINGIN?', 130, '#ff3a44', 'rgba(255,40,50,.6)', 70]], a, 360); }
  if (SH.black) { const b = SH.black, a = ss(seg(t, b.a + 1.0, b.a + 1.8)) * (1 - ss(seg(t, DUR - .5, DUR))); card([['ANG BATA SA CCTV', 104, '#d8d4cc', null, 0]], a * .9, 960); }
  if (!SH.black || t < SH.black.a + .6) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('40px Caveat')]).then(() => true);
