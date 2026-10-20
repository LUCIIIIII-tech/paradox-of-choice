// chars.js — the cast of "Paradox of Choice": Benny (nervous), Oona (deadpan), the Special (hoagie creature) + props
// Every character: local origin at the feet, y down; face = 1 looks right (3/4), -1 mirrored.
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text } from './toon.js';

export const PAL = {
  // Benny
  skinB: '#f0bf93', skinBs: '#d19a6c', hairB: '#4a2f24', card: '#e8b23a', cardS: '#c28c1d', tee: '#f6f0e2', pants: '#566384', pantsS: '#414b66', shoeB: '#b4503a', shoeBs: '#8d3a28',
  pillow: '#f07a5f', pillowS: '#c9573f',
  // Oona
  skinO: '#8c5a3e', skinOs: '#6b4029', bun: '#6c3a7c', bunS: '#4f2760', shirt: '#f3e7d1', stripe: '#9a5b8c', dung: '#2f7a4f', dungS: '#215a39', boot: '#7a2e3a', bootS: '#5a1f29',
  mitt: '#de4a3a', mittS: '#b0362a', cuff: '#fbf3e4', pencil: '#f2c94c', eraser: '#f28fa3',
  // shared
  white: '#ffffff', mouthIn: '#4a1a2a', tongue: '#e8637a', sweat: '#d8f1ff',
  bread: '#f1d29a', crust: '#c98a45', lettuce: '#7cc35a', lettuceS: '#58a03e', tomato: '#e5503e', ham: '#f39ab0', turkey: '#efd9b8', cheese: '#f7cf3d', egg: '#f6e27a',
  steel: '#b9c5d0', steelS: '#8d9cab', remote: '#5e6372', remoteS: '#474b58', tape: '#d9d7cf', button: '#e8392b',
};

// —— face parts ——
export function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.5, skin = PAL.skinB, closed = false, happy = false, lw = 6, jitter = 0, lower = 0 } = {}) {
  if (happy) { stroke(arc(cx, cy + ry * .25, rx * .75, ry * .5, Math.PI * 1.1, Math.PI * 1.9, 14), lw); return; }      // ^ ^ bliss
  if (closed) { stroke(arc(cx, cy + ry * .15, rx * .8, ry * .45, Math.PI * .1, Math.PI * .9, 14), lw); return; }
  shape(ell(cx, cy, rx, ry, 36), {
    fill: PAL.white, lw, shade: () => {
      dot(cx + look[0] * rx * .55 + jitter, cy + look[1] * ry * .5, pupil);
      if (lid > 0) {
        const yl = cy - ry + lid * 2 * ry;
        fillOnly([[cx - rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, yl], [cx - rx * 1.3, yl + ry * .08]], skin, { boil: .5 });
        stroke([[cx - rx * 1.2, yl + ry * .08], [cx + rx * 1.2, yl]], lw);
      }
      if (lower > 0) { const yb = cy + ry - lower * 2 * ry; fillOnly([[cx - rx * 1.3, yb], [cx + rx * 1.3, yb], [cx + rx * 1.3, cy + ry * 1.4], [cx - rx * 1.3, cy + ry * 1.4]], skin, { boil: .5 }); stroke([[cx - rx * 1.2, yb], [cx + rx * 1.2, yb]], lw * .8); }
    }
  });
}
// mouth: o open 0..1, w width, sm corners (+smile / -frown), skew
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 6, teeth = true, tongue = true, chew = 0 } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (chew > 0) {   // full cheeks, lips pressed and wobbling
    stroke(quad(lc, [cx + Math.sin(chew * 9) * hw * .3, cy + sm * k * 1.2 + Math.cos(chew * 9) * 4], rc, 12), lw);
    return;
  }
  if (o < .07) { stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw); return; }
  const h = o * mw * .62;
  const up = quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), dn = quad(rc, [cx, cy + h + sm * k * .6], lc, 14);
  shape([...up, ...dn], {
    fill: PAL.mouthIn, lw, shade: () => {
      if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .32 + 6), PAL.white, { boil: .3 });
      if (tongue) fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), PAL.tongue, { boil: .3 });
    }
  });
}
export function hand(x, y, ang, r = 18, col = PAL.skinB, { fist = false, lw = 6 } = {}) {
  push(); translate(x, y); rotate(ang);
  const pts = fist ? spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
    : spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw });
  pop();
}
// oven mitt: a quilted mitten with a thumb lobe and a cream cuff
export function mitt(x, y, ang, r = 30, { lw = 6, press = 0 } = {}) {
  push(); translate(x, y); rotate(ang);
  shape(rr(-r * .9, -r * .62, r * .7, r * 1.24, 8), { fill: PAL.cuff, lw });
  shape(spline([[-r * .3, -r * .75], [r * .5, -r * .95], [r * 1.25, -r * .7], [r * 1.45, 0], [r * 1.25, r * .7], [r * .5, r * .9], [-r * .3, r * .72]]), {
    fill: PAL.mitt, lw, shade: () => { fillOnly(rect(-r, r * .25, r * 3, r), PAL.mittS, { boil: .3 }); for (let k = 0; k < 3; k++) stroke([[r * (.05 + k * .4), -r * .8], [r * (.05 + k * .4), r * .8]], 3, { line: PAL.mittS }); }
  });
  shape(spline([[r * .2, -r * .7], [r * .55, -r * 1.35 - press * 6], [r * .95, -r * 1.25 - press * 6], [r * .9, -r * .7]]), { fill: PAL.mitt, lw });   // thumb
  pop();
}
export const sweatDrop = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: PAL.sweat, lw: 5 });

