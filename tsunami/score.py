"""Sound for Tsunami -> out/mix.wav (48 kHz stereo). Cinematic sound design in numpy (the toolkit from ../katok): a sunny beach
(surf, gulls, people), then the sea being sucked away with a gurgling roar and an eerie quiet, fish flapping on wet sand, a deep
rumble far out at sea getting closer, a clock that speeds up with the countdown, the wall of water, a slam after every rule, a warm
swell for the girl who screamed, and a sonar-deep pulse on the map. Every time comes from timeline.json. Usage: python3 score.py [en]"""
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
def step(t, v=.35, pan=0.0, heavy=0.0, wet=1.0):     # a footstep on wet pavement: heel, scuff, splash
    d = .2; n = int(d * SR); s = tt(n)
    y = lp(noise(d), 240 + 140 * heavy) * np.exp(-s / (.024 + .015 * heavy)) * 2.4 + bp(noise(d), 900, 4000) * np.exp(-np.maximum(0, s - .02) / .035) * .45 * (s > .015) + hp(noise(d), 2600) * np.exp(-np.maximum(0, s - .01) / .05) * .45 * wet
    add('sfx', t, y, v, pan, room=.14)
def bubbles(t0, t1, v=.25, rate=14):
    t = t0
    while t < t1:
        d = rng.uniform(.015, .04); n = int(d * SR); s = tt(n); f = rng.uniform(260, 700) * (1 + 2.5 * s / d)
        add('sfx', t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s / (d * .4)) * fade(n, .002, .005), v * rng.uniform(.4, 1), rng.uniform(-.6, .6), room=.1); t += rng.exponential(1 / rate)
def squelch(t, v=.35):
    d = .28; n = int(d * SR); u = tt(n) / d
    add('sfx', t, sat(tvf(lp(noise(d), 1400), 1300 * (1 - .8 * u), .8) * np.sin(np.pi * u) * 2.5, 1.4), v, rng.uniform(-.4, .4), room=.1)
def crowd(t0, t1, v=.3):
    d = t1 - t0; n = int(d * SR); s = tt(n); y = np.zeros(n)
    for k in range(8): y += bp(noise(d), 300 + 90 * k, 1700 + 220 * k) * (.55 + .45 * np.sin(2 * np.pi * (2.1 + .4 * k) * s + k)) ** 2
    add('sfx', t0, lp(y, 2600) * fade(n, .5, .6) * .3, v, 0, hall=.6, width=.02)

# ---------- sounds for this story ----------
def surf(t0, t1, v=.35, period=5.5, size=1.0):     # waves breaking on the sand: a swell, the crash, the wash running back
    d = t1 - t0; n = int(d * SR); s = tt(n); out = []
    for ch in range(2):
        ph = ((s + ch * .35) % period) / period; crash = np.exp(-((ph - .32) / .05) ** 2) * 1.0 + np.exp(-np.maximum(0, ph - .32) / .18) * .6 * (ph > .32) + .12
        y = tvf(noise(d), 300 + 2600 * crash, 1.7) * crash + lp(noise(d), 160) * (.5 + .5 * crash) * .8
        out.append(y * fade(n, .8, .8))
    add2('amb', t0, out[0], out[1], v * size, hall=.08)
