
// ==================== the shots: every event time comes from a word in the script, so the picture follows the narrator ====================
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const W_WALANG = wordT('h2', 'walang'), W_NAKAPUTI3 = wordT('s3', 'nakaputi'), W_SALAMIN3 = wordT('s3', 'titingin'), W_PINAPARA = wordT('s5', 'Pinapara'), W_TUYO = wordT('s6', 'tuyo'),
  W_SUMAKAY = wordT('s7', 'Sumakay'), W_LAMIG = wordT('s7', 'lumamig'), W_KALIWA = wordT('s9', 'Kaliwa'), W_ULIT = wordT('s9', 'ulit'), W_PAIKOT = wordT('s9', 'paikot'),
  W_NANDOON = wordT('s10', 'nandoon'), W_WALANG12 = wordT('s12', 'Walang'), W_LUBOG = wordT('s12', 'lubog'), W_KANDILA = wordT('s13', 'Kandila'), W_LUPA = wordT('s13', 'Lupa'),
  W_LILINGON = wordT('cta', 'lilingon'), W_MAGDASAL = wordT('cta', 'magdadasal'), W_PUMIKIT = wordT('s14', 'Pumikit'), W_NANDITO = wordT('L4', 'nandito'), W_BUMUKAS = wordT('s16', 'Bumukas'),
  W_SUMARA = wordT('s16', 'Sumara'), W_SAMPA = wordT('s16', 'sampaguita'), W_NAGBUKAS = wordT('s17', 'nagbukas'), W_LITRATO = wordT('s18', 'litrato'), W_ELENA = wordT('s19', 'Elena'),
  W_BUMANGGA = wordT('s20', 'bumangga'), W_IKA14 = wordT('s21', 'ikalabing'), W_KAMAY = wordT('s23', 'kamay'), W_LOOB = wordT('s23', 'loob'), W_GILID = wordT('s24', 'gilid'),
  W_HIHINTO = wordT('s25', 'hihinto');
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);
const passing = (t, per = 2.6, y = 800, r = 900, a = .5) => { const p = ((t % per) + per) % per / per; L(lerp(-500, 1600, p), y, r, C.sodium, a * Math.sin(Math.PI * p), .06 * Math.sin(Math.PI * p)); };
function bokeh(t, n, y0, y1, sp = 30, a = .7, seed = 0) {       // out-of-focus city lights through rain
  for (let i = 0; i < n; i++) { const c = [C.sodium, C.warm, C.red, C.cyan, C.mag, C.grn][Math.floor(hash(i * 3.3 + seed) * 6)], x = ((hash(i * 1.7 + seed) * 1600 + t * sp * (.5 + hash(i))) % 1600) - 260, y = lerp(y0, y1, hash(i * 5.9 + seed)), r = 20 + 60 * hash(i * 2.2 + seed);
    g.fillStyle = rg(x, y, r * .5, r, [`rgba(${c},${a * .5})`, `rgba(${c},${a * .35})`, `rgba(${c},0)`]); g.fillRect(x - r, y - r, 2 * r, 2 * r); L(x, y, r * 1.5, null, .5); }
}
function interiorDark() { g.fillStyle = '#060609'; g.fillRect(-600, -600, 2300, 3200); }
function dashboard(y, t, o = {}) {       // the dash across the bottom of the frame: a hump, the vents, the meter glow
  g.beginPath(); g.moveTo(-600, y + 80); g.quadraticCurveTo(540, y - 60, 1700, y + 80); g.lineTo(1700, 2600); g.lineTo(-600, 2600); g.closePath(); g.fillStyle = lg(0, y - 60, 0, y + 500, PAL.dash); g.fill();
  line([[-600, y + 78], [1700, y + 78]], 4, 'rgba(140,160,200,.25)');
  for (const vx of [180, 900]) { rr(vx - 80, y + 120, 160, 50, 12); fs('#0a0a0e', 3); for (let k = 0; k < 5; k++) line([[vx - 70, y + 130 + k * 9], [vx + 70, y + 130 + k * 9]], 2, '#26262e'); }
  const sx = o.santo ?? 300, sy = y + 30; ell(sx, sy, 34, 60); fs(lg(0, sy - 60, 0, sy + 60, ['#c8283a', '#7a1020']), 3); circ(sx, sy - 74, 22, '#e8c8a0'); path([[sx - 22, sy - 92], [sx + 22, sy - 92], [sx, sy - 128]]); g.closePath(); fs('#e0b840', 3); circ(sx + 22, sy - 20, 9, '#7aa0e0'); line([[sx + 22, sy - 30], [sx + 22, sy - 48]], 4, '#e0b840');
  if (o.meter) { meter(o.meter[0], o.meter[1], o.meter[2] || 60, t, o.mtxt); sampaguita(o.meter[0], o.meter[1] - (o.meter[2] || 60) * .9, (o.meter[2] || 60) * .9, t, { n: 18 }); }
}