// —— props ——
// the Elsewhere Remote: a TV remote duct-taped under a kitchen colander, one big button
export function remote(x, y, a = 0, s = 1, { press = 0 } = {}) {
  push(); translate(x, y); rotate(a); scale(s);
  shape(spline([[-92, -6], [92, -6], [78, 46], [40, 70], [-40, 70], [-78, 46]]), {
    fill: PAL.steel, lw: 7, shade: () => {
      fillOnly(spline([[20, -10], [100, -10], [80, 60], [30, 80]]), PAL.steelS, { boil: .3 });
      for (let i = 0; i < 14; i++) dot(-58 + (i % 7) * 19, 20 + Math.floor(i / 7) * 22 + (i % 2) * 4, 3.2, PAL.steelS);
    }
  });
  shape(ell(0, -6, 92, 14, 30), { fill: PAL.steelS, lw: 6 });
  for (const sx of [-1, 1]) shape(rr(sx * 92 - 14, -14, 28, 14, 6), { fill: PAL.steel, lw: 5 });   // handles
  // remote taped on top
  shape(rr(-30, -52, 60, 46, 10), { fill: PAL.remote, lw: 6, shade: () => fillOnly(rect(8, -60, 30, 60), PAL.remoteS, { boil: .3 }) });
  shape([[-46, -40], [46, -30], [44, -18], [-48, -28]], { fill: PAL.tape, lw: 5 });
  shape(ell(0, -58 + press * 5, 18, 12 - press * 4, 20), { fill: PAL.button, lw: 5 });
  dot(-14, -16, 3.5, '#9aa3b0'); dot(0, -16, 3.5, '#9aa3b0'); dot(14, -16, 3.5, '#9aa3b0');
  pop();
}
// triangle sandwich (front view). kind: ham | turkey | egg | deluxe | plain; wrap = plastic wrap
export function sandwich(x, y, s = 1, kind = 'plain', { a = 0, wrap = false, bite = 0, lw = 6, boil = 1 } = {}) {
  push(); translate(x, y); rotate(a); scale(s);
  const fill = { ham: PAL.ham, turkey: PAL.turkey, egg: PAL.egg, deluxe: PAL.tomato, plain: PAL.cheese }[kind] || PAL.cheese;
  // back slice + filling + front slice (a triangle, point up)
  const tri = (dx, dy) => spline([[dx - 70, dy + 40], [dx, dy - 60], [dx + 70, dy + 40]].flatMap((p, i, A) => [p]), true, 4);
  shape(tri(10, -6), { fill: PAL.crust, lw, boil });
  shape(spline([[-82, 30], [-60, 18], [-30, 34], [0, 20], [30, 34], [62, 18], [84, 30], [70, 46], [-70, 46]]), { fill: kind === 'deluxe' ? PAL.lettuce : PAL.lettuce, lw: lw - 1, boil });
  shape([[-76, 36], [76, 36], [70, 50], [-70, 50]], { fill, lw: lw - 1, boil });
  const front = spline([[-72, 48], [-4, -58], [4, -58], [72, 48]]);
  shape(front, { fill: PAL.bread, lw, boil, shade: () => { fillOnly(spline([[-52, 36], [0, -42], [52, 36]]), '#f8e2b6', { boil: .3 }); } });
  if (bite > 0) shape(ell(30, -20, 34 * bite, 30 * bite, 18), { fill: '#fff6d6', lw: 5, boil });   // bite mark (drawn by the scene behind-colour)
  if (wrap) {
    fillOnly(rr(-92, -76, 184, 140, 26), 'rgba(255,255,255,.28)', { boil: .5 });
    shape(rr(-92, -76, 184, 140, 26), { lw: 4, line: 'rgba(40,30,50,.55)' });
    stroke([[-60, -50], [-30, -64]], 5, { line: 'rgba(255,255,255,.9)' }); stroke([[50, 30], [72, 10]], 5, { line: 'rgba(255,255,255,.8)' });
  }
  pop();
}
// tiny low-detail sandwich for big crowds (aisle, walls): fewer points, little boil
export function miniSandwich(x, y, s, kind = 'plain', boil = .4) {
  push(); translate(x, y); scale(s);
  const fill = { ham: PAL.ham, turkey: PAL.turkey, egg: PAL.egg, deluxe: PAL.tomato, plain: PAL.cheese }[kind] || PAL.cheese;
  shape([[-60, 40], [0, -50], [60, 40]], { fill: PAL.crust, lw: 5, boil });
  fillOnly([[-62, 30], [62, 30], [62, 44], [-62, 44]], fill, { boil: 0 });
  shape([[-54, 44], [0, -44], [54, 44]], { fill: PAL.bread, lw: 5, boil });
  pop();
}