def gull(t, v=.12, pan=0.0):                       # a herring gull: "kee-ow", nasal, descending
    d = .55; n = int(d * SR); s = tt(n); u = s / d; f = 1500 + 1300 * np.sin(np.pi * np.minimum(1, u * 1.6)) ** .7 - 600 * u
    f = f * (1 + .03 * np.sin(2 * np.pi * 28 * s)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = bp(sum(np.sin(k * ph) * (1 / k) for k in range(1, 6)), 1200, 5200) * np.sin(np.pi * u) ** 1.2
    add('amb', t, y * .4, v, pan, room=.1, hall=.35)
def gulls(t0, t1, v=.12):
    t = t0 + rng.uniform(.2, 1)
    while t < t1 - .6: gull(t, v * rng.uniform(.5, 1), rng.uniform(-.8, .8)); t += rng.uniform(1.4, 3.5) if rng.random() < .7 else .45
def suck(t, d=3.0, v=.7):                          # the sea pulled away: a gurgling roar falling into the deep, drawn out to sea
    n = int(d * SR); u = tt(n) / d; env = np.sin(np.pi * np.minimum(1, u * 1.15)) ** .8 * (1 - .3 * u)
    fc = 2400 * (1 - u) ** 1.6 + 140; y = tvf(noise(d), fc, kind='lp') * env * 1.6 + lp(noise(d), 90) * env * 1.4
    gur = np.repeat(rng.random(n // 120 + 1) ** 4, 120)[:n]; y += tvf(noise(d), 500 + 400 * (1 - u), 1.0) * gur * env * 1.8
    p = np.linspace(0, .0, n); add2('sfx', t, y * (1 - .4 * u), y * (1 - .4 * u), v, room=.1, hall=.3); bubbles(t + .2, t + d * .8, v * .35, 18)
def flop(t, v=.25):                                # a fish slapping wet sand
    d = .12; n = int(d * SR); s = tt(n); y = lp(noise(d), 900) * np.exp(-s / .012) * 2 + bp(noise(d), 1500, 6000) * np.exp(-s / .02) * .6
    add('sfx', t, y, v, rng.uniform(-.7, .7), room=.1)
def flops(t0, t1, v=.22, rate=4.0):
    t = t0
    while t < t1:
        for k in range(rng.integers(1, 4)): flop(t + k * rng.uniform(.08, .14), v * rng.uniform(.4, 1))
        t += rng.exponential(1 / rate)
def wind(t0, t1, v=.15):
    d = t1 - t0; n = int(d * SR); s = tt(n); out = []
    for ch in range(2): out.append(tvf(noise(d), 650 + 300 * np.sin(2 * np.pi * (.07 + .02 * ch) * s + ch) + 150 * np.sin(2 * np.pi * .23 * s), 1.4) * fade(n, 1.0, 1.0))
    add2('amb', t0, out[0], out[1], v)
def rumble(t0, t1, v=.5, grow=2.5):                # something enormous far out at sea, getting closer
    d = t1 - t0; n = int(d * SR); s = tt(n); u = s / d; g_ = (np.exp(grow * u) - 1) / (np.exp(grow) - 1)
    y = tvf(noise(d), 70 + 200 * u, kind='lp') * 2.2 + tvf(noise(d), 120 + 900 * u ** 2, kind='lp') * .6 * u + np.sin(2 * np.pi * (31 + 6 * u) * s) * .4
    add('sfx', t0, sat(y * (.15 + .85 * g_), 1.3) * fade(n, .5, .3), v, 0, hall=.15, width=.02)
def roar(t0, t1, v=.8):                            # the wall of water arriving: a broadband roar opening up
    d = t1 - t0; n = int(d * SR); u = tt(n) / d; out = []
    for ch in range(2): out.append((tvf(noise(d), 300 + 5200 * u ** 1.5, kind='lp') * 1.3 + lp(noise(d), 120) * 1.2) * (.2 + .8 * u ** 1.3) * fade(n, .4, .15))
    add2('sfx', t0, sat(out[0], 1.2), sat(out[1], 1.2), v, hall=.2)
def jet(t, d=2.2, v=.3):                           # a jet passing high overhead (doppler drop, roar)
    n = int(d * SR); u = tt(n) / d; y = tvf(noise(d), 2400 * (1.25 - .5 * u), 1.0) * np.sin(np.pi * u) ** 2 + lp(noise(d), 260) * np.sin(np.pi * u) ** 2 * .8
    p = -.8 + 1.6 * u; add2('sfx', t, y * np.cos((p + 1) * np.pi / 4) * 1.4, y * np.sin((p + 1) * np.pi / 4) * 1.4, v, hall=.2)
def run_steps(t0, t1, v=.3, rate=3.2, pan=0.0):   # running on sand: soft, crunchy thumps
    t, k = t0, 0
    while t < t1:
        d = .14; n = int(d * SR); s = tt(n); y = lp(noise(d), 300) * np.exp(-s / .02) * 2 + bp(noise(d), 1800, 7000) * np.exp(-s / .04) * .5
        add('sfx', t, y, v * rng.uniform(.6, 1), pan + (.15 if k % 2 else -.15), room=.06); t += 1 / rate * rng.uniform(.9, 1.1); k += 1
def deep_ping(t, v=.4):                            # a low sonar-like boom for the map rings (felt, not a beep)
    d = 2.2; n = int(d * SR); s = tt(n); y = np.sin(2 * np.pi * 58 * s) * np.exp(-s / .6) + np.sin(2 * np.pi * 116.5 * s) * np.exp(-s / .35) * .35 + lp(noise(d), 200) * np.exp(-s / .05) * .6
    add('sfx', t, y, v, 0, hall=.5, width=.01)

# ============ the cue sheet ============
HUSH = []; DRY = np.zeros((2, N))
TU = wt('l04', 'umatras'); TW0 = T('l08'); TWAVE = T('l09'); TR = T('l10')
# the beach: surf + gulls + people (frame 1 is already the sea pulling away, so the surf starts thin and comes back for the happy beach)
surf(T('l03') - .3, TU + .3, .38, 5.5); gulls(T('l03'), TU + .5, .14); crowd(T('l03'), TU + 1.0, .16)
surf(T('l18') - .2, DUR, .3, 5.5); gulls(T('l18'), DUR, .12)
wind(0, DUR, .12)
# the hook: the sea sucked away, a hit on "Tumakbo", the clock starts on "sampung minuto"
suck(0, 3.2, .75); impact(.05, .6, .9); sub_drop(.05, .45); braam(.06, .3)
TK = wt('l01', 'Tumakbo'); impact(TK, .85, 1.1); sub_drop(TK, .6, 1.6); reverse_swell(TK, .9, .3)
HUSH.append((TK + .2, T('l02') - .05))
# the clock: ticks that speed up as the countdown runs out (1/s at 10:00 -> 4/s at the end); a heartbeat joins at 0:30
clock(T('l02'), T('l06'), 1.0, .2, .985); clock(T('l06'), T('l09'), .55, .2, .99); clock(T('l10'), T('l14'), .42, .22, .985)
t_, p_ = T('l13'), .75
while t_ < T('l14'): heartbeat(t_, .45); t_ += p_; p_ = max(.45, p_ * .96)
for l in TL['lines']:
    if l.get('counter') and l['id'] not in ('l02',): tick(l['t0'], .5, .7, 0); sub_drop(l['t0'], .3, .8)
    if l.get('stat'): whoosh(l['t0'] + .2, .3, .12, 1500, 9000, .3, -.3); sub_drop(l['t0'] + .1, .25, .7)
for i, (a, b, shot) in enumerate(SHOTS):
    if i and shot not in ('loop', 'hero', 'pull'): whoosh(a, .45, .18, p0=(-.6 if i % 2 else .6), p1=(.6 if i % 2 else -.6))
# the pull: the sea drains away in front of you, the birds and people go quiet, the fish flap on the wet sand
suck(TU - .3, 3.6, .9); reverse_swell(TU, .8, .3); HUSH.append((TU + .6, T('l06') - .1)); drone(TU, T('l10'), .18, 34, .4, .006)
flops(TU + 1.6, T('l06'), .2, 3.5)
# they walk out and film: one phone camera shutter-ish click (a real one: mechanical, not a beep)
for k in range(2): d_ = .06; m_ = int(d_ * SR); add('sfx', T('l05') + 2.2 + k * .5, hp(noise(d_), 2000) * np.exp(-tt(m_) / .004) + bp(noise(d_), 500, 2500) * np.exp(-tt(m_) / .015) * .7, .25, .3, room=.1)
# the mistake: freeze, a hit and a low brass
impact(T('l06'), .9, 1.2); sub_drop(T('l06'), .7, 2.0); braam(T('l06') + .02, .55); HUSH.append((T('l06') + .1, T('l07') - .05))
# 2004: a felt-piano note in the sepia, the rumble out at sea begins
piano(T('l07') + .1, 50, .3, 4.0); piano(T('l07') + .1, 38, .25, 5.0); rumble(T('l07'), TWAVE, .5, 2.2)
# the open ocean: a jet passing over
jet(T('l08') + .2, 2.4, .35)
# near the shore: the roar comes in, the runner's footsteps, a slam
roar(TWAVE - .4, TR + .1, .75); run_steps(TWAVE, TR, .35, 3.4); riser(TR, 1.4, .35)
# the rules: every card slams in, a beat of near-silence after
for id in ('l10', 'l11', 'l12', 'l13'):
    impact(T(id), .85, 1.0); sub_drop(T(id), .5, 1.0); whoosh(T(id) - .05, .35, .25, 300, 6000, -.4, .4); HUSH.append((T(id) + .15, T(id) + .9))
surf(TR, T('l14'), .3, 4.2, 1.2); wind(TR, T('l14'), .1)
run_steps(T('l11') + .4, E('l11'), .28, 2.8, .2)     # climbing the hill
impact(wt('l12', 'ikatlong'), .35, .5)                 # the third floor lights up
reverse_swell(wt('l13', 'susunod'), .9, .4); impact(wt('l13', 'susunod'), .7, 1.0); sub_drop(wt('l13', 'susunod'), .55, 1.6)
# the hero: everything drops away, a warm pad and a felt piano; she screams; the crowd runs up the beach
HUSH.append((T('l14') - .1, T('l14') + .8)); pad(T('l14'), E('l15') + .6, [50, 57, 62, 65], .16); motif(T('l14') + .6, E('l15'), .2)
TS = wt('l15', 'Sumigaw'); impact(TS, .6, .8); whoosh(TS, .4, .25); run_steps(TS + .25, TS + 3.4, .3, 4.2, .4); shimmer(E('l15') - .8, 1.8, .18)
# here: a deep pulse with every ring on the map
t_ = T('l16')
while t_ < E('l16'): deep_ping(t_, .45); t_ += 1 / .7
drone(T('l16'), T('l18'), .2, 33, .3, .004); impact(T('l16'), .6, 1.0)
# the end: where would you run? share it; then the loop: the sea pulling back (= frame 1)
impact(T('l17'), .45, .8); pad(T('l18') - .2, DUR, [45, 52, 57, 60], .13); piano(T('l18'), 57, .25, 3.5); whoosh(T('l18'), .5, .2)
suck(T('tail') - .2, DUR - T('tail') + .4, .55)
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