const S = {};
// ---------- hook: the rear-view mirror, very close. In it, the back seat: empty, but sunk in, as if someone sits there ----------
function hookScene(t, k) {
  const wl = k > 0 ? ss(seg(k, W_WALANG - .2, W_WALANG + .6)) : 0;
  setCam({ x: 540, y: 860, z: 1.02, dz: lerp(0, .34, ss(seg(k, -2, 10))), rot: -.035 + .012 * Math.sin(t * .4), focus: 1, dof: 24, shake: .5, t });
  layer(4, () => { nightSky(t, { top: '#04050c', bot: '#14182a' }); g.fillStyle = '#0a0b10'; g.fillRect(-600, 980, 2300, 1500); bokeh(t, 22, 500, 1000, 40, .8, 3); });
  layer(1.8, () => { g.fillStyle = '#050508'; g.fillRect(-700, -700, 2500, 760); path([[-700, 60], [-700, 2600], [-120, 2600], [140, 60]]); g.closePath(); g.fill(); path([[1800, 60], [1800, 2600], [1200, 2600], [940, 60]]); g.closePath(); g.fill(); dashboard(1500, t); });
  layer(1, () => mirror(540, 780, 780, 260, -.03, (w, h) => {
    g.fillStyle = '#0c0e16'; g.fillRect(-w, -h, 2 * w, 2 * h);
    rr(-w * .42, -h * .62, w * .84, h * .42, 24); g.fillStyle = '#0a0c18'; g.fill(); g.save(); g.clip(); bokeh(t * .6, 10, -h * .6, -h * .2, 20, .8, 9); g.restore();
    backSeat(-w * .46, h * .02, w * .92, h * .8, { sag: .55 + .45 * wl, u: .7, belt: wl, t }); L(w * .2, h * .2, w * .5, C.ice, .55 + .25 * wl, .05);
  }, t));
  layer(.5, () => { ell(60, 1650, 420, 520); g.fillStyle = lg(-300, 1200, 400, 2100, [DRV.hood[1], DRV.hood[2], '#05060a']); g.fill(); ell(1090, 1900, 300, 300); g.fillStyle = '#07070b'; g.fill(); });
  passing(t, 2.8, 700, 900, .45); L(540, 780, 520, C.dash, .35, .04);
  lightPass('#151a2c');
  windshield(t, { x0: 0, y0: 0, x1: W, y1: 560, wipers: 0, n: 70, a: .75 });
  flares();
}
S.hook = (t, u) => hookScene(t, u);
S.loop = (t, u) => hookScene(t, u - (TL.dur - T('tail')));
// ---------- Quezon City, 2 a.m., rain: a crane down from the wires to the wet street; the taxi comes at us ----------
S.city = (t, u) => { const c = ss(seg(u, 0, span('s1') + .6)), tx = seg(u, 0, span('s1') + 1.2);
  setCam({ x: 540, y: lerp(260, 900, c), z: lerp(1.18, 1.0, c), rot: lerp(.05, 0, c), focus: 1.5, dof: 14, t });
  layer(5, () => { nightSky(t); g.save(); g.translate(-700, 420); g.drawImage(TEX.city, 0, 0, 2400, 900); g.restore(); L(540, 900, 1200, C.sodium, .4, .05); });
  layer(2.4, () => {
    for (const sg of [-1, 1]) { const xo = sg < 0 ? -300 : 1380, xi = sg < 0 ? 420 : 660;
      g.beginPath(); g.moveTo(xo, -400); g.lineTo(xi, 640); g.lineTo(xi, 980); g.lineTo(xo, 2200); g.closePath(); g.fillStyle = lg(xo, 0, xi, 0, sg < 0 ? ['#2a2630', '#14121a'] : ['#2a2a36', '#121218']); g.fill();
      for (let r = 0; r < 9; r++) for (let q = 0; q < 4; q++) { const v = (q + .2) / 4.4, fy0 = lerp(lerp(-400, 2200, r / 9), lerp(640, 980, r / 9), v), fy1 = lerp(lerp(-400, 2200, (r + .6) / 9), lerp(640, 980, (r + .6) / 9), v), fx = lerp(xo, xi, v), fw = (xi - xo) / 4.4 * .55;
        if (hash(r * 7 + q * 3 + sg) > .55) { g.fillStyle = `rgba(255,${190 + 40 * hash(r + q)},120,.9)`; g.fillRect(fx, fy0, fw, (fy1 - fy0) * .5); L(fx + fw / 2, (fy0 + fy1) / 2, 60, C.warm, .7, .1); } } }
    rr(40, 520, 300, 90, 10); fs('#1a0a14', 4); text('LUGAWAN 24 ORAS', 190, 566, 40, '#ff6fb0', 'Anton'); L(190, 566, 420, C.mag, .95, .4); F(190, 566, 260, C.mag, .35);
    rr(740, 590, 250, 80, 10); fs('#06140c', 4); text('BOTIKA', 865, 632, 44, '#6dffa8', 'Anton'); L(865, 632, 360, C.grn, .9, .35); F(865, 632, 220, C.grn, .3);
    for (let k = 0; k < 7; k++) curve([-300, 300 + k * 40], [540, 520 + k * 50 + Math.sin(t * .8 + k) * 6], [1380, 260 + k * 45], 3, '#08080a');
    streetLamp(420, 980, 420, t, { side: 1 }); streetLamp(660, 980, 420, t, { side: -1 });
  });
  layer(1.5, () => {
    const RD = () => { g.beginPath(); g.moveTo(420, 980); g.lineTo(660, 980); g.lineTo(1800, 2400); g.lineTo(-720, 2400); g.closePath(); }; RD(); g.fillStyle = lg(0, 980, 0, 2400, ['#1c1e26', '#2a2c36']); g.fill(); asphalt(RD, .7);
    for (let k = 0; k < 12; k++) { const v = ((k + t * 1.4) % 12) / 12, y0 = lerp(980, 2400, v * v), y1 = lerp(980, 2400, Math.min(1, (v + .035) * (v + .035))); g.fillStyle = 'rgba(240,230,200,.6)'; g.fillRect(540 - lerp(2, 18, v), y0, lerp(4, 36, v), y1 - y0); }
    reflect(190, 566, 1000, 120, C.mag, .35); reflect(865, 632, 1000, 100, C.grn, .3); reflect(540, 900, 1000, 60, C.sodium, .3);
    splashes(t, -200, 1300, 1050, 2300, 70, .45);
    const ts = lerp(90, 520, ei(tx)), ty = lerp(1000, 2100, ei(tx)); taxiFront(lerp(560, 600, tx), ty, ts, t); reflect(lerp(560, 600, tx), ty - ts * .62, ty, ts * .9, C.warm, .45);
  });
  lightPass('#1c2034'); rainFx(t, { n: 300, a: .34, ang: .08 }); flares();
};
// ---------- the rule: a low angle on the BALETE DRIVE sign under a sodium lamp; roots hang into frame; a taxi crosses behind ----------
S.rule = (t, u) => { const p = seg(t, T('s2'), E('s3'));
  setCam({ x: 540, y: lerp(980, 820, ss(p)), z: lerp(1.0, 1.12, p), rot: -.06, focus: 1, dof: 20, t });
  layer(4, () => { nightSky(t); balete(800, 1500, 120, t, { col: ['#1a1a1e', '#101014', '#060608'] }); balete(120, 1560, 90, t + 3, { col: ['#16161a', '#0e0e12', '#060608'] }); });
  layer(2, () => { g.fillStyle = '#121218'; g.fillRect(-600, 1480, 2300, 1000); taxiSide(lerp(1700, -700, seg(t, T('s2') + .5, T('s2') + 4.5)), 1560, 110, t, { dir: -1 }); });
  layer(1, () => { streetLamp(300, 1700, 1350, t, { side: 1 }); streetSign(330, 1700, 900, 'BALETE DR.'); g.fillStyle = '#16161c'; g.fillRect(-600, 1700, 2300, 900); asphalt(() => { g.beginPath(); g.rect(-600, 1700, 2300, 900); }, .7); puddleShine(-600, 1700, 1700, 2000, C.sodium, .25); splashes(t, -200, 1300, 1720, 2200, 40, .5); });
  layer(.55, () => { for (let k = 0; k < 30; k++) { const x = -80 + hash(k * 3.3) * 1250, len = 300 + 700 * hash(k * 1.9); curve([x, -300], [x + Math.sin(t * .6 + k) * 30, -300 + len * .5], [x + Math.sin(t * .4 + k) * 60, -300 + len], 10 + 14 * hash(k), '#050505'); } });
  lightPass('#1a1c2c'); rainFx(t, { n: 280, a: .32, ang: .06 }); flares();
};
// ---------- the boundary: the driver in profile at the wheel; the city smears past the side window; lamplight sweeps his face ----------
S.boundary = (t, u) => {
  setCam({ x: lerp(560, 520, seg(u, 0, 6)), y: 900, z: lerp(1.05, 1.15, ss(seg(u, 0, 6))), rot: .02, focus: 1, dof: 22, t });
  layer(5, () => { g.fillStyle = '#0b0d16'; g.fillRect(-600, -600, 2300, 3200); bokeh(t * 6, 34, 200, 1300, 140, .9, 5); });
  layer(1.25, () => { interiorDark(); g.save(); rr(-100, 260, 1200, 760, 60); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore(); line([[-100, 1020], [1100, 1020]], 30, '#101016'); });
  layer(1, () => { driverSide(470, 1990, 820, t, { dir: 1, eyes: 'open', look: .2, rim: 'rgba(255,170,90,.5)' }); });
  layer(.6, () => { g.beginPath(); g.ellipse(1080, 1650, 380, 520, 0, Math.PI * .55, Math.PI * 1.45); g.lineWidth = 60; g.strokeStyle = '#0a0a0e'; g.stroke(); meter(920, 1880, 70, t, '00.00'); });
  passing(t, 2.2, 900, 800, .6); L(700, 1500, 500, C.dash, .4, .05);
  lightPass('#151a2a'); windshield(t, { x0: -100, y0: 260, x1: 1100, y1: 1020, wipers: 0, n: 60, a: .8 }); flares();
};
// ---------- the balete through the windshield: the wipers, the headlights, and under the tree the woman in white, one hand up ----------
S.tree = (t, u) => { const ap = ss(seg(u, 0, span('s5') + .8));
  setCam({ x: 540, y: 900, z: 1, dz: lerp(0, .7, ap), rot: .015 * Math.sin(t * .5), focus: 2.4, dof: 16, shake: .4, t });
  layer(7, () => { nightSky(t, { top: '#03040a', bot: '#121626' }); });
  layer(3.2, () => { balete(560, 1400, 150, t, { col: ['#4a4440', '#2a2622', '#121010'] }); g.fillStyle = '#0e0f14'; g.fillRect(-600, 1380, 2300, 1000); });
  layer(2.4, () => { lady(560, 1420, 520, t, { arm: ss(seg(t, W_PINAPARA - .9, W_PINAPARA - .2)) * .9 + .1, glowA: .9 }); });
  layer(1.6, () => { const RD = () => { g.beginPath(); g.moveTo(360, 1400); g.lineTo(720, 1400); g.lineTo(1500, 2400); g.lineTo(-420, 2400); g.closePath(); }; RD(); g.fillStyle = lg(0, 1400, 0, 2400, ['#18191e', '#24252c']); g.fill(); asphalt(RD, .7); for (let k = 0; k < 8; k++) { const v = k / 8, y0 = lerp(1400, 2400, v * v), y1 = lerp(1400, 2400, (v + .05) * (v + .05)); g.fillStyle = 'rgba(240,230,200,.55)'; g.fillRect(540 - lerp(2, 16, v), y0, lerp(4, 32, v), y1 - y0); }
    beam([[200, 2400], [880, 2400], [700, 1380], [400, 1380]], 540, 2400, 540, 1380, C.warm, .2); L(540, 1500, 700, C.warm, .9, .08); L(540, 1900, 600, C.warm, .8, .05); splashes(t, 0, 1080, 1420, 2300, 50, .5); });
  layer(.6, () => { g.fillStyle = '#050507'; g.fillRect(-600, -600, 2300, 520); dashboard(1720, t, { meter: [820, 1820, 52], mtxt: '40.00' }); });
  lightPass('#14182a'); rainFx(t, { n: 260, a: .3, ang: .04, x0: 0, y0: 0, x1: W, y1: 1700 }); rainFx(t + 9, { n: 120, a: .55, ang: .02, x0: 250, y0: 1000, x1: 830, y1: 1700, c: '255,230,190' });
  windshield(t, { x0: 0, y0: -80, x1: W, y1: 1760, per: 2.0 }); flares();
};
// ---------- dry: the rain stops in the air around her; hair and dress dry. A rack focus from the near rain to her ----------
S.dry = (t, u) => { const k = ss(seg(t, W_TUYO - .5, W_TUYO + .4));
  setCam({ x: lerp(600, 540, seg(u, 0, 6)), y: lerp(760, 700, seg(u, 0, 6)), z: lerp(1.0, 1.12, ss(seg(u, 0, 6))), rot: -.03, focus: lerp(.6, 1, k), dof: 30, t });
  layer(3, () => { nightSky(t, { top: '#03040a', bot: '#101422' }); for (let kk = 0; kk < 40; kk++) { const x = -200 + hash(kk * 3.1) * 1500, len = 900 + 900 * hash(kk); curve([x, -300], [x + Math.sin(t * .4 + kk) * 20, len * .4], [x + Math.sin(t * .3 + kk) * 40, len], 12 + 18 * hash(kk * 2), '#0a0a0c'); } });
  layer(1, () => { lady(540, 2250, 1650, t, { arm: 0, turn: .3, part: .35 * k, glowA: 1, hover: 0 });
    for (let i = 0; i < 60; i++) { const a = hash(i * 2.1) * TAU, rr_ = 330 + 230 * hash(i * 4.4), x = 540 + Math.cos(a) * rr_, y = 900 + Math.sin(a) * rr_ * 1.6 + Math.sin(t * .8 + i) * 6;
      g.fillStyle = rg(x - 2, y - 3, 1, 7, ['rgba(255,255,255,.9)', 'rgba(170,200,255,.35)', 'rgba(170,200,255,0)']); g.beginPath(); g.ellipse(x, y, 5, 6.5, 0, 0, TAU); g.fill(); L(x, y, 14, null, .7); } });
  layer(.6, () => { for (let i = 0; i < 18; i++) { const x = hash(i * 7.7) * 1200 - 60, y = ((hash(i * 3.3) * 2400 + t * 900) % 2400) - 300; line([[x, y], [x - 6, y - 160]], 7, 'rgba(200,215,255,.55)'); } });
  lightPass('#121626');
  reset(); g.save(); g.beginPath(); g.rect(0, 0, W, H); g.ellipse(540, 960, 380, 720, 0, 0, TAU); g.clip('evenodd'); g.restore();
  { const x = 540, y = 960; reset(); g.save(); g.beginPath(); g.rect(0, 0, W, H); const sc = 1 / (CAMV.z || 1); g.ellipse(x, y, 420 * sc + 60, 760, 0, 0, TAU); g.clip('evenodd'); rainFx(t, { n: 280, a: .32 + .1 * k, ang: .05 }); g.restore(); reset(); }
  flares();
};
// ---------- she gets in: the taxi stops in profile, the back door opens, she glides in, it shuts; the windows frost over from the edges ----------
S.getin = (t, u) => { const stop = eo(seg(u, 0, 1.4)), dOpen = ss(seg(t, W_SUMAKAY - .5, W_SUMAKAY + .1)) * (1 - ss(seg(t, W_SUMAKAY + 1.2, W_SUMAKAY + 1.7))), inn = ss(seg(t, W_SUMAKAY - .1, W_SUMAKAY + 1.2)), fr = ss(seg(t, W_LAMIG - .3, W_LAMIG + 1.6));
  setCam({ x: lerp(540, 500, ss(seg(t, W_LAMIG - .5, E('s7')))), y: lerp(1000, 1080, ss(seg(t, W_LAMIG - .5, E('s7')))), z: lerp(1, 1.35, ss(seg(t, W_LAMIG - .5, E('s7') + .6))), focus: 1, dof: 18, t });
  layer(4, () => { nightSky(t); balete(900, 1350, 110, t, { col: ['#2a2826', '#181614', '#0a0908'] }); streetLamp(120, 1350, 800, t, { side: 1 }); });
  layer(1, () => { g.fillStyle = '#121218'; g.fillRect(-600, 1300, 2300, 1100); asphalt(() => { g.beginPath(); g.rect(-600, 1300, 2300, 1100); }, .7); puddleShine(-600, 1700, 1300, 1700, C.sodium, .2);
    const tx = lerp(-300, 470, stop), s = 230;
    if (inn < 1) { g.save(); g.globalAlpha = 1 - ss(seg(inn, .7, 1)); lady(lerp(260, 300, inn), 1560, 820 * (1 - .15 * inn), t, { glowA: .8, turn: -.5 }); g.restore(); }
    taxiSide(tx, 1560, s, t, { dir: -1, door: dOpen, wheel: -stop * 9, inside: (ss_, dir) => { if (inn > .8) ladySeated(.6 * ss_, -1.05 * ss_, .9 * ss_, t, { a: ss(seg(inn, .8, 1)) }); } });
    { const x0 = tx - s * 1.0, x1 = tx + s * 1.15; frost(x0, 1560 - 1.36 * s, x1, 1560 - .98 * s, fr, t); }
    splashes(t, -200, 1300, 1580, 2200, 50, .5); });
  lightPass('#151828'); rainFx(t, { n: 260, a: .3, ang: .06 }); flares();
};
// ---------- the back seat, from the dashboard: the driver at the wheel (sharp), behind him in the dark the woman, hair over her face; focus pulls to her when she speaks ----------
S.back = (t, u) => { const her = (id) => ss(seg(t, T(id) - .3, T(id) + .1)) * (1 - ss(seg(t, E(id) + .1, E(id) + .6))), f = Math.max(her('L1'), her('L2'));
  setCam({ x: lerp(560, 520, seg(u, 0, 9)), y: 900, z: lerp(1.0, 1.08, seg(u, 0, 9)), focus: lerp(1, 1.7, f), dof: 34, t });
  layer(3, () => { interiorDark(); rr(220, 260, 640, 330, 40); g.fillStyle = '#0c0e18'; g.fill(); g.save(); g.clip(); bokeh(t, 10, 300, 560, 30, .8, 4); g.restore(); });
  layer(1.7, () => { backSeat(-120, 560, 1320, 900, {}); ladySeated(770, 760, 520, t, { part: .25 * f }); frost(-200, 200, 140, 900, .7, t); frost(940, 200, 1300, 900, .7, t); });
  layer(1, () => { const lk = Math.sin(t * .3) * .1; bust(330, 1950, 900, { t, skin: DRV.skin, hair: DRV.hair, shirt: DRV.hood, stache: 1, eyes: 'open', look: lk, lookY: -.1, sweat: .6, lx: 1, rim: 'rgba(140,200,255,.45)' });
    g.save(); g.translate(30, 1490); g.rotate(-.35); rr(-60, -40, 200, 90, 30); fs(lg(0, -40, 0, 50, ['#f0ece2', '#b8b0a2']), 4); for (let k = 0; k < 5; k++) line([[-40 + k * 40, -34], [-46 + k * 40, 44]], 3, 'rgba(120,100,80,.4)'); g.restore();
    breath(400, 1290, t, 1, 1); });
  layer(.6, () => { g.beginPath(); g.ellipse(540, 2200, 760, 420, 0, Math.PI * 1.08, Math.PI * 1.92); g.lineWidth = 70; g.strokeStyle = '#08080c'; g.stroke(); });
  L(330, 1350, 700, C.dash, .55, .08); passing(t, 3.1, 500, 700, .4);
  lightPass('#121626'); flares();
};
// ---------- around and around: straight down from the sky, the road loops the tree; the taxi's lights go round; the camera turns with it ----------
S.circle = (t, u) => { const ang = u * .55;
  setCam({ x: 540, y: 960, z: lerp(1.25, .95, ss(seg(u, 0, span('s9')))), rot: -u * .09, focus: 1, dof: 0, t });
  layer(1, () => { g.fillStyle = '#0c0e10'; g.fillRect(-800, -800, 2700, 3500);
    for (let i = 0; i < 160; i++) { const x = hash(i * 3.1) * 2400 - 700, y = hash(i * 7.3) * 3200 - 700; circ(x, y, 40 + 90 * hash(i), i % 3 ? '#0e1a12' : '#12221a'); }
    ell(540, 960, 520, 520); g.lineWidth = 170; g.strokeStyle = '#26272e'; g.stroke(); ell(540, 960, 520, 520); g.setLineDash([40, 50]); g.lineWidth = 6; g.strokeStyle = 'rgba(240,230,190,.5)'; g.stroke(); g.setLineDash([]);
    line([[540, 1480], [540, 2800]], 170, '#26272e'); line([[-900, 960], [-40, 960]], 170, '#26272e');
    for (let i = 0; i < 60; i++) { const a = hash(i * 2.3) * TAU, r = 120 + 230 * Math.sqrt(hash(i * 5.1)); circ(540 + Math.cos(a) * r, 960 + Math.sin(a) * r, 50 + 70 * hash(i * 9), i % 4 ? '#122016' : '#1c2e20'); }
    for (let i = 0; i < 40; i++) { const a = hash(i * 4.4) * TAU, r = 60 + 300 * hash(i * 6.6); circ(540 + Math.cos(a) * r, 960 + Math.sin(a) * r, 4, 'rgba(0,0,0,.5)'); }
    const ca = -Math.PI / 2 + ang * 2.2, cx = 540 + Math.cos(ca) * 520, cy = 960 + Math.sin(ca) * 520;
    g.save(); g.translate(cx, cy); g.rotate(ca + Math.PI);
    beam([[0, -60], [520, -230], [520, 230], [0, 60]], 0, 0, 520, 0, C.warm, .3); g.rotate(0);
    rr(-150, -70, 300, 140, 40); fs(PAL.taxi[1], 4); rr(-60, -60, 150, 120, 20); fs('#0c0e16', 3); rr(-30, -26, 60, 52, 8); fs('#ffcf6a', 3); L(0, 0, 160, C.amb, .7, .3);
    for (const sg of [-1, 1]) { L(150, sg * 50, 500, C.warm, .9, .3); L(-150, sg * 50, 200, C.red, .8, .3); }
    g.restore(); });
  lightPass('#101420');
  rainFx(t, { n: 220, a: .22, ang: .0, sp: .35, big: .5 });
  const tg = [[T('s9'), TX.turns[0]], [W_KALIWA, TX.turns[1]], [W_ULIT - .4, TX.turns[2]]]; tg.forEach(([a, s], i) => { const nx = tg[i + 1] ? tg[i + 1][0] : W_PAIKOT - .2, k = back(seg(t, a, a + .25), 2) * (1 - ss(seg(t, nx - .1, nx + .1))); if (k > 0) { reset(); tag(s, CX, 420, AMB, C.amb, k * 1.4); } });
  flares();
};
// ---------- passing the tree again: out of the side window, the balete slides by, and under it she stands, hand up, and her head turns with us ----------
S.pass = (t, u) => { const px = lerp(-250, 1500, seg(u, 0, span('s10') + .4));
  setCam({ x: px, y: 900, z: 1, focus: 2.2, dof: 16, t });
  layer(6, () => { nightSky(t); });
  layer(2.6, () => { g.fillStyle = '#0c0d12'; g.fillRect(-1600, 1350, 5000, 1000); balete(820, 1380, 140, t, { col: ['#3a3634', '#221e1c', '#0e0c0a'] }); });
  layer(2.2, () => { const look = clamp((CAMV.x - 400) / 900, -1, 1); lady(800, 1400, 520, t, { arm: 1, turn: look, part: .3 * ss(seg(t, W_NANDOON - .3, W_NANDOON + .5)), glowA: 1 }); });
  layer(1.1, () => { for (let k = -2; k < 9; k++) streetLamp(k * 520, 1500, 900, t, { side: 1, on: k % 2 ? 1 : 0 }); g.fillStyle = '#121218'; g.fillRect(-2000, 1480, 6000, 900); });
  layer(.55, () => { interiorDark(); g.save(); rr(820 + (CAMV.x - 540) / .55 - 640, 300, 1280, 1000, 70); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore(); });
  lightPass('#131726'); rainFx(t, { n: 180, a: .25, ang: .5, sp: .8 });
  windshield(t * .7, { x0: 120, y0: 330, x1: 960, y1: 1280, wipers: 0, n: 80, a: .85 }); flares();
};
// ---------- the mirror again: first his own eyes; then he tilts it, and the back seat is empty, sunk in; the seat belt sways ----------
S.mirror = (t, u) => { const sw = ss(seg(t, W_WALANG12 - .7, W_WALANG12 + .1)), sink = ss(seg(t, W_LUBOG - .2, W_LUBOG + 1.4));
  setCam({ x: 540, y: 820, z: lerp(1.3, 1.6, ss(seg(u, 0, span('s11') + span('s12')))), rot: .04, focus: 1, dof: 26, shake: .4, t });
  layer(3, () => { interiorDark(); bokeh(t, 14, 300, 900, 30, .5, 11); });
  layer(1, () => mirror(540, 800, 760, 250, .02 - sw * .05, (w, h) => {
    g.fillStyle = '#0c0e16'; g.fillRect(-w, -h, 2 * w, 2 * h);
    g.save(); g.translate(lerp(0, -w * 1.4, sw), 0);
    faceReal(0, 40, 300, { t, skin: DRV.skin, hair: DRV.hair, stache: 1, eyes: 'wide', look: .15, sweat: 1, lx: 1, rim: 'rgba(255,170,90,.4)' }); L(0, 0, 300, C.sodium, .6, .05);
    g.restore();
    g.save(); g.translate(lerp(w * 1.4, 0, sw), 0); rr(-w * .42, -h * .62, w * .84, h * .42, 24); g.fillStyle = '#0a0c18'; g.fill();
    backSeat(-w * .56, -h * .12, w * 1.12, h * 1.1, { sag: .3 + .7 * sink, u: .66, belt: .5 + sink, t }); L(w * .1, h * .2, w * .5, C.ice, .6, .05); g.restore();
  }, t));
  passing(t, 3, 700, 700, .4); lightPass('#141a2c'); flares();
};
// ---------- "bakit ka tumingin?": in the mirror, out of the dark of the back seat, her face; the rosary stops swinging ----------
S.why = (t, u) => { const k = ss(seg(u, .1, 1.5));
  setCam({ x: 540, y: 820, z: lerp(1.6, 1.9, ss(seg(u, 0, 3))), rot: .04, focus: 1, dof: 26, t });
  layer(3, () => { interiorDark(); });
  layer(1, () => mirror(540, 800, 760, 250, -.03, (w, h) => {
    g.fillStyle = '#0c0e16'; g.fillRect(-w, -h, 2 * w, 2 * h); backSeat(-w * .56, -h * .12, w * 1.12, h * 1.1, { sag: 1, u: .66 });
    g.save(); g.globalAlpha = k; ladyFace(w * .05, h * .1, 150, t, { open: 1, tilt: .12, hide: .3 }); g.restore(); L(0, 0, w * .4, C.ice, .5, .05);
  }, T('L3') + .6 + (t - T('L3')) * .02));
  lightPass('#12172a'); flares();
};
// ---------- the smell: his profile, very close, eyes wide; candle smoke drifts past from the back; earth sifts in the air ----------
S.smell = (t, u) => { const kd = ss(seg(t, W_KANDILA - .2, W_KANDILA + .5)), lp = ss(seg(t, W_LUPA - .2, W_LUPA + .6));
  setCam({ x: lerp(600, 560, seg(u, 0, 5)), y: 820, z: lerp(1.15, 1.3, ss(seg(u, 0, 5))), rot: -.06, focus: 1, dof: 24, t });
  layer(3, () => { interiorDark(); bokeh(t, 8, 300, 900, 20, .4, 21); smoke(800, 1300, 260, t, .3 * kd); });
  layer(1, () => { headSide(470, 820, 380, { dir: -1, t, eyes: 'wide', sweat: 1, look: .6, rim: 'rgba(160,190,255,.5)' }); if (kd > 0) { glow(470 - 380 * .62, 820 - 380 * .1, 26, C.candle, .7 * kd); } });
  layer(.7, () => { smoke(720, 1500, 420, t + 3, .35 * kd); for (let i = 0; i < 70; i++) { const p = ((t * .12 + hash(i * 1.3)) % 1); circ(hash(i * 4.1) * 1200 - 60, lerp(-100, 2000, p), 2 + 4 * hash(i), `rgba(170,140,110,${.6 * lp})`); L(hash(i * 4.1) * 1200 - 60, lerp(-100, 2000, p), 10, null, lp); } });
  L(900, 900, 700, C.candle, .35 * kd, .06 * kd); L(200, 800, 500, C.dash, .4, .03);
  lightPass('#121626'); flares();
};
// ---------- the choice: his hands shaking on the wheel; the rosary blurred in front ----------
S.cta = (t, u) => {
  setCam({ x: 540, y: 980, z: lerp(1, 1.08, seg(u, 0, 6)), rot: .05, focus: 1, dof: 22, t });
  layer(3.5, () => { g.fillStyle = '#0a0c16'; g.fillRect(-600, -600, 2300, 3200); bokeh(t * 3, 20, 200, 900, 60, .7, 31); });
  layer(1, () => { g.beginPath(); g.ellipse(540, 1500, 470, 470, 0, 0, TAU); g.lineWidth = 80; g.strokeStyle = '#121216'; g.stroke(); g.lineWidth = 6; g.strokeStyle = 'rgba(150,170,220,.25)'; g.stroke();
    for (const a of [Math.PI * .8, Math.PI * .2]) line([[540, 1500], [540 + Math.cos(a) * 440, 1500 + Math.sin(a) * 440]], 70, '#121216'); circ(540, 1500, 120, '#16161c'); circ(540, 1500, 120, '#2a2a34', 6);
    for (const [a, sg] of [[Math.PI * 1.2, -1], [Math.PI * 1.8, 1]]) { const tr = Math.sin(t * 29 + sg) * 5 + Math.sin(t * 17) * 3, hx = 540 + Math.cos(a) * 470 + tr, hy = 1500 + Math.sin(a) * 470 + tr * .6;
      limb([[hx + sg * 260, hy + 600], [hx + sg * 120, hy + 260], [hx + sg * 30, hy + 60]], 110, DRV.hood, sg); line([[hx + sg * 30, hy + 60], [hx + sg * 10, hy + 10]], 70, DRV.skin[2]); handReal(hx + sg * 10, hy + 10, 260, -Math.PI / 2 - sg * .35, { skin: DRV.skin, curl: .95, sg: -sg, spread: .05 }); } });
  layer(.55, () => { const sw = Math.sin(t * 1.4) * .2; g.save(); g.translate(700, -200); g.rotate(sw); for (let k = 0; k < 24; k++) circ(Math.sin(k / 23 * Math.PI) * 60, k * 34, 14, '#cfc6b6'); line([[0, 800], [0, 1000]], 12, '#cfc6b6'); line([[-60, 890], [60, 890]], 12, '#cfc6b6'); g.restore(); });
  L(540, 1300, 900, C.dash, .55, .06); passing(t, 2.4, 1200, 800, .5);
  lightPass('#141828'); windshield(t, { x0: 0, y0: 0, x1: W, y1: 900, per: 2.0, a: .7, piv: [[230, 1100], [690, 1100]], len: 640 }); flares();
};
// ---------- he prays: eyes shut, the rosary to his lips; the light inside goes cold ----------
S.pray = (t, u) => { const k = ss(seg(t, W_PUMIKIT - .3, W_PUMIKIT + .4));
  setCam({ x: 540, y: lerp(820, 860, seg(u, 0, 5)), z: lerp(1.1, 1.3, ss(seg(u, 0, 5))), focus: 1, dof: 22, t });
  layer(3, () => { interiorDark(); bokeh(t, 10, 200, 700, 20, .4, 41); });
  layer(1, () => { bust(540, 2000, 1000, { t, skin: DRV.skin, hair: DRV.hair, shirt: DRV.hood, stache: 1, eyes: k > .5 ? 'shut' : 'wide', sweat: 1, lx: 1, rim: 'rgba(170,200,255,.5)' });
    for (const sg of [-1, 1]) { limb([[540 + sg * 470, 1900], [540 + sg * 260, 1720], [540 + sg * 60, 1600]], 120, DRV.hood, sg); handReal(540 + sg * 60, 1600, 300, -Math.PI / 2 - sg * .12, { skin: DRV.skin, curl: .08, sg: sg, spread: .02 }); }
    const rx = 540, ry = 1440; for (let q = 0; q < 14; q++) circ(rx + Math.sin(q / 13 * Math.PI) * 50, ry + q * 22, 9, '#e0d8c8'); line([[rx, ry + 300], [rx, ry + 380]], 8, '#e0d8c8'); line([[rx - 30, ry + 330], [rx + 30, ry + 330]], 8, '#e0d8c8');
    breath(560, 1250, t, 1, 1); });
  L(540, 1000, 900, C.ice, .55 + .2 * k, .06); lightPass(mixHex('#1a1e30', '#0e1428', k)); flares();
};
// ---------- "nandito na tayo": his profile, eyes shut; from the dark at the right edge her face slides in beside his ear; the focus pulls to her ----------
S.beside = (t, u) => { const k = ss(seg(u, 0, span('L4') + .3)), f = ss(seg(t, W_NANDITO - .3, W_NANDITO + .3));
  setCam({ x: 560, y: 860, z: lerp(1.15, 1.28, ss(seg(u, 0, 4))), focus: lerp(1, .75, f), dof: 30, t });
  layer(3, () => { interiorDark(); });
  layer(1, () => { headSide(380, 900, 360, { dir: 1, t, eyes: 'shut', sweat: 1, tear: 1, rim: 'rgba(170,200,255,.45)' }); });
  layer(.75, () => { g.save(); g.globalAlpha = k; ladyFace(lerp(1250, 900, k), 860, 230, t, { open: f, tilt: -.25, hide: .4 }); g.restore();
    for (let i = 0; i < 9; i++) curve([lerp(1300, 950, k), 600 + i * 20], [lerp(900, 640, k), 820 + i * 30], [lerp(800, 520, k) + Math.sin(t + i) * 20, 1000 + i * 50], 6, 'rgba(4,4,6,.85)'); });
  L(600, 860, 600, C.ice, .5, .05); lightPass('#0e1222'); flares();
};
// ---------- the old house: a low wide shot, the taxi stopped at the gate, headlights on, every window dark; the camera cranes up ----------
S.house = (t, u) => { const c = ss(seg(u, 0, span('s15') + .5));
  setCam({ x: 540, y: lerp(1100, 860, c), z: lerp(1.0, 1.08, c), rot: lerp(.04, 0, c), focus: 1.2, dof: 12, t });
  layer(5, () => { nightSky(t); });
  layer(2.6, () => { balete(1020, 1350, 95, t, { col: ['#2a2826', '#181614', '#0a0908'] }); bahay(500, 1350, 70, t, {}); L(500, 1050, 1100, C.moon, .55, .04); g.fillStyle = '#0e0f14'; g.fillRect(-900, 1340, 2900, 1000); });
  layer(1.6, () => { gate(520, 1500, 120, t, {}); });
  layer(1.2, () => { g.fillStyle = '#14151c'; g.fillRect(-900, 1560, 2900, 1000); asphalt(() => { g.beginPath(); g.rect(-900, 1560, 2900, 1000); }, .7); puddleShine(-900, 2000, 1560, 1900, C.warm, .15); taxiSide(380, 1720, 200, t, { dir: 1 }); splashes(t, -200, 1300, 1600, 2200, 30, .35); });
  lightPass('#121626'); mistBand(t, 1450, .22); rainFx(t, { n: 180, a: .22, ang: .05 }); flares();
};
// ---------- empty: the back seat; the far door opens on the rain, shuts; nobody; on the seat, a sampaguita garland ----------
S.empty = (t, u) => { const op = ss(seg(t, W_BUMUKAS - .2, W_BUMUKAS + .5)) * (1 - ss(seg(t, W_SUMARA - .2, W_SUMARA + .2))), sp = ss(seg(t, W_SAMPA - 1.4, W_SAMPA + 1.8));
  setCam({ x: lerp(540, 690, sp), y: lerp(1000, 1250, sp), z: lerp(1.0, 1.7, sp), focus: 1, dof: 16, t });
  layer(2, () => { interiorDark(); rr(160, 300, 760, 340, 40); g.fillStyle = '#0c0e18'; g.fill(); g.save(); g.clip(); bokeh(t, 8, 320, 620, 10, .6, 51); g.restore();
    g.fillStyle = '#0a0b10'; g.fillRect(980, 200, 420, 1400);
    if (op > 0) { g.save(); g.beginPath(); g.rect(980, 200, 420 * op, 1400); g.clip(); g.fillStyle = '#1a2032'; g.fillRect(980, 200, 420, 1400); g.restore(); L(1100, 800, 700 * op, C.ice, .7 * op, .15 * op); } });
  layer(1, () => { backSeat(-80, 640, 1100, 820, {}); sampaguita(690, 1270, 90, t); L(540, 520, 1200, C.ice, .55, .04); L(690, 1270, 500, C.white, .5, .05); });
  lightPass('#121626'); if (op > 0) rainFx(t, { n: 80, a: .3 * op, x0: 980, y0: 200, x1: 980 + 420 * op, y1: 1600 }); flares();
};
// ---------- the next morning: grey light after rain, the house and the gate; an old woman opens it ----------
S.morning = (t, u) => { const op = ss(seg(t, W_NAGBUKAS - .6, W_NAGBUKAS + .6));
  setCam({ x: lerp(600, 540, seg(u, 0, 7)), y: 940, z: lerp(1.0, 1.1, ss(seg(u, 0, 7))), focus: 1.3, dof: 12, t });
  layer(5, () => { grad('#8a96a8', '#c8c4ba', -600, 1800); });
  layer(2.4, () => { balete(1000, 1300, 90, t, { col: ['#5a5650', '#3e3a36', '#24221e'] }); bahay(480, 1300, 66, t, { day: 1 }); g.fillStyle = '#6a6458'; g.fillRect(-900, 1290, 2900, 1000); });
  layer(1.4, () => { g.fillStyle = '#5a564e'; g.fillRect(-900, 1640, 2900, 1000); });
  layer(1.1, () => { bust(560, 1960, 560, { t, skin: LOLA2.skin, hair: LOLA2.hair, shirt: LOLA2.hood, collar: 0, female: 1, hairStyle: 'bun', glasses: 1, age: 1, eyes: 'open', look: -.3, lx: -1 }); gate(540, 2140, 200, t, { open: op }); });
  layer(.7, () => { taxiSide(-120, 2350, 300, t, { dir: 1, lights: 0, sign: 0 }); });
  L(540, 900, 1800, C.white, .9, 0); lightPass('#7c7a78');
  for (let i = 0; i < 12; i++) { const p = ((t * .6 + hash(i)) % 1); reset(); circ(80 + hash(i * 3) * 920, lerp(300, 1500, p), 4, `rgba(220,230,240,${.6 * (1 - p)})`); }
  flares();
};
// ---------- the altar: candles, the Santo Niño, the photo; we push in on it. On "Elena" the candle flames lean toward her ----------
S.photo = (t, u) => { const pi = ss(seg(t, W_LITRATO - .3, W_ELENA + .6)), el = ss(seg(t, W_ELENA - .2, W_ELENA + .8));
  setCam({ x: lerp(540, 540, pi), y: lerp(1000, 820, pi), z: lerp(1.0, 2.1, pi), focus: lerp(1, 1.05, pi), dof: 20, t });
  layer(2.2, () => { g.fillStyle = '#3a2a22'; g.fillRect(-600, -600, 2300, 3200); g.save(); g.fillStyle = pat(TEX.wood); g.globalAlpha = .5; g.fillRect(-600, -600, 2300, 3200); g.restore(); });
  layer(1.05, () => {
    rr(220, 1300, 640, 70, 8); fs('#4a3020', 4); g.fillStyle = '#e8e0d0'; g.fillRect(200, 1340, 680, 260); for (let k = 0; k < 14; k++) curve([200 + k * 48, 1600], [210 + k * 48, 1640], [205 + k * 48, 1660], 6, '#d8d0c0');
    rr(390, 560, 300, 400, 10); fs('#5a3a1e', 6); rr(410, 580, 260, 360, 6); g.fillStyle = '#c8c4bc'; g.fill();
    g.save(); rr(410, 580, 260, 360, 6); g.clip(); g.fillStyle = lg(0, 580, 0, 940, ['#bcb8b0', '#8a8680']); g.fillRect(410, 580, 260, 360);
    rr(445, 860, 190, 160, 70); g.fillStyle = '#e8e6e2'; g.fill();
    faceReal(540, 760, 72, { t, female: 1, skin: ['#dcd8d0', '#aaa69e', '#6a6660'], hair: ['#1e1e1e', '#2e2e2e', '#101010'], eyes: 'open', smile: 1, lx: -1 });
    g.fillStyle = 'rgba(120,100,70,.25)'; g.fillRect(410, 580, 260, 360); g.restore();
    sampaguita(540, 590, 120, t, { n: 30 });
    if (el > 0) { rr(450, 975, 180, 46, 8); fs('#2a1a10', 3); text('ELENA', 540, 999, 30, `rgba(240,220,170,${el})`, 'Anton'); }
    const lean = el * .5; for (const [cx, sc] of [[290, 90], [790, 90], [350, 60], [730, 60]]) { g.save(); g.translate(cx, 1300); g.rotate((cx < 540 ? 1 : -1) * lean * .3); candle(0, 0, sc, t); g.restore(); }
    g.save(); g.translate(290, 1140); for (let k = 0; k < 3; k++) { } g.restore();
    ell(250, 1220, 46, 70); fs(lg(0, 1150, 0, 1300, ['#e8c8a0', '#a07a50']), 3); circ(250, 1130, 30, '#e8c8a0'); path([[210, 1110], [290, 1110], [250, 1050]]); g.closePath(); fs('#d8b040', 3);
  });
  layer(.6, () => { g.save(); g.globalAlpha = 1 - pi; ell(60, 1900, 420, 560); g.fillStyle = lg(-300, 1400, 400, 2400, [LOLA2.hood[1], LOLA2.hood[2]]); g.fill(); circ(60, 1180, 230, '#8a8890'); circ(60, 960, 90, '#a8a6ae'); g.restore(); });
  lightPass('#1a1210'); flares();
};
// ---------- twenty years ago, in sepia: an old yellow taxi on Balete Drive in the rain, slow; the tree ahead. On "bumangga" the picture sinks to dark, then the aftermath: steam, one headlight, a garland on the road ----------
S.accident = (t, u) => { const hit = ss(seg(t, W_BUMANGGA - .3, W_BUMANGGA + .2)), after = ss(seg(t, W_BUMANGGA + .5, W_BUMANGGA + 1.4));
  setCam({ x: lerp(540, 620, seg(u, 0, 8)), y: 900, z: lerp(1.0, 1.15, seg(u, 0, 8)), focus: 1, dof: 10, t });
  layer(4, () => { nightSky(t, { top: '#0a0806', bot: '#2a2018' }); });
  layer(2, () => { balete(820, 1450, 120, t, { col: ['#4a4038', '#2a241e', '#120e0a'] }); g.fillStyle = '#1a1612'; g.fillRect(-900, 1430, 2900, 1000); });
  layer(1.2, () => { const tx = after > 0 ? 690 : lerp(-500, 520, seg(t, T('s20') + .5, W_BUMANGGA + .2)); taxiSide(tx, 1640, 190, t, { dir: 1, old: 1, lights: after > 0 ? .4 : 1, wheel: t * 6 * (1 - after), sign: 1 });
    if (after > 0) { smoke(tx + 420, 1500, 300, t, .5 * after); sampaguita(tx - 200, 1700, 60, t); } });
  lightPass('#2a2016'); rainFx(t, { n: 160, a: .25, ang: .05, sp: .5 });
  reset(); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(150,110,60,.85)'; g.fillRect(0, 0, W, H); reset();
  for (let k = 0; k < 4; k++) { const x = hash(Math.floor(t * 6) * 7 + k) * W; g.fillStyle = 'rgba(30,20,10,.25)'; g.fillRect(x, 0, 2, H); }
  if (hit > 0 && after < 1) { reset(); g.fillStyle = `rgba(0,0,0,${.9 * hit * (1 - after)})`; g.fillRect(0, 0, W, H); }
  flares();
};
// ---------- the notebook: from straight above, her list of drivers by candlelight; the fourteenth line writes itself; then crosses beside some names ----------
const NAMES = ['Mang Rudy · TVJ 112', 'Jun · NXE 409', 'Boy · TBA 771', 'Ramon · TXR 250', 'Edwin · PKT 338', 'Nestor · TYD 601', 'Allan · TVK 918', 'Celso · NBE 274', 'Dodong · TXA 513', 'Ariel · TBN 846', 'Romy · TKY 037', 'Lito · NWS 652', 'Bert · TVC 489'];
S.count = (t, u) => { const wr = seg(t, W_IKA14 - .2, W_IKA14 + 2.2), cr = seg(t, T('s22'), E('s22') + .3);
  setCam({ x: 560, y: lerp(880, 1060, ss(seg(u, 0, 8))), z: lerp(1.05, 1.3, ss(seg(u, 0, 8))), rot: .06 - u * .012, focus: 1, dof: 14, t });
  layer(1.4, () => { g.save(); g.fillStyle = pat(TEX.wood); g.fillRect(-600, -600, 2300, 3200); g.restore(); candle(950, 520, 120, t); });
  layer(1, () => { g.save(); g.translate(540, 960); g.rotate(-.05); rr(-380, -620, 760, 1240, 10); fs('#efe6cc', 4); for (let k = 0; k < 18; k++) line([[-360, -520 + k * 64], [360, -520 + k * 64]], 2, 'rgba(90,120,170,.35)'); line([[-280, -620], [-280, 620]], 3, 'rgba(200,60,60,.4)');
    NAMES.forEach((n, i) => { g.font = '600 40px Caveat'; g.fillStyle = '#2a2a4a'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(`${i + 1}. ${n}`, -260, -540 + i * 64);
      if ([2, 5, 8, 11].includes(i)) { const k = seg(cr, i / 14, i / 14 + .25); if (k > 0) { g.save(); g.globalAlpha = k; text('✝', 330, -555 + i * 64, 44, '#8a1010', 'serif'); g.restore(); } } });
    const s14 = '14. Ikaw · TXP 1987', n = Math.floor(s14.length * clamp(wr)); g.font = '600 40px Caveat'; g.fillStyle = '#2a2a4a'; g.fillText(s14.slice(0, n), -260, -540 + 13 * 64);
    if (wr > 0 && wr < 1) { const w = g.measureText(s14.slice(0, n)).width; line([[-260 + w + 10, -560 + 13 * 64], [-260 + w + 120, -760 + 13 * 64]], 18, '#1a1a22'); }
    g.restore(); });
  lightPass('#20160e'); flares();
  const k = back(seg(t, W_IKA14, W_IKA14 + .3), 1.8) * (1 - ss(seg(t, E('s21') - .2, E('s21') + .2))); if (k > 0) { reset(); g.save(); g.translate(CX, 360); g.scale(k, k); glass(-420, -120, 840, 240, 30, RED, 4, 'rgba(255,49,80,.8)'); text(TX.count[0], 0, -30, 92, '#fff', 'Anton'); text(TX.count[1], 0, 62, 46, '#ff8a96', 'Anton'); g.restore(); }
};
// ---------- the hand: the taxi's back window in grey dawn, fogged; a handprint, long fingers, from the inside; the drips run ----------
S.handprint = (t, u) => { const k = ss(seg(t, W_KAMAY - .5, W_KAMAY + .5)), ins = ss(seg(t, W_LOOB - .2, W_LOOB + 1.2));
  setCam({ x: 560, y: 900, z: lerp(1.0, 1.35, ss(seg(u, 0, E('s23b') - T('s23') + .5))), focus: 1, dof: 10, t });
  layer(1, () => { g.fillStyle = PAL.taxi[1]; g.fillRect(-600, -600, 2300, 3200);
    rr(80, 300, 920, 1100, 80); g.fillStyle = '#05060a'; g.fill();
    g.save(); rr(80, 300, 920, 1100, 80); g.clip(); g.globalAlpha = ins * .5; ladySeated(560, 900, 520, t, { a: 1 }); g.restore();
    g.save(); rr(80, 300, 920, 1100, 80); g.clip(); g.fillStyle = 'rgba(190,198,210,.78)'; g.fillRect(80, 300, 920, 1100);
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = k; const hx = 560, hy = 960;
    ell(hx, hy, 120, 150); g.fill(); for (let f = 0; f < 4; f++) { const a = -Math.PI / 2 + (f - 1.5) * .28; g.save(); g.translate(hx + Math.cos(a) * 120, hy + Math.sin(a) * 140); g.rotate(a + Math.PI / 2); rr(-24, -260 * (f === 1 || f === 2 ? 1 : .85), 48, 260 * (f === 1 || f === 2 ? 1 : .85), 24); g.fill(); g.restore(); }
    g.save(); g.translate(hx - 120, hy + 20); g.rotate(-.9); rr(-22, -190, 44, 190, 22); g.fill(); g.restore();
    for (let d = 0; d < 7; d++) { const dx = hx - 100 + d * 34, len = 120 + 260 * hash(d) * clamp((t - W_KAMAY) * .5); g.fillRect(dx - 5, hy + 120, 10, len); }
    g.restore();
    for (let i = 0; i < 40; i++) { const x = 100 + hash(i * 2.3) * 880, y = 320 + hash(i * 5.7) * 1060; circ(x, y, 3 + 6 * hash(i), 'rgba(255,255,255,.35)'); } });
  L(540, 900, 1400, C.white, .8, 0); lightPass('#6a6c74'); flares();
};
// ---------- years later, any rainy night: the road ahead through the windshield; at the roadside lamps, a woman in white, hand up, each lamp a little nearer ----------
S.end = (t, u) => { const s = clamp(Math.floor(seg(u, 0, E('L5') - T('s24') + .6) * 4.99), 0, 4), nearer = [3.6, 3.0, 2.4, 1.8, 1.3][s];
  setCam({ x: 540, y: 900, z: 1, dz: (u * .25) % .5, focus: nearer, dof: 10, shake: .3, t });
  layer(7, () => { nightSky(t); });
  layer(nearer, () => { streetLamp(780, 1420, 900, t, { side: -1 }); if (t > W_GILID - .3) lady(790, 1430, 520, t, { arm: 1, glowA: 1, part: .2 * s }); });
  layer(2, () => { const RD = () => { g.beginPath(); g.moveTo(470, 1380); g.lineTo(610, 1380); g.lineTo(1500, 2400); g.lineTo(-420, 2400); g.closePath(); }; RD(); g.fillStyle = '#16171e'; g.fill(); asphalt(RD, .7); beam([[150, 2400], [930, 2400], [640, 1380], [440, 1380]], 540, 2400, 540, 1380, C.warm, .16); L(540, 1700, 700, C.warm, .7, .05); });
  layer(.6, () => { g.fillStyle = '#050507'; g.fillRect(-600, -600, 2300, 520); dashboard(1760, t); });
  lightPass('#121626'); rainFx(t, { n: 240, a: .28, ang: .03, y1: 1700 }); windshield(t, { x0: 0, y0: -80, x1: W, y1: 1800, per: 2.2 }); flares();
};
// ---------- the last line: the tail lights going away into the rain; HUWAG KANG HIHINTO. ----------
S.final = (t, u) => { const k = seg(u, 0, span('s25') + 2);
  setCam({ x: 540, y: 900, z: 1, focus: 1, dof: 0, t });
  layer(1, () => { nightSky(t); g.fillStyle = '#121218'; g.fillRect(-600, 1200, 2300, 1300); g.beginPath(); g.moveTo(500, 1200); g.lineTo(580, 1200); g.lineTo(1400, 2400); g.lineTo(-320, 2400); g.closePath(); g.fillStyle = '#1a1b22'; g.fill();
    const s = lerp(380, 40, eo(k)), y = lerp(1900, 1230, eo(k)); g.save(); g.translate(540, y); cshadow(0, 0, 1.1 * s, .1 * s, .7);
    path([[-.62 * s, -1.42 * s], [.62 * s, -1.42 * s], [.82 * s, -1.0 * s], [-.82 * s, -1.0 * s]]); g.closePath(); g.fillStyle = lg(0, -1.42 * s, 0, -1.0 * s, [PAL.taxi[1], PAL.taxi[2]]); g.fill();
    path([[-.55 * s, -1.38 * s], [.55 * s, -1.38 * s], [.72 * s, -1.05 * s], [-.72 * s, -1.05 * s]]); g.closePath(); g.fillStyle = '#080a12'; g.fill(); g.save(); g.clip(); g.fillStyle = lg(-.7 * s, 0, .7 * s, 0, ['rgba(150,170,220,0)', 'rgba(150,170,220,.15)', 'rgba(150,170,220,0)']); g.fillRect(-s, -1.4 * s, 2 * s, .4 * s); g.restore();
    rr(-.3 * s, -1.66 * s, .6 * s, .2 * s, .04 * s); fs('#c8a050', .01 * s);
    rr(-.95 * s, -1.02 * s, 1.9 * s, .72 * s, .08 * s); g.fillStyle = lg(0, -1.02 * s, 0, -.3 * s, [PAL.taxi[0], PAL.taxi[1], PAL.taxi[2]]); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .01 * s; g.stroke();
    line([[-.9 * s, -.82 * s], [.9 * s, -.82 * s]], .01 * s, 'rgba(0,0,0,.35)'); g.fillStyle = PAL.stripe; g.fillRect(-.95 * s, -.6 * s, 1.9 * s, .05 * s);
    rr(-.98 * s, -.42 * s, 1.96 * s, .14 * s, .05 * s); fs('#b8bcc4', .01 * s); rr(-.24 * s, -.62 * s, .48 * s, .15 * s, .02 * s); fs('#f2efe6', .008 * s); text('TXP 1987', 0, -.545 * s, .09 * s, '#1a1a22', 'Anton');
    for (const sg of [-1, 1]) { rr(sg * .5 * s - .12 * s, -.26 * s, .24 * s, .26 * s, .05 * s); fs('#0b0b0e', .01 * s); }
    for (const sg of [-1, 1]) { rr(sg * .72 * s - .14 * s, -.95 * s, .28 * s, .14 * s, .03 * s); fs('#ff3a3a', .01 * s); L(sg * .72 * s, -.88 * s, 1.4 * s, C.red, 1, .5); F(sg * .72 * s, -.88 * s, 1.4 * s, C.red, .5); reflect(sg * .72 * s, -.88 * s, 0, .2 * s, C.red, .4); }
    g.restore(); for (let i = 1; i < 4; i++) streetLamp(i % 2 ? 300 : 780, 1200 + i * 30, 500 - i * 80, t, { side: i % 2 ? 1 : -1, on: .6 }); });
  lightPass('#101422'); rainFx(t, { n: 260, a: .3, ang: .05 }); flares();
  const a = back(seg(t, W_HIHINTO - .2, W_HIHINTO + .2), 1.6); if (a > 0) { reset(); g.save(); g.translate(CX, 560); g.scale(a, a); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 40; text(TX.last[0], 0, -70, 110, '#fff', 'Anton', 'center', 14); text(TX.last[1], 0, 70, 170, '#ff4a62', 'Anton', 'center', 16); g.restore(); }
};

