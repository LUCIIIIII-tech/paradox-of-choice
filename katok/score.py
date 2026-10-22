"""Sound for Katok (the knock) -> out/mix.wav (48 kHz stereo). Cinematic sound design in numpy (the toolkit from ../puyat and
../huling-tren): knuckles on a wooden door (and the low ones, from the floor), a fridge humming in the dark, a heartbeat that speeds up,
a slam and then dead silence after every rule, a door chain rattling and snapping, footsteps walking away, a phone buzzing, a string
stinger. Every time comes from timeline.json and the same knock formula main.js uses. Usage: python3 score.py [en]"""
import os, sys, json, wave, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
LANG = sys.argv[1] if len(sys.argv) > 1 else 'tl'; SUF = '' if LANG == 'tl' else '.' + LANG
VDIR = 'voices' if LANG == 'tl' else 'voices_' + LANG
TL = json.load(open(os.path.join(HERE, f'timeline{SUF}.json'), encoding='utf-8')); DUR = TL['dur']; N = int(SR * DUR) + SR
ANCH = json.load(open(os.path.join(HERE, f'anchors{SUF}.json'))) if SUF else {}
LN = {l['id']: l for l in TL['lines']}
rng = np.random.default_rng(11)
BUS = {k: np.zeros((2, N)) for k in ('mus', 'sfx', 'amb')}
SEND = {(b, k): np.zeros(N) for b in BUS for k in ('room', 'hall')}

# ---------- dsp ----------
def tt(n): return np.arange(n) / SR
def noise(d): return rng.standard_normal(max(1, int(d * SR)))
def spec(x, gfn): F = np.fft.rfft(x); f = np.maximum(np.fft.rfftfreq(len(x), 1 / SR), 1.0); return np.fft.irfft(F * gfn(f), len(x))
def lp(x, hi, o=4): return spec(x, lambda f: 1 / (1 + (f / hi) ** o))
def hp(x, lo, o=4): return spec(x, lambda f: 1 / (1 + (lo / f) ** o))
def bp(x, lo, hi, o=4): return spec(x, lambda f: 1 / (1 + (lo / f) ** o) / (1 + (f / hi) ** o))
def sat(x, k=2.0): return np.tanh(x * k) / np.tanh(k)
def m2f(m): return 440 * 2 ** ((m - 69) / 12)
def lerp(a, b, u): return a + (b - a) * u
def fconv(x, h):
    m = len(x) + len(h) - 1; F = 1 << (m - 1).bit_length(); return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