// —— Benny ——
// P: {x,y,s,face,t,lean,bob,sq,nerv,look,lid,blink,brow,mouth:{o,w,sm,skew},armR:{h,bend},armL,legL,legR,headTilt,sweat,eyeS,pupil,happy,closed,chew,holdR,eat}
export function benny(P) {
  const f = P.face ?? 1, ner = P.nerv ?? 0, t = P.t || 0;
  const jit = ner ? (hash(Math.floor(t * 12) * 3.3) - .5) * 9 * ner : 0;
  push(); translate(P.x + jit, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  const legL = P.legL || [0, 0], legR = P.legR || [0, 0];
  for (const [sx, lg] of [[-1, legL], [1, legR]]) {
    const hip = [sx * 34, -110], ank = [sx * 38 + lg[0], -26 + lg[1]];
    shape(noodle(hip, ank, sx * 4, 40, 34), { fill: PAL.pants, lw: 7, shade: () => fillOnly(rect(sx > 0 ? 10 : -200, -140, 190, 160), PAL.pantsS, { boil: .3 }) });
    shape(spline([[ank[0] - 30, ank[1] + 24], [ank[0] - 24, ank[1] - 2], [ank[0] + 14, ank[1] - 4], [ank[0] + 44, ank[1] + 12], [ank[0] + 40, ank[1] + 26]]), { fill: PAL.shoeB, lw: 7, shade: () => fillOnly(rect(ank[0] - 40, ank[1] + 16, 100, 20), PAL.shoeBs, { boil: .3 }) });
  }
  push(); rotate(P.lean ?? 0);
  const shB = [-78, -292], shF = [80, -292];
  const armB = P.armL || { h: [-16, 150], bend: -18 }, armF = P.armR || { h: [16, 150], bend: 18 };
  const drawArm = (sh, arm, hold) => {
    const hp = [sh[0] + arm.h[0], sh[1] + arm.h[1]], ang = Math.atan2(hp[1] - sh[1], hp[0] - sh[0]);
    shape(noodle(sh, hp, arm.bend ?? 0, 38, 30), { fill: PAL.card, lw: 7 });
    if (hold === 'sandwich') sandwich(hp[0] + 6, hp[1] - 40, .62, 'egg', { a: -.15, wrap: !P.unwrapped, bite: P.bite || 0 });
    hand(hp[0], hp[1], ang, 17, PAL.skinB, { fist: !!hold || arm.fist });
  };
  drawArm(shB, armB);
  // pear body: cardigan over a cream tee
  const body = spline([[0, -322], [62, -312], [98, -246], [122, -150], [104, -96], [0, -84], [-104, -96], [-122, -150], [-98, -246], [-62, -312]]);
  shape(body, {
    fill: PAL.card, lw: 7, shade: () => {
      fillOnly(spline([[-34, -330], [34, -330], [40, -200], [36, -80], [-36, -80], [-40, -200]]), PAL.tee, { boil: .4 });
      fillOnly(ell(0, -210, 18, 14, 10), PAL.crust, { boil: .3 });                 // tiny sandwich print
      fillOnly([[-14, -206], [14, -206], [0, -226]], PAL.bread, { boil: .3 });
      fillOnly(spline([[60, -320], [140, -280], [140, -90], [80, -90], [100, -200]]), PAL.cardS, { boil: .4 });
    }
  });
  stroke([[-36, -320], [-40, -200], [-36, -88]], 5); stroke([[36, -320], [40, -200], [36, -88]], 5);
  for (const by of [-250, -190, -130]) dot(-50, by, 5.5, INK);
  // travel neck-pillow (back half), head, then the two front lobes
  const yank = P.yank || 0;
  shape(ell(0, -340 - yank * 10, 132, 52, 36), { fill: PAL.pillow, lw: 7, shade: () => fillOnly(ell(30, -310, 140, 30, 24), PAL.pillowS, { boil: .3 }) });
  push(); translate(8, -462); rotate(P.headTilt ?? 0);
  headBenny(P, ner, t);
  pop();
  for (const sx of [-1, 1]) shape(ell(sx * 70 + 8, -350 - yank * 10, 52, 36, 26), { fill: PAL.pillow, lw: 7, shade: () => fillOnly(ell(sx * 70 + 22, -332, 46, 18, 18), PAL.pillowS, { boil: .3 }) });
  drawArm(shF, armF, P.holdR);
  pop();
  if (P.sweat != null) { const u = P.sweat % 1; sweatDrop(-118, -560 + u * 40, 1.1); sweatDrop(126, -540 + ((u + .5) % 1) * 40, .9); }
  pop();
}
function headBenny(P, ner, t) {
  for (const sx of [-1, 1]) shape(ell(sx * 98, 8, 18, 26, 16), { fill: PAL.skinB, lw: 6 });
  shape(spline([[0, -96], [70, -84], [104, -20], [96, 50], [56, 92], [0, 100], [-56, 92], [-96, 50], [-104, -20], [-70, -84]]), {
    fill: PAL.skinB, lw: 7, shade: () => { fillOnly(ell(70, 40, 60, 80, 24), PAL.skinBs, { boil: .3 }); fillOnly(spline([[-90, -50], [-40, -110], [40, -112], [90, -54], [40, -78], [-40, -76]]), PAL.hairB, { boil: .4 }); }
  });
  stroke(spline([[-6, -98], [-2, -128], [18, -136], [26, -118], [10, -112], [8, -124]], false), 6);     // the one curl
  // brows: worry lifts the inner ends; br < 0 = relaxed
  const br = P.brow ?? 1;
  stroke([[-76, -46 + br * 2], [-30, -52 - br * 12]], 8); stroke([[90, -46 + br * 2], [46, -52 - br * 12]], 8);
  const look = P.look || [0, 0], shake = ner ? (hash(Math.floor(t * 24) * 1.7) - .5) * 3 * ner : 0, es = P.eyeS ?? 1;
  for (const ex of [-30, 46]) eye(ex, 0, 38 * es, 44 * es, { lid: P.blink ? 1 : (P.lid ?? 0), look, pupil: P.pupil ?? 4.5, skin: PAL.skinB, jitter: shake, lw: 6, happy: P.happy, closed: P.closed });
  shape(ell(12, 50, 13, 10, 12), { fill: PAL.skinBs, lw: 5 });
  for (const [fx, fy] of [[-62, 52], [-50, 60], [80, 52], [92, 60]]) dot(fx, fy, 3, '#c97a52');
  const m = P.mouth || {};
  if (P.chew) shape(ell(64, 74, 26, 20, 14), { fill: PAL.skinB, lw: 5 });   // a full cheek
  mouth(10, 76, 52 * (P.mouthS ?? 1), { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.5, skew: m.skew || 0, lw: 6, chew: P.chew || 0 });
}

// —— Oona ——
// P: {x,y,s,face,t,lean,bob,sq,look,lid,blink,brow,mouth,armR,armL,holdR,press,legL,legR,headTilt,shrug}
export function oona(P) {
  const f = P.face ?? 1;
  push(); translate(P.x, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  const legL = P.legL || [0, 0], legR = P.legR || [0, 0];
  for (const [sx, lg] of [[-1, legL], [1, legR]]) {
    const hip = [sx * 40, -420], ank = [sx * 42 + lg[0], -56 + lg[1]];
    shape(noodle(hip, ank, sx * -5, 50, 44), { fill: PAL.dung, lw: 7, shade: () => fillOnly(rect(sx > 0 ? 14 : -200, -460, 186, 440), PAL.dungS, { boil: .3 }) });
    shape(spline([[ank[0] - 30, ank[1] + 50], [ank[0] - 30, ank[1] - 10], [ank[0] + 26, ank[1] - 10], [ank[0] + 30, ank[1] + 24], [ank[0] + 62, ank[1] + 34], [ank[0] + 60, ank[1] + 54]]), { fill: PAL.boot, lw: 7, shade: () => fillOnly(rect(ank[0] - 40, ank[1] + 40, 120, 20), PAL.bootS, { boil: .3 }) });
  }
  push(); translate(0, -420); rotate(P.lean ?? .1); translate(0, 420);
  const shr = P.shrug || 0;
  const shB = [-74, -700 - shr * 26], shF = [76, -700 - shr * 26];
  const armB = P.armL || { h: [-18, 290], bend: -22 }, armF = P.armR || { h: [18, 290], bend: 22 };
  const drawArm = (sh, arm, hold) => {
    const hp = [sh[0] + arm.h[0], sh[1] + arm.h[1]], ang = Math.atan2(hp[1] - sh[1], hp[0] - sh[0]);
    shape(noodle(sh, hp, arm.bend ?? 0, 36, 30), { fill: PAL.shirt, lw: 7, shade: () => { for (let k = -6; k < 8; k++) fillOnly(rect(-400, sh[1] + k * 44, 800, 14), PAL.stripe, { boil: .2 }); } });
    if (hold === 'remote') { remote(hp[0] + 8, hp[1] - 38, -(P.lean ?? .1) + (arm.ra || 0), .82, { press: P.press || 0 }); }
    mitt(hp[0], hp[1], ang, 30, { press: hold === 'remote' ? (P.press || 0) : 0 });
  };
  drawArm(shB, armB);
  // torso: striped shirt, dungaree bib + straps
  shape(spline([[0, -722], [64, -708], [82, -620], [70, -520], [86, -420], [0, -404], [-86, -420], [-70, -520], [-82, -620], [-64, -708]]), {
    fill: PAL.shirt, lw: 7, shade: () => {
      for (let k = 0; k < 9; k++) fillOnly(rect(-120, -716 + k * 40, 240, 14), PAL.stripe, { boil: .2 });
      fillOnly(spline([[-62, -590], [62, -590], [74, -520], [88, -404], [-88, -404], [-74, -520]]), PAL.dung, { boil: .4 });
      fillOnly(rect(30, -600, 80, 200), PAL.dungS, { boil: .3 });
    }
  });
  stroke([[-58, -592], [62, -592]], 5);
  stroke([[-52, -592], [-46, -712]], 9, { line: PAL.dungS }); stroke([[54, -592], [48, -712]], 9, { line: PAL.dungS });
  for (const bx of [-46, 48]) dot(bx, -582, 7, '#f2c94c');
  shape(rr(-30, -560, 60, 40, 6), { fill: PAL.dungS, lw: 5 });          // bib pocket
  stroke([[-14, -566], [-14, -600]], 6, { line: PAL.pencil });            // a spare pencil
  // neck + head + beehive
  shape(noodle([2, -716], [14, -800], 4, 40, 36), { fill: PAL.skinO, lw: 6 });
  push(); translate(22, -878); rotate(P.headTilt ?? .06);
  headOona(P);
  pop();
  drawArm(shF, armF, P.holdR);
  pop();
  pop();
}
function headOona(P) {
  // beehive behind the head
  shape(spline([[-76, -40], [-86, -150], [-64, -250], [0, -282], [64, -250], [86, -150], [76, -40], [0, -60]]), {
    fill: PAL.bun, lw: 7, shade: () => { fillOnly(spline([[20, -290], [100, -240], [100, -40], [40, -60], [60, -160]]), PAL.bunS, { boil: .3 }); for (let k = 0; k < 4; k++) stroke(arc(0, -120 - k * 40, 60, 20, Math.PI * .15, Math.PI * .85, 10), 4, { line: PAL.bunS }); }
  });
  // pencil through the bun
  shape([[-120, -196], [100, -176], [100, -164], [-120, -184]], { fill: PAL.pencil, lw: 5 });
  shape([[100, -176], [126, -170], [100, -164]], { fill: '#f6d7a7', lw: 4 });
  shape(rr(-138, -198, 22, 18, 4), { fill: PAL.eraser, lw: 4 });
  // ears + long face
  for (const sx of [-1, 1]) shape(ell(sx * 66, 6, 14, 22, 14), { fill: PAL.skinO, lw: 6 });
  shape(spline([[0, -96], [52, -86], [70, -20], [64, 60], [36, 108], [0, 118], [-36, 108], [-64, 60], [-70, -20], [-52, -86]]), {
    fill: PAL.skinO, lw: 7, shade: () => { fillOnly(ell(50, 40, 40, 90, 20), PAL.skinOs, { boil: .3 }); fillOnly(spline([[-74, -40], [-60, -100], [0, -114], [60, -100], [74, -40], [30, -70], [-30, -70]]), PAL.bun, { boil: .4 }); }
  });
  const lid = P.blink ? 1 : clamp(P.lid ?? .52, 0, 1), look = P.look || [0, 0];
  for (const [ex, rx] of [[-20, 30], [34, 26]]) {
    eye(ex, -2, rx, 34, { lid, look, pupil: 4.2, skin: PAL.skinO, closed: P.closed });
    stroke(arc(ex, 38, rx * .8, 8, Math.PI * .15, Math.PI * .85, 10), 4);       // eye bags
  }
  const br = P.brow ?? 0;
  stroke([[-48, -46 - br * 8], [0, -50 - br * 4]], 8); stroke([[12, -50 - br * 4], [62, -46 - br * 8]], 8);
  shape(spline([[10, -6], [20, 34], [36, 48], [24, 58], [6, 54]]), { fill: PAL.skinO, lw: 6, shade: () => fillOnly(ell(30, 52, 10, 6, 10), PAL.skinOs, { boil: .3 }) });
  const m = P.mouth || {};
  mouth(10, 84, 46, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.15, skew: m.skew ?? .15, lw: 6 });
}

// —— the Special: a hoagie with a lettuce tongue and one googly eye ——
export function special(x, y, s, t, { lick = 0, look = [0, 0], a = 0, blink = 0 } = {}) {
  push(); translate(x, y); rotate(a); scale(s);
  shape(spline([[-130, 10], [-120, -30], [0, -44], [120, -30], [130, 10], [0, 22]]), { fill: PAL.crust, lw: 7 });     // bottom bun
  // fillings
  shape(spline([[-128, -16], [-90, -34], [-50, -18], [-10, -34], [30, -18], [70, -34], [110, -18], [130, -26], [126, 4], [-126, 4]]), { fill: PAL.lettuce, lw: 6 });
  for (let i = 0; i < 4; i++) shape(ell(-80 + i * 52, -24, 22, 9, 14), { fill: '#c9433a', lw: 5 });
  // top bun
  shape(spline([[-126, -30], [-110, -84], [-40, -106], [40, -106], [110, -84], [126, -30], [0, -40]]), {
    fill: PAL.bread, lw: 7, shade: () => { fillOnly(spline([[30, -110], [130, -80], [130, -30], [50, -40]]), '#ddb06d', { boil: .3 }); for (let i = 0; i < 9; i++) fillOnly(ell(-80 + hash(i * 3) * 160, -70 - hash(i * 5) * 26, 6, 3, 8), '#fff7e0', { boil: 0 }); }
  });
  // lettuce tongue
  if (lick > 0) {
    const L = 40 + lick * 150, wav = Math.sin(t * 22) * 12 * lick;
    shape(spline([[96, -14], [96 + L * .5, -40 + wav], [96 + L, -24 - wav], [96 + L * 1.05, 0], [96 + L * .5, 6 + wav], [96, 4]]), { fill: PAL.lettuce, lw: 6, shade: () => stroke([[100, -6], [96 + L, -14]], 3, { line: PAL.lettuceS }) });
  }
  // one googly eye on a toothpick
  stroke([[10, -104], [16, -156]], 6, { line: '#e9d3a3' });
  stroke([[10, -104], [16, -156]], 2);
  const wob = Math.sin(t * 11) * .6;
  shape(ell(18, -186, 38, 38, 30), { fill: PAL.white, lw: 7, shade: () => { if (blink < .5) dot(18 + (look[0] + wob * .3) * 16, -186 + (look[1] + Math.abs(wob) * .4) * 16, 12); else fillOnly(rect(-30, -230, 100, 50), PAL.bread, { boil: .3 }); } });
  pop();
}