// ---------- the title, the place card, the rule cards, the share card ----------
function titleCard(t, a) {
  if (a <= 0) return; reset(); g.globalAlpha = a; g.save(); g.translate(CX, 330);
  glass(-470, -170, 940, 340, 36, 'rgba(255,79,100,.6)', 3, 'rgba(255,79,100,.6)');
  tag(TX.tag, 0, -230, '#ffd27a', C.amb, .8);
  g.font = '80px Anton'; const s1 = Math.min(1, 860 / g.measureText(TX.t1).width); g.save(); g.translate(0, -70); g.scale(s1, s1); text(TX.t1, 0, 0, 80, '#f4f1ea', 'Anton', 'center', 12); g.restore();
  g.font = '150px Anton'; const s2 = Math.min(1, 880 / g.measureText(TX.t2).width); g.save(); g.translate(0, 58); g.scale(s2, s2); g.shadowColor = 'rgba(255,60,80,.9)'; g.shadowBlur = 34; text(TX.t2, 0, 0, 150, '#ff5068', 'Anton', 'center', 14); g.restore();
  g.restore(); g.globalAlpha = 1;
}
function placeCard(t, t0, t1) { const k = ss(seg(t, t0, t0 + .5)) * (1 - ss(seg(t, t1 - .3, t1))); if (k <= 0) return; reset(); g.globalAlpha = k;
  text(TX.place[0], 80, 330, 84, '#fff', 'Anton', 'left', 12); text(TX.place[1], 84, 420, 46, '#ffd27a', 'Anton', 'left', 10); line([[84, 470], [84 + 420 * k, 470]], 6, '#ffd27a'); g.globalAlpha = 1; }