def tvf(x, fc, bw=1.0, kind='bp'):
    """time-varying filter (STFT): fc = centre / cutoff per sample. kind bp (gaussian in octaves) or lp."""
    n, hop = 1024, 256; win = np.hanning(n); fc = np.asarray(fc, float)
    pad = np.concatenate([np.zeros(n), x, np.zeros(n)]); out = np.zeros(len(pad)); ws = np.zeros(len(pad)); f = np.maximum(np.fft.rfftfreq(n, 1 / SR), 1.0)
    for i in range(0, len(pad) - n, hop):
        c = fc[min(len(fc) - 1, max(0, i + n // 2 - n))]
        gain = np.exp(-.5 * (np.log2(f / c) / bw) ** 2) if kind == 'bp' else 1 / (1 + (f / c) ** 4)
        out[i:i + n] += np.fft.irfft(np.fft.rfft(pad[i:i + n] * win) * gain, n) * win; ws[i:i + n] += win ** 2
    return (out / np.maximum(ws, 1e-6))[n:n + len(x)]
def add(bus, t, x, v=1.0, pan=0.0, room=0.0, hall=0.0, width=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i] * v; n = len(x); l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    B = BUS[bus]; B[0, i:i + n] += x * l
    xr = np.concatenate([np.zeros(int(width * SR)), x])[:n] if width else x
    B[1, i:i + n] += xr * r
    if room: SEND[(bus, 'room')][i:i + n] += x * room
    if hall: SEND[(bus, 'hall')][i:i + n] += x * hall
def add2(bus, t, L, R, v=1.0, room=0.0, hall=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(L) <= 0: return
    if i < 0: L = L[-i:]; R = R[-i:]; i = 0
    n = min(len(L), N - i); BUS[bus][0, i:i + n] += L[:n] * v; BUS[bus][1, i:i + n] += R[:n] * v
    if room or hall:
        m = (L[:n] + R[:n]) * .5 * v
        if room: SEND[(bus, 'room')][i:i + n] += m * room
        if hall: SEND[(bus, 'hall')][i:i + n] += m * hall
def fade(n, a=.01, r=.05): s = tt(n); d = n / SR; return np.minimum(1, s / max(a, 1e-4)) * np.minimum(1, np.maximum(0, d - s) / max(r, 1e-4))

# ---------- timeline helpers (same formulas as main.js) ----------
def wt(id, w):
    w = ANCH.get(f'{id}:{w}', w); l = LN[id]
    for x in l.get('words', []):
        if ''.join(c for c in x[0].lower() if c.isalnum() or c == "'").startswith(w.lower()): return x[1]
    return l['t0']
T = lambda id: LN[id]['t0']; E = lambda id: LN[id]['t1']; SPAN = lambda id: E(id) - T(id)
SHOTS = []
for i, l in enumerate(TL['lines']):
    end = TL['lines'][i + 1]['t0'] if i < len(TL['lines']) - 1 else DUR
    if i and l['shot'] == TL['lines'][i - 1]['shot']: SHOTS[-1][1] = end; continue
    SHOTS.append([SHOTS[-1][1] if i else 0, end, l['shot']])

# ---------- cinematic elements ----------
def impact(t, v=1.0, size=1.0, pan=0.0):           # sub thump + low body + crack + a hall tail
    d = 1.6 * size; n = int(d * SR); s = tt(n)
    f = 36 + 72 * np.exp(-s * 13); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s / (.38 * size))
    body = lp(noise(d), 650) * np.exp(-s / .08) * 1.7
    tail = bp(noise(d), 180, 3800) * np.exp(-s / (.45 * size)) * .22
    y = sat(sub + body * .6, 1.7) + tail; k = int(.03 * SR); y[:k] += hp(noise(.03), 2600) * np.exp(-tt(k) / .005) * 1.1
    add('sfx', t, y * fade(n, .001, .1), v * .9, pan, room=.12, hall=.32 * size, width=.006)
def sub_drop(t, v=.8, d=1.8):
    n = int(d * SR); s = tt(n); f = 88 * np.exp(-s * 2.0) + 25
    add('sfx', t, sat(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, s / .004) * np.exp(-s / (d * .42)), 1.4), v, 0, hall=.08)
def whoosh(t, d=.5, v=.3, lo=220, hi=5200, p0=-.7, p1=.7, bw=1.1):   # t = the moment it passes you
    n = int(d * SR); u = tt(n) / d; fc = lo * (hi / lo) ** (np.sin(np.pi * u) ** 1.4)
    y = tvf(noise(d), fc, bw) * np.sin(np.pi * u) ** 2.2; p = p0 + (p1 - p0) * u
    add2('sfx', t - d * .55, y * np.cos((p + 1) * np.pi / 4) * 1.414, y * np.sin((p + 1) * np.pi / 4) * 1.414, v, room=.08, hall=.12)
def riser(t_end, d=1.2, v=.5):                      # Shepard-style rising partials + rising air; cuts dead at t_end
    n = int(d * SR); s = tt(n); u = s / d; y = np.zeros(n)
    for k in range(6):
        f = 55 * 2 ** (k + 2.4 * u); a = np.exp(-.5 * (np.log2(f / 500) / 1.1) ** 2); y += np.sin(2 * np.pi * np.cumsum(f) / SR + k) * a
    y = y / 4 + tvf(noise(d), 350 * 14 ** u, 1.4) * .9
    y *= u ** 2.3; k = int(.012 * SR); y[-k:] *= np.linspace(1, 0, k)
    add('sfx', t_end - d, y, v, 0, hall=.22, width=.01)
def reverse_swell(t_end, d=1.0, v=.45):             # a reversed cymbal / reverb tail swelling into the cut
    n = int(d * SR); x = (bp(noise(d), 400, 11000) * np.exp(-tt(n) / (d * .33)))[::-1]; k = int(.008 * SR); x[-k:] *= np.linspace(1, 0, k)
    add('sfx', t_end - d, x, v, 0, hall=.25, width=.012)
def braam(t, v=.8, d=2.4):                          # low brass cluster, the filter opening then closing
    n = int(d * SR); s = tt(n); y = np.zeros(n)
    for f in (36.7, 55.0, 73.4, 87.3):
        for det in (.994, 1.0, 1.007): ph = 2 * np.pi * f * det * s; y += sum(np.sin(k * ph) / k for k in range(1, 16))
    y = tvf(sat(y * .25, 2.2), 180 + 1600 * np.exp(-((s - .25) / .45) ** 2), kind='lp') * np.minimum(1, s / .03) * np.exp(-s / 1.0)
    add('sfx', t, y, v * .5, 0, hall=.35, width=.012)
def stinger(t, v=1.0):                              # the scare: a screeching high string cluster + bow noise + the hit + a sub drop
    d = 1.4; n = int(d * SR); s = tt(n); y = np.zeros(n)
    for f0 in (1318.5, 1396.9, 1480.0, 1975.5, 2093.0):
        for det in (.996, 1.0, 1.005):
            f = f0 * det * (1 + .007 * np.sin(2 * np.pi * 6.3 * s + det * 20)); ph = 2 * np.pi * np.cumsum(f) / SR; y += sum(np.sin(k * ph) / k for k in range(1, 7))
    y = bp(y, 700, 9000) * (1 + .35 * np.sin(2 * np.pi * 13 * s)) + bp(noise(d), 2200, 9000) * 1.4
    y *= np.minimum(1, s / .004) * np.exp(-np.maximum(0, s - .3) / .3)
    add('sfx', t, sat(y * .08, 1.8), v * .75, 0, room=.1, hall=.45, width=.011); impact(t, v * 1.1, 1.3); sub_drop(t, v * .9, 2.2)
def heartbeat(t, v=.6):                             # lub-dub: low thumps with a little skin
    for k, dt in enumerate((0, .19)):
        d = .4; n = int(d * SR); s = tt(n)
        y = np.sin(2 * np.pi * (40 + 26 * np.exp(-s * 26)) * s) * np.exp(-s / .075) + lp(noise(d), 110) * np.exp(-s / .035) * 1.6
        add('sfx', t + dt, sat(y, 1.5) * (1 if k == 0 else .72), v, 0, room=.05)
def tick(t, v=.3, tone=1.0, pan=.15):              # a mechanical clock tick: click + body + a tiny ring
    d = .09; n = int(d * SR); s = tt(n)
    y = hp(noise(d), 3200) * np.exp(-s / .0018) + bp(noise(d), 1700 * tone, 4300 * tone) * np.exp(-s / .011) * .8 + np.sin(2 * np.pi * 3300 * tone * s) * np.exp(-s / .018) * .18
    add('sfx', t, y, v, pan, room=.14)
def clock(t0, t1, period=1.0, v=.25, accel=1.0):
    t, k, p = t0, 0, period
    while t < t1: tick(t, v * (1 if k % 2 == 0 else .8), 1.0 if k % 2 == 0 else .82); t += p; p = max(.12, p * accel); k += 1
def drone(t0, t1, v=.3, root=38, grit=.35, beat=.002):   # a dark tension pad: low cluster, slow beating, filtered rumble
    n = int((t1 - t0) * SR); s = tt(n); f = m2f(root); y = np.zeros(n)
    for k, (r, a) in enumerate([(1, 1), (1.5, .45), (2, .4), (2.38, .2), (3.01, .12), (4.76, .05)]): y += np.sin(2 * np.pi * f * r * s * (1 + beat * np.sin(2 * np.pi * .09 * (k + 1) * s)) + k) * a
    y += bp(noise(t1 - t0), 35, 380) * grit
    add('mus', t0, y * fade(n, 1.2, .4) * (1 + .35 * np.sin(2 * np.pi * .06 * s)), v, 0, hall=.25, width=.015)
def piano(t, m, v=.3, d=3.2, pan=0.0):              # a felt piano note: inharmonic partials, a hammer, a felt low-pass
    f0 = m2f(m); n = int(d * SR); s = tt(n); y = np.zeros(n)
    for k in range(1, 13):
        fk = f0 * k * np.sqrt(1 + .0004 * k * k)
        if fk > 8000: break
        y += np.sin(2 * np.pi * fk * s + k) * (1 / k ** 1.25) * np.exp(-s * (.7 + .55 * k) * (f0 / 262) ** .3)
    k = int(.03 * SR); y[:k] += lp(noise(.03), 1400) * np.exp(-tt(k) / .006) * .6
    y = lp(y, 2400) * np.minimum(1, s / .003) * fade(n, .001, .4)
    add('mus', t, y, v, pan, room=.18, hall=.5, width=.009)
def pad(t0, t1, notes, v=.18):                      # a warm, slow pad (detuned saws, low-passed)
    n = int((t1 - t0) * SR); s = tt(n); y = np.zeros(n)
    for m in notes:
        for det in (.996, 1.004): ph = 2 * np.pi * m2f(m) * det * s; y += sum(np.sin(k * ph) / k for k in range(1, 8))
    add('mus', t0, lp(y, 1100) * fade(n, 1.0, 1.0) / len(notes), v, 0, hall=.4, width=.02)
def bass_pulse(t0, t1, bpm, roots, v=.28):          # a dark 8th-note synth bass under the facts
    step = 60 / bpm / 2; t, i = t0, 0
    while t < t1:
        m = roots[(i // 8) % len(roots)]; d = step * .95; n = int(d * SR); s = tt(n); ph = 2 * np.pi * m2f(m) * s
        y = lp(sum(np.sin(k * ph) / k for k in range(1, 10)), 420) * np.exp(-s / .13) * np.minimum(1, s / .003)
        add('mus', t, y, v * (1 if i % 2 == 0 else .75), 0, room=.04); t += step; i += 1
def motif(t0, t1, v=.26):                           # the felt-piano arpeggio (D minor: i - VII - VI - V)
    bars = [[62, 69, 65, 69], [60, 69, 64, 69], [58, 65, 62, 65], [57, 64, 61, 64]]; q = .62; t, i = t0, 0
    while t < t1:
        b = bars[(i // 4) % 4]; piano(t, b[i % 4], v * (1.1 if i % 4 == 0 else .85), 3.0, .25 * np.sin(i))
        if i % 4 == 0: piano(t, b[0] - 24, v * .7, 4.0)
        t += q; i += 1
def shimmer(t, d=1.6, v=.2):                        # glassy high partials with a slow attack (a sparkle, not a UI ding)
    n = int(d * SR); s = tt(n); y = np.zeros(n)
    for k, m in enumerate((86, 90, 93, 97, 98)): y += np.sin(2 * np.pi * m2f(m) * (1 + .003 * np.sin(2 * np.pi * 5 * s + k)) * s) * np.exp(-.5 * ((s - d * (.3 + .1 * k)) / (d * .25)) ** 2)
    add('sfx', t, y * .3, v, 0, hall=.6, width=.015)

# ---------- foley ----------
def key_click(t, v=.22): d = .05; n = int(d * SR); s = tt(n); add('sfx', t, hp(noise(d), 2200) * np.exp(-s / .003) + bp(noise(d), 600, 2600) * np.exp(-s / .012) * .8, v, rng.uniform(-.25, .25), room=.08)
def typing(t0, t1, v=.2):
    t = t0
    while t < t1: key_click(t, v * rng.uniform(.55, 1)); t += rng.uniform(.06, .17) * (2.5 if rng.random() < .08 else 1)
def mug_down(t, v=.45):
    d = .4; n = int(d * SR); s = tt(n)
    y = lp(noise(d), 380) * np.exp(-s / .03) * 2 + np.sin(2 * np.pi * 170 * s) * np.exp(-s / .04) + sum(np.sin(2 * np.pi * f * s) * np.exp(-s / dd) * a for f, dd, a in ((1880, .12, .2), (4620, .06, .1)))
    add('sfx', t, y, v, -.2, room=.15)
def glass_clink(t, v=.4):
    for k, dt in enumerate((0, .1)):
        d = 1.0; n = int(d * SR); s = tt(n); det = rng.uniform(.98, 1.02)
        y = sum(np.sin(2 * np.pi * f * det * s) * np.exp(-s / dd) * a for f, dd, a in ((2370, .55, 1), (3960, .38, .6), (6110, .24, .4), (8290, .14, .25))) + hp(noise(d), 4000) * np.exp(-s / .002)
        add('sfx', t + dt, y * .35 * (1 if k == 0 else .5), v, .3, room=.2, hall=.15)
def paper_slide(t, d=.7, v=.35):
    n = int(d * SR); u = tt(n) / d; crack = np.repeat(rng.random(n // 48 + 1) ** 6, 48)[:n]
    add('sfx', t, tvf(noise(d), 900 + 2600 * u, 1.3) * np.sin(np.pi * u) ** 1.5 * (.6 + 1.6 * crack), v, rng.uniform(-.3, .3), room=.1)
def page_tear(t, v=.32):
    d = .3; n = int(d * SR); u = tt(n) / d; crack = np.repeat(rng.random(n // 24 + 1) ** 3, 24)[:n]
    add('sfx', t, hp(noise(d), 1300) * crack * u ** .7 * fade(n, .01, .02) * 1.6, v, rng.uniform(-.4, .4), room=.1)
    paper_slide(t + .2, .5, v * .5)
def stamp(t, v=.6):
    d = .5; n = int(d * SR); s = tt(n); y = lp(noise(d), 500) * np.exp(-s / .025) * 2 + bp(noise(d), 300, 1300) * np.exp(-s / .03) + np.sin(2 * np.pi * 95 * s) * np.exp(-s / .07)
    add('sfx', t, sat(y, 1.5), v, 0, room=.2, hall=.15); impact(t, v * .45, .5)
def crt_on(t, v=.45):
    d = 1.0; n = int(d * SR); s = tt(n)
    y = lp(noise(d), 300) * np.exp(-s / .04) * 2 + sum(np.sin(2 * np.pi * f * s) * a for f, a in ((60, 1), (120, .5), (180, .3))) * np.exp(-s / .35) * .5
    y += np.sin(2 * np.pi * 9800 * s) * .05 * np.minimum(1, s / .2) * np.exp(-s / .8) + hp(noise(d), 3000) * (rng.random(n) > .985) * np.exp(-s / .15) * 2
    add('sfx', t, y, v, 0, room=.2)
def rain(t0, t1, v=.3):
    d = t1 - t0; n = int(d * SR); out = []
    for ch in range(2):
        bed = lp(hp(noise(d), 450), 6500) * .28; imp = np.zeros(n); m = int(d * 420); np.add.at(imp, rng.integers(0, n, m), rng.uniform(.15, 1, m) ** 2)
        k = int(.006 * SR); drops = fconv(imp, hp(noise(.006), 2400) * np.exp(-tt(k) / .0014)); out.append((bed + drops * .9) * fade(n, .4, .4))
    add2('amb', t0, out[0], out[1], v, room=.05)
def step(t, v=.35, pan=0.0, heavy=0.0, wet=1.0):     # a footstep on wet pavement: heel, scuff, splash
    d = .2; n = int(d * SR); s = tt(n)
    y = lp(noise(d), 240 + 140 * heavy) * np.exp(-s / (.024 + .015 * heavy)) * 2.4 + bp(noise(d), 900, 4000) * np.exp(-np.maximum(0, s - .02) / .035) * .45 * (s > .015) + hp(noise(d), 2600) * np.exp(-np.maximum(0, s - .01) / .05) * .45 * wet
    add('sfx', t, y, v, pan, room=.14)
def car_interior(t0, t1, v=.3):
    d = t1 - t0; n = int(d * SR); s = tt(n); ph = 2 * np.pi * 34 * s
    y = lp(noise(d), 130) * 1.4 + lp(sum(np.sin(k * ph) / k for k in range(1, 8)), 220) * .5 + bp(noise(d), 500, 2200) * .12
    add('amb', t0, y * fade(n, .3, .3), v, 0, width=.01)
def rumble_strip(t, d=.4, v=.6):
    n = int(d * SR); imp = np.zeros(n); imp[::int(SR / 23)] = 1; k = int(.03 * SR)
    add('sfx', t, sat(fconv(imp, lp(noise(.03), 260) * np.exp(-tt(k) / .008)) * 3, 1.4) * fade(n, .02, .08), v, 0, room=.05)
def truck_horn(t, d=1.3, v=.5):
    n = int(d * SR); s = tt(n); u = s / d; dop = 1 + .045 * (1 - 2 * u)
    y = sum(sum(np.sin(2 * np.pi * np.cumsum(np.full(n, f) * dop) / SR * k) / k for k in range(1, 9)) for f in (185, 233))
    y = lp(y, 1600) * np.sin(np.pi * np.minimum(1, u * 1.1)) ** .6 * fade(n, .03, .1); p = -.4 + .9 * u
    add2('sfx', t, y * np.cos((p + 1) * np.pi / 4) * .25, y * np.sin((p + 1) * np.pi / 4) * .25, v, room=.1, hall=.2)
def purr(t0, t1, v=.25):
    d = t1 - t0; n = int(d * SR); s = tt(n); breath = .55 + .45 * np.sin(2 * np.pi * s / 1.7) ** 2
    add('amb', t0, lp(noise(d), 240) * (.55 + .45 * np.sin(2 * np.pi * 25 * s)) ** 2 * breath * fade(n, .3, .3) * 1.6, v, -.3)
def breath(t, d=1.2, v=.25, gasp=False):
    n = int(d * SR); u = tt(n) / d; e = (np.sin(np.pi * u) ** 1.2) if not gasp else (u / .25) ** 2 * (u < .25) + np.exp(-(u - .25) * 8) * (u >= .25)
    add('sfx', t, tvf(noise(d), 900 + (1400 if gasp else 600) * u, 1.3) * e * (2.2 if gasp else 1), v, -.1, room=.15)
def bubbles(t0, t1, v=.25, rate=14):
    t = t0
    while t < t1:
        d = rng.uniform(.015, .04); n = int(d * SR); s = tt(n); f = rng.uniform(260, 700) * (1 + 2.5 * s / d)
        add('sfx', t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s / (d * .4)) * fade(n, .002, .005), v * rng.uniform(.4, 1), rng.uniform(-.6, .6), room=.1); t += rng.exponential(1 / rate)
def water(t0, t1, v=.3):
    d = t1 - t0; n = int(d * SR); s = tt(n)
    add('sfx', t0, tvf(noise(d), 700 + 450 * np.sin(2 * np.pi * .7 * s) + 300 * np.sin(2 * np.pi * 2.3 * s), 1.6) * fade(n, .3, .5), v, 0, room=.15, width=.012); bubbles(t0, t1, v * .6)
def squelch(t, v=.35):
    d = .28; n = int(d * SR); u = tt(n) / d
    add('sfx', t, sat(tvf(lp(noise(d), 1400), 1300 * (1 - .8 * u), .8) * np.sin(np.pi * u) * 2.5, 1.4), v, rng.uniform(-.4, .4), room=.1)
def pill_rattle(t, d=.6, v=.3):
    s = 0
    while s < d: dd = .006; k = int(dd * SR); add('sfx', t + s, bp(noise(dd), 2200, 7000) * np.exp(-tt(k) / .0015) * (.4 + .6 * abs(np.sin(s * 25))), v * rng.uniform(.3, 1), rng.uniform(-.3, .3), room=.12); s += rng.uniform(.006, .03)
def cap_pop(t, v=.45):
    d = .25; n = int(d * SR); s = tt(n); f = 240 * np.exp(-s * 18) + 70
    add('sfx', t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s / .04) + hp(noise(d), 2500) * np.exp(-s / .003), v, 0, room=.15)
def alarm_bell(t0, t1, v=.35):                      # a twin-bell clock: the hammer hits two bells ~18x a second
    t, k = t0, 0
    while t < t1:
        d = .12; n = int(d * SR); s = tt(n); fs_ = (2840, 3920, 5150, 7020) if k % 2 else (2650, 3700, 4870, 6610)
        add('sfx', t, sum(np.sin(2 * np.pi * f * s) * np.exp(-s / (.09 - i * .015)) / (i + 1) for i, f in enumerate(fs_)) * .4, v, .35 if k % 2 else -.35, room=.15); t += 1 / 18; k += 1
def whistle(t, d=.7, v=.3):
    n = int(d * SR); s = tt(n); f = 2950 + 160 * np.sin(2 * np.pi * 34 * s)
    add('sfx', t, (np.sin(2 * np.pi * np.cumsum(f) / SR) * .6 + bp(noise(d), 2000, 6000) * .3) * fade(n, .03, .08), v, .3, hall=.5)
def crowd(t0, t1, v=.3):
    d = t1 - t0; n = int(d * SR); s = tt(n); y = np.zeros(n)
    for k in range(8): y += bp(noise(d), 300 + 90 * k, 1700 + 220 * k) * (.55 + .45 * np.sin(2 * np.pi * (2.1 + .4 * k) * s + k)) ** 2
    add('sfx', t0, lp(y, 2600) * fade(n, .5, .6) * .3, v, 0, hall=.6, width=.02)
def monitor_beep(t, v=.22):
    d = .14; n = int(d * SR); s = tt(n); add('sfx', t, (np.sin(2 * np.pi * 960 * s) + .15 * np.sin(2 * np.pi * 1920 * s)) * fade(n, .008, .03), v, .4, room=.25)
def hum(t0, t1, v=.08, f=60):
    n = int((t1 - t0) * SR); s = tt(n); add('amb', t0, (sum(np.sin(2 * np.pi * f * k * s) / k for k in range(1, 6)) * .5 + lp(noise(t1 - t0), 500) * .5) * fade(n, .3, .3), v)
def neon_buzz(t0, t1, v=.06):
    n = int((t1 - t0) * SR); s = tt(n); add('amb', t0, bp(np.sign(np.sin(2 * np.pi * 120 * s)) * (1 + .3 * np.sin(2 * np.pi * 3 * s)), 120, 3000) * fade(n, .2, .2), v, .3)
def phone_buzz(t, v=.4):
    for dt in (0, .32):
        d = .22; n = int(d * SR); s = tt(n); add('sfx', t + dt, sat((np.sin(2 * np.pi * 172 * s) + .4 * np.sin(2 * np.pi * 344 * s)) * (np.sin(2 * np.pi * 34 * s) > 0) * fade(n, .005, .02), 1.5) * .5, v, 0, room=.1)
def skitter(t0, t1, v=.2):
    t = t0
    while t < t1:
        for k in range(rng.integers(3, 7)): dd = .004; m = int(dd * SR); add('sfx', t + k * .012, bp(noise(dd), 2500, 8000) * np.exp(-tt(m) / .001), v * rng.uniform(.4, 1), rng.uniform(-.9, .9), room=.1)
        t += rng.uniform(.12, .4)
def birds(t0, t1, v=.12):
    t = t0
    while t < t1:
        for k in range(rng.integers(2, 4)):
            d = .07; n = int(d * SR); s = tt(n); f0 = rng.uniform(3400, 4600); f = f0 * (1 + .25 * np.sin(np.pi * s / d)) * (1 - .15 * s / d)
            add('amb', t + k * .09, (np.sin(2 * np.pi * np.cumsum(f) / SR) + .25 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * s / d) ** 2, v, rng.uniform(-.8, .8), room=.2, hall=.2)
        t += rng.uniform(.5, 1.2)
def city(t0, t1, v=.15):
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, lp(noise(d), 260) * (1 + .3 * np.sin(2 * np.pi * .13 * s)) * fade(n, .4, .4) * 1.4, v, 0, width=.02)
def whisper_of(id, t, v=.35, pan=-.85, rate=.88, reverse=False, dur=None):   # the narrator's own line, turned into a whisper
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, id + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).astype(float); y = np.interp(np.arange(0, len(y) - 1, rate), np.arange(len(y)), y)
    n, hop = 1024, 256; win = np.hanning(n); out = np.zeros(len(y) + n); ws = np.zeros(len(y) + n)
    for i in range(0, len(y) - n, hop): F = np.fft.rfft(y[i:i + n] * win); out[i:i + n] += np.fft.irfft(np.abs(F) * np.exp(1j * rng.uniform(0, 2 * np.pi, len(F))), n) * win; ws[i:i + n] += win ** 2
    w = hp(out[:len(y)] / np.maximum(ws[:len(y)], 1e-6), 700); w = w / (np.abs(w).max() + 1e-9)
    if reverse: w = w[::-1]
    if dur: w = w[:int(dur * SR)] * fade(min(len(w), int(dur * SR)), .05, .2)
    add('sfx', t, w, v, pan, room=.35, hall=.3)

# ---------- sounds for this story ----------
def wood_knock(t, v=.8, low=0.0, pan=0.0):           # a knuckle on a wooden door: the hit, the panel ringing, the frame's thump
    d = .5; n = int(d * SR); s = tt(n)
    y = np.sin(2 * np.pi * (110 - 30 * low) * s) * np.exp(-s / (.05 + .04 * low)) * 1.4 + lp(noise(d), 420 - 200 * low) * np.exp(-s / .018) * 2.2
    y += sum(np.sin(2 * np.pi * f * (1 - .25 * low) * s + k) * np.exp(-s / dd) * a for k, (f, dd, a) in enumerate(((310, .06, .5), (620, .04, .3), (1180, .02, .18))))
    y += hp(noise(d), 2500) * np.exp(-s / .003) * .6 * (1 - low)
    add('sfx', t, sat(lp(y, 6000 - 4500 * low), 1.4), v, pan, room=.35, hall=.1)
def chain_rattle(t, d=.6, v=.3):
    s_ = 0
    while s_ < d: k = int(.03 * SR); add('sfx', t + s_, sum(np.sin(2 * np.pi * f * tt(k)) * np.exp(-tt(k) / .02) for f in (2400 + 900 * rng.random(), 4100 + 1200 * rng.random())) * .4, v * rng.uniform(.4, 1), .3, room=.2); s_ += rng.uniform(.04, .1)
def chain_snap(t, v=.6):
    d = .5; n = int(d * SR); s = tt(n); y = hp(noise(d), 1800) * np.exp(-s / .01) * 2 + sum(np.sin(2 * np.pi * f * s) * np.exp(-s / .15) for f in (2900, 4300, 6100)) * .4
    add('sfx', t, y, v, .3, room=.25, hall=.2); impact(t, v * .8, .8); chain_rattle(t + .05, .5, v * .5)
def fridge(t0, t1, v=.06):
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, (sum(np.sin(2 * np.pi * 50 * k * s) / k for k in range(1, 6)) * .4 + lp(noise(d), 300) * .6) * fade(n, .5, .5), v, -.4)

# ============ the cue sheet ============
HUSH = []; DRY = np.zeros((2, N))
KN = [.05, .42, .79]; a_ = wt('l02', 'Tatlong') - .1; KN += [a_, a_ + .55, a_ + 1.1]
b_ = wt('l07', 'kumatok'); LOW = [b_, b_ + .5, b_ + 1.0]; c_ = T('tail'); KN += [c_ + .2, c_ + .58, c_ + .96]
for k in KN: wood_knock(k, .95, 0, .05)
for k in LOW: wood_knock(k, .9, 1.0, 0)
fridge(0, DUR, .06); drone(0, T('l13'), .16, 36, .35, .005)
# the hook: three knocks on frame 1, a hit, a heartbeat; the second three under "Tatlong katok"
impact(.05, .7, .9); sub_drop(.05, .6); braam(.06, .35)
for k in range(4): heartbeat(1.2 + k * .8, .45)
HUSH.append((.9, T('l02') - .1)); HUSH.append((KN[5] + .2, T('l03')))
# every rule card slams in; a beat of silence after
for l in TL['lines']:
    if l.get('counter'): impact(l['t0'], .7, .8); sub_drop(l['t0'], .4, .9); whoosh(l['t0'] - .05, .35, .25, 300, 6000, -.4, .4); HUSH.append((l['t0'] + .15, l['t0'] + .9))
    if l.get('stat'): whoosh(l['t0'] + .2, .3, .12, 1500, 9000, .3, -.3); sub_drop(l['t0'] + .1, .25, .7)
for i, (a, b, shot) in enumerate(SHOTS):
    if i and shot not in ('loop', 'sting'): whoosh(a, .45, .18, p0=(-.6 if i % 2 else .6), p1=(.6 if i % 2 else -.6))
# the file: a stamp
stamp(wt('l03', 'lalaktaw'), .5)
# the heartbeat rises through the rules
t_, p_ = T('l04'), .9
while t_ < T('l13'): heartbeat(t_, .32); t_ += p_; p_ = max(.55, p_ * .985)
# the twist: nobody there... then low knocks from the floor
reverse_swell(wt('l07', 'kumatok'), .8, .35); HUSH.append((T('l07'), LOW[2] + .5)); sub_drop(LOW[0], .5, 1.2)
# rule 4: a muffled voice outside (the narrator's own words as a whisper through the door)
whisper_at('l08', wt('l08', 'pulis') - .3, max(0, wt('l08', 'pulis') - LN['l08']['wav0']), .12, .2, .85, False, 1.2)
# rule 6: the chain rattles, strains... snaps
TP = wt('l11', 'tulak'); chain_rattle(TP - .2, .7, .35); wood_knock(TP, .9, .5); chain_snap(wt('l11', 'bigay'), .65)
# rule 7: dialling
for k in range(3): tick(T('l12') + .4 + k * .18, .3, 1.4, 0)
# the knocking stops; footsteps walking away; dead quiet
for k in range(6): step(T('l13') + .5 + k * .45, .25 * (1 - k / 7), .3 + k * .1, .3, 0)
HUSH.append((T('l13'), T('l15') + .2))
riser(T('l14'), 1.2, .3); impact(T('l14'), .7, 1.0); sub_drop(T('l14'), .5)
reverse_swell(wt('l15', 'umalis'), .9, .3); heartbeat(E('l15') - .4, .55)
# the sting: the phone lights up
TS = T('l16'); phone_buzz(TS, .7); stinger(TS + .05, .9); HUSH.append((TS + 1.2, E('l16')))
# the end: what would you do first? send it; then the loop: three knocks (= frame 1)
pad(T('l17') - .2, DUR, [45, 52, 57, 60], .12); impact(T('l17'), .35, .6); whoosh(T('l18'), .5, .2)
# ============ mix ============
def make_ir(dur, decay, damp, seed):
    r = np.random.default_rng(seed); n = int(dur * SR); s = tt(n); x = r.standard_normal(n) * np.exp(-s * 6.9 / decay)
    w = np.clip(s / (decay * .5), 0, 1); x = x * (1 - w) + lp(x, damp) * w
    for k in range(10): x[int(r.uniform(.004, .05) * SR)] += r.uniform(-1, 1) * 3
    m = int(.002 * SR); x[:m] *= np.linspace(0, 1, m); return x / np.sqrt((x ** 2).sum())
IR = {('room', 0): make_ir(.9, .55, 3500, 1), ('room', 1): make_ir(.9, .55, 3500, 2), ('hall', 0): make_ir(3.2, 2.6, 2600, 3), ('hall', 1): make_ir(3.2, 2.6, 2600, 4)}
for b in BUS:
    for kind, wet in (('room', .5), ('hall', .6)):
        x = SEND[(b, kind)]
        if not np.any(x): continue
        for ch in (0, 1): BUS[b][ch] += fconv(x, IR[(kind, ch)]) * wet
VO = np.zeros(N)
for l in TL['lines']:
    if 'wav0' not in l: continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, l['id'] + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, '<i2') / 32768; y = hp(y, 75); y = np.tanh(y / (np.abs(y).max() + 1e-9) * 1.7) / np.tanh(1.7) * .9
    i = int(l['wav0'] * SR)
    if i < 0: y = y[-i:]; i = 0
    n = min(len(y), N - i); VO[i:i + n] += y[:n]
LVL = {'mus': .42, 'sfx': .62, 'amb': .32}
for b, lv in LVL.items():
    pk = np.abs(BUS[b]).max() + 1e-9
    BUS[b] = (np.tanh(BUS[b] / pk * 2.0) / np.tanh(2.0) if b == 'sfx' else BUS[b] / pk) * lv
# breath held: the bed (music + ambience) drops away in the HUSH windows
ts_all = tt(N); hush = np.ones(N)
for a, b in HUSH: hush = np.minimum(hush, 1 - .75 * np.clip((ts_all - a) / .08, 0, 1) * np.clip((b - ts_all) / .25, 0, 1))
BUS['mus'] *= hush; BUS['amb'] *= hush
MIX = BUS['mus'] + BUS['sfx'] + BUS['amb']
MIX += DRY
def box(x, n):                                       # a centred moving average (same as convolving with a box, in O(N))
    c = np.concatenate([[0.0], np.cumsum(x)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / n
env = box(np.abs(VO), int(.08 * SR)); env = np.clip(env / .05, 0, 1)
env = box(env, int(.25 * SR)); duck = 1 - env * (1 - 10 ** (-6 / 20))
out = MIX * duck + VO
rms = np.sqrt(np.maximum(box(((out[0] + out[1]) * .5) ** 2, int(.05 * SR)), 0)) + 1e-9
thr = np.percentile(rms, 80); gr = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.2), 1.0); gr = box(gr, int(.03 * SR))
out = out * gr; n = int(DUR * SR); out = out[:, :n]; out = np.tanh(out / np.abs(out).max() * 1.3) / np.tanh(1.3) * .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', f'mix{SUF}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype('<i2').tobytes())