function ruleCard(t, t0, t1, [top, label]) {
  const k = back(seg(t, t0, t0 + .28), 2.2) * (1 - ss(seg(t, t1 - .1, t1 + .2))); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 420); g.scale(k, k); glass(-460, -130, 920, 260, 34, RED, 5, 'rgba(255,49,80,.8)');
  text(top, 0, -62, 50, '#ff8a96', 'Anton'); g.font = '84px Anton'; const sc = Math.min(1, 840 / g.measureText(label).width);
  g.save(); g.translate(0, 32); g.scale(sc, sc); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; text(label, 0, 0, 84, '#fff', 'Anton'); g.restore(); g.restore();
}
function ctaCard(t) {
  const k1 = back(seg(t, W_LILINGON - .1, W_LILINGON + .2), 1.8), k2 = back(seg(t, W_MAGDASAL - .1, W_MAGDASAL + .2), 1.8); if (k1 <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k1, k1); glass(-450, -170, 900, 340, 40, 'rgba(255,255,255,.6)', 4, 'rgba(160,190,255,.5)');
  text(TX.cta[0], 0, -80, 96, '#fff', 'Anton', 'center', 10);
  if (k2 > 0) { g.save(); g.translate(0, 30); g.scale(k2, k2); g.shadowColor = 'rgba(120,170,255,.9)'; g.shadowBlur = 26; text(TX.cta[1], 0, 0, 96, '#9cc0ff', 'Anton', 'center', 10); g.restore(); text(TX.cta[2], 0, 118, 46, '#ffd27a', 'Anton'); }
  g.restore();
}
function grain(t) { reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .09; const f = Math.floor(t * 24), ox = -hash(f) * 300, oy = -hash(f * 1.7) * 300; g.drawImage(TEX.paper, ox, oy, W + 300, H + 300); reset(); }
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .26; g.filter = 'blur(18px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .2, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }

const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = []; FLARES.length = 0;
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1; S[sh[2]](t, u);
  bloom(); vignette(.62); grain(t); reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .55; g.drawImage(TEX.brush, 0, 0); reset();
  if (sh[0] > 0) { const d = 1 - ss(seg(u, 0, .22)); if (d > 0) { reset(); g.fillStyle = `rgba(0,0,0,${.75 * d})`; g.fillRect(0, 0, W, H); } }
  const nx = SHOTS[SHOTS.indexOf(sh) + 1]; if (nx) { const d = ss(seg(t, sh[1] - .14, sh[1])); if (d > 0) { reset(); g.fillStyle = `rgba(0,0,0,${.6 * d})`; g.fillRect(0, 0, W, H); } }
  if (sh[2] === 'hook') titleCard(t, 1 - ss(seg(t, T('h2') - .3, T('h2') + .2)));
  else if (sh[2] === 'loop') titleCard(t, ss(seg(u, .3, .8)));
  if (sh[2] === 'city') placeCard(t, T('s1') + .1, sh[1]);
  if (sh[2] === 'rule') { ruleCard(t, W_NAKAPUTI3 - 1.2, W_SALAMIN3 - .6, TX.rules[0]); ruleCard(t, W_SALAMIN3 - .5, E('s3') + .4, TX.rules[1]); }
  if (sh[2] === 'cta') ctaCard(t);
  if (sh[2] !== 'loop' && sh[2] !== 'final') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);
