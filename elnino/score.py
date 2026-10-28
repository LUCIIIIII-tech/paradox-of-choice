"""Sound for Super El Niño -> out/mix.wav (48 kHz stereo). The numpy toolkit from ../presidente and ../aswang: the heat (cicadas, a dry wind), the drop that
turns to steam, the TV, the cracked paddies, the dam, the market, the dry pump, the truck, the knock at night, Mia's pencil, the boiling pot, the tank opening, and
then the rain. A low drone and a felt piano, a pulse under the months, a slam on every month card. Every time comes from timeline.json. Usage: python3 score.py"""
import os, sys, json, wave, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
LANG = sys.argv[1] if len(sys.argv) > 1 else 'tl'; SUF = '' if LANG == 'tl' else '.' + LANG
VDIR = 'voices' if LANG == 'tl' else 'voices_' + LANG
TL = json.load(open(os.path.join(HERE, f'timeline{SUF}.json'), encoding='utf-8')); DUR = TL['dur']; N = int(SR * DUR) + SR
ANCH = json.load(open(os.path.join(HERE, f'anchors{SUF}.json'))) if SUF else {}
LN = {l['id']: l for l in TL['lines']}
rng = np.random.default_rng(11)
BUS = {k: np.zeros((2, N)) for k in ('mus', 'sfx', 'amb', 'lng')}      # lng = the long sounds (barking, breathing, wings...), kept under the voice
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

# ---------- the story's clock (the same anchors as shots.js) ----------
def wt(id, w):
    l = LN[id]
    for x in l.get('words', []):
        if ''.join(c for c in x[0].lower() if c.isalnum() or c == "'").startswith(w.lower()): return x[1]
    return l['t0']
T = lambda id: LN[id]['t0']; E = lambda id: LN[id]['t1']
SHOTS = []
for i, l in enumerate(TL['lines']):
    end = TL['lines'][i + 1]['t0'] if i < len(TL['lines']) - 1 else DUR
    if i and l['shot'] == TL['lines'][i - 1]['shot']: SHOTS[-1][1] = end; continue
    SHOTS.append([SHOTS[-1][1] if i else 0, end, l['shot']])
def smooth(x, n):
    c = np.concatenate([[0.0], np.cumsum(x)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
def shot_env(levels, default=0.0):                  # a level per shot, with short crossfades at the cuts
    e = np.full(N, default)
    for a, b, sh in SHOTS: e[int(a * SR):int(b * SR)] = levels.get(sh, default)
    return smooth(e, int(.08 * SR))
def bed_add(bus, y2, env, v=1.0):                   # a full-length stereo bed shaped by an envelope
    BUS[bus][0] += y2[0][:N] * env * v; BUS[bus][1] += y2[1][:N] * env * v
def jhash(n): x = np.sin(n * 127.1 + 311.7) * 43758.5453; return x - np.floor(x)     # the same hash as main.js
def rainbed():                                      # rain: a wide hiss, a low wash, and drops on everything
    out = []
    for ch in range(2):
        y = bp(noise(N / SR), 900, 9000)[:N] * .25 + lp(noise(N / SR), 500)[:N] * .12; drops = np.zeros(N); k = 0
        while k < N - 400: drops[k:k + 300] += bp(noise(300 / SR), 2500, 8000) * np.exp(-tt(300) / .0015) * rng.uniform(.1, 1); k += int(rng.exponential(SR / 120)) + 1
        out.append(y + drops * .35)
    return out
def murmur():                                       # a crowd, hushed: many voices with no words
    d = N / SR; s = tt(N); out = []
    for ch in range(2):
        y = np.zeros(N)
        for k in range(8): y += bp(noise(d), 250 + 80 * k, 1500 + 200 * k)[:N] * (.55 + .45 * np.sin(2 * np.pi * (1.7 + .35 * k + .1 * ch) * s + k)) ** 2
        out.append(lp(y, 2200) * .12)
    return out
def thunder(t, v=.6, d=4.5, pan=0.0):               # a crack overhead, then the long roll
    n = int(d * SR); s = tt(n); sw = 1 + .7 * smooth(np.abs(rng.standard_normal(n)), int(.25 * SR)) * 2
    y = sat(lp(noise(d), 170) * (1 - np.exp(-s / .06)) * np.exp(-s / 1.5) * sw * 3, 1.5) + hp(noise(d), 1500) * np.exp(-s / .05) * .6 + bp(noise(d), 200, 1200) * np.exp(-s / .5) * .3
    add('sfx', t, y * fade(n, .002, .8), v, pan, hall=.35, width=.02); sub_drop(t, v * .6, 2.4)
def shutter(t, v=.4, pan=0.0):                      # a camera: click-clack and the flash's pop
    for k, dt in enumerate((0, .035)):
        d = .06; n = int(d * SR); s = tt(n); add('sfx', t + dt, hp(noise(d), 2500) * np.exp(-s / .002) * 1.2 + bp(noise(d), 1400, 5000) * np.exp(-s / .01) * .5, v * (1 if k else .8), pan, room=.2)
def paper(t, d=.5, v=.35, pan=0.0):                 # paper: a crinkle of tiny clicks over a soft swish
    n = int(d * SR); y = np.zeros(n); k = 0
    while k < n - 200: y[k:k + 120] += hp(noise(120 / SR), 2500) * np.exp(-tt(120) / .001) * rng.uniform(.1, 1); k += int(rng.exponential(SR / 300)) + 1
    add('sfx', t, (y * .6 + bp(noise(d), 1500, 6000) * .2) * fade(n, .03, .1), v, pan, room=.1)
def engines(t0, t1, v=.2):                          # a road full of idling engines
    d = t1 - t0; n = int(d * SR); s = tt(n); y = lp(noise(d), 140) * (1 + .3 * np.sin(2 * np.pi * 23 * s)) + sum(np.sin(2 * np.pi * f * s) * .08 for f in (31, 47, 62))
    add2('amb', t0, y * fade(n, .4, .4), np.roll(y, 600) * fade(n, .4, .4), v)
def fluo(t0, t1, v=.06):                            # the store's fluorescent tube: a 120 Hz buzz
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, sat(sum(np.sin(2 * np.pi * 120 * k * s) / k for k in (1, 2, 3, 4, 6)), 1.5) * fade(n, .2, .2) * .25, v, .3)
def coins(t, v=.3):                                 # a few coins on the counter
    for k in range(3):
        d = .35; n = int(d * SR); s = tt(n); f = rng.uniform(2800, 5200); add('sfx', t + k * .09, (np.sin(2 * np.pi * f * s) + .5 * np.sin(2 * np.pi * f * 1.48 * s)) * np.exp(-s / .07) * .4 + hp(noise(d), 4000) * np.exp(-s / .003), v, .3, room=.15)
def creak(t, d=1.0, v=.35, pan=.3):                 # a floorboard behind you
    n = int(d * SR); s = tt(n); f = 120 + 50 * np.sin(2 * np.pi * .9 * s); jit = 1 + .08 * np.repeat(rng.standard_normal(n // 160 + 1), 160)[:n]
    ph = 2 * np.pi * np.cumsum(f * jit) / SR; add('sfx', t, bp(sum(np.sin(k * ph) / k for k in range(1, 20)), 300, 2400) * np.sin(np.pi * s / d) ** .6 * .4, v, pan, room=.25)
def breath(t, d=1.6, v=.4, pan=0.0):                # someone breathing close behind you
    for k in range(2):
        dd = d / 2; n = int(dd * SR); u = tt(n) / dd; add('lng', t + k * dd, bp(noise(dd), 300 + 150 * k, 1700 - 300 * k) * np.sin(np.pi * u) ** 1.4 * 1.1, v * (.8 if k else 1), pan, room=.12)
def ping(t, v=.35):                                 # a chat notification: two soft rising notes
    for k, m in enumerate((84, 91)):
        d = .18; n = int(d * SR); s = tt(n); add('sfx', t + k * .07, np.sin(2 * np.pi * m2f(m) * s) * np.exp(-s / .05) * .5, v, .1, room=.1)
def clink(t, v=.25, pan=0.0):                       # a spoon on a plate
    d = .3; n = int(d * SR); s = tt(n); f = rng.uniform(2400, 3600); add('sfx', t, (np.sin(2 * np.pi * f * s) + .4 * np.sin(2 * np.pi * f * 2.7 * s)) * np.exp(-s / .05) * .4, v, pan, room=.2)
def tvvoice(t0, t1, v=.2):                          # a news anchor through a small TV speaker, no words
    d = t1 - t0; n = int(d * SR); s = tt(n); f = 150 * (1 + .12 * np.sin(2 * np.pi * 2.3 * s) + .05 * np.sin(2 * np.pi * 5.1 * s)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = bp(sum(np.sin(k * ph) / k for k in range(1, 20)), 500, 2600) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 3.7 * s)) ** 2) * fade(n, .1, .2)
    add('lng', t0, y * .3, v, -.2, room=.3)
def scribble(t0, t1, v=.3):                         # a pen on paper: rough scratching in strokes
    d = t1 - t0; n = int(d * SR); s = tt(n); env = (.35 + .65 * np.abs(np.sin(2 * np.pi * 3.3 * s + 1.2 * np.sin(2 * np.pi * .9 * s)))) * fade(n, .05, .1)
    add('sfx', t0, bp(noise(d), 1800, 7000) * env * (1 + .5 * np.repeat(rng.random(n // 200 + 1), 200)[:n]) * .5, v, .2, room=.05)
def crickets():                                     # a field of crickets: pulsed chirps around 4-5 kHz, scattered left to right, over a soft katydid hiss
    out = [np.zeros(N), np.zeros(N)]; s_ = tt(N)
    for c in range(14):
        f0, rate, per, pan, lv = rng.uniform(3900, 5200), rng.uniform(22, 30), rng.uniform(.45, .9), rng.uniform(-.9, .9), rng.uniform(.3, 1)
        t = rng.uniform(0, per)
        while t < N / SR - .3:
            n = int(.13 * SR); s = tt(n); y = np.sin(2 * np.pi * f0 * s) * (np.sin(np.pi * ((s * rate) % 1)) ** 2) * fade(n, .005, .02) * lv; i = int(t * SR)
            out[0][i:i + n] += y * np.cos((pan + 1) * np.pi / 4); out[1][i:i + n] += y * np.sin((pan + 1) * np.pi / 4); t += per * rng.uniform(.9, 1.1)
    for ch in range(2): out[ch] = out[ch] * .05 + bp(noise(N / SR), 6000, 9500) * (.5 + .5 * np.sin(2 * np.pi * (.2 + .05 * ch) * s_)) * .012
    return out
def sizzle(t, d=2.5, v=.35):                        # salt on the cut: a hiss with crackle
    n = int(d * SR); s = tt(n); y = hp(noise(d), 3000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 7 * s))) * fade(n, .2, .8) * .4
    pops = np.zeros(n); k = 0
    while k < n - 300: pops[k:k + 200] += hp(noise(200 / SR), 2000) * np.exp(-tt(200) / .002) * rng.uniform(.2, 1); k += int(rng.exponential(SR / 40)) + 1
    add('lng', t, y + pops * .5, v, .1, room=.1)
def knock(t, v=.6):                                 # three knocks on a wooden door
    for k in range(3):
        d = .3; n = int(d * SR); s = tt(n); y = lp(noise(d), 500) * np.exp(-s / .02) * 2 + np.sin(2 * np.pi * 165 * s) * np.exp(-s / .07) * .8 + np.sin(2 * np.pi * 240 * s) * np.exp(-s / .04) * .4
        add('sfx', t + k * .28, sat(y, 1.4), v * (1 if k < 2 else 1.1), -.2, room=.3)
def wind(t0, t1, v=.15):
    d = t1 - t0; n = int(d * SR); s = tt(n); out = []
    for ch in range(2): out.append(tvf(noise(d), 650 + 300 * np.sin(2 * np.pi * (.07 + .02 * ch) * s + ch) + 150 * np.sin(2 * np.pi * .23 * s), 1.4) * fade(n, 1.0, 1.0))
    add2('amb', t0, out[0], out[1], v)
def pour(t, d=1.6, v=.4, pan=0.0):                  # salt pouring: a stream of tiny grains
    n = int(d * SR); y = np.zeros(n); k = 0
    while k < n - 60: m = 40; y[k:k + m] += hp(noise(m / SR), 4000) * np.exp(-tt(m) / .0006) * rng.uniform(.2, 1); k += int(rng.exponential(SR / 900)) + 1
    add('lng', t, y * fade(n, .1, .3) * .7 + hp(noise(d), 5000) * fade(n, .2, .3) * .05, v, pan, room=.08)
def cicadas():                                      # the heat: a wall of cicadas, pulsing, high
    out = []; s_ = tt(N)
    for ch in range(2):
        y = bp(noise(N / SR), 4200, 7600)[:N] * (.6 + .4 * np.sin(2 * np.pi * (5.5 + .7 * ch) * s_) ** 2) * (.7 + .3 * np.sin(2 * np.pi * .11 * s_ + ch))
        out.append(y * .12)
    return out
def gush(t, d=3.0, v=.5):                           # water rushing out of the tank valve
    n = int(d * SR); s = tt(n); y = lp(noise(d), 1400) * .8 + bp(noise(d), 300, 3000) * .5 * (1 + .3 * np.sin(2 * np.pi * 7 * s))
    add('lng', t, y * fade(n, .08, .8), v, -.2, room=.15)
def click(t, v=.5):                                 # the padlock opening: a sharp metal click
    d = .12; n = int(d * SR); s = tt(n); add('sfx', t, hp(noise(d), 2500) * np.exp(-s / .004) + np.sin(2 * np.pi * 2300 * s) * np.exp(-s / .02) * .4, v, -.2, room=.15)
def fillup(t0, t1, v=.3, pan=0.0):                  # a bucket filling: the note of the water rising
    d = t1 - t0; n = int(d * SR); s = tt(n); f = 300 + 500 * (s / d); y = bp(noise(d), 600, 4000) * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .08
    add('lng', t0, y * fade(n, .2, .3), v, pan, room=.1)
def plink(t, v=.4, pan=0.0):                        # one raindrop on a tin roof
    d = .25; n = int(d * SR); s = tt(n); f = rng.uniform(1800, 2800); add('sfx', t, np.sin(2 * np.pi * f * s) * np.exp(-s / .04) * .6 + hp(noise(d), 3000) * np.exp(-s / .003), v, pan, room=.2, hall=.2)
def squeak(t, v=.3):                                # the pump handle
    d = .35; n = int(d * SR); s = tt(n); f = 900 + 400 * np.sin(np.pi * s / d); add('sfx', t, bp(np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR), 500, 4000) * np.sin(np.pi * s / d) * .4, v, .2, room=.15)
# ============ the cue sheet ============
HUSH = []; DRY = np.zeros((2, N)); SILENT = []
OUT_ = {'hook': .9, 'key': .8, 'farm': .5, 'family': .5, 'sun': 1, 'cracked': 1, 'rice': .8, 'drought': 1, 'market': .4, 'poso': .9, 'truck': .7, 'bottle': .6, 'mia': .5, 'tank': 1, 'cta': .4, 'tatay': .9, 'keyhand': .9, 'valve': .9, 'photo': .5, 'share': .4}
bed_add('amb', cicadas(), shot_env(OUT_), 1.0); wind(0, DUR, .1)
bed_add('amb', crickets(), shot_env({'knock': 1.0, 'cta': .6, 'mia': .4}), 1.0)
RAIN_ = shot_env({'rain': 1.0, 'rainmia': 1.2, 'rainbuckets': 1.0}) * np.clip((tt(N) - wt('rain', 'bumuhos')) / 1.0, 0, 1)
bed_add('amb', rainbed(), RAIN_, 1.4)
drone(0, T('rain'), .2, 28, .45, .004); drone(T('rain'), DUR, .16, 33, .3, .003)
for i, (a_, b_, sh) in enumerate(SHOTS):
    if i: whoosh(a_, .5, .22, p0=(-.6 if i % 2 else .6), p1=(.6 if i % 2 else -.6)); impact(a_ - .08, .2, .7)
# the hook: a hit on frame 1, the drop falls and hisses into steam; on "susi" a metal shimmer; the flash-forward: the click, the gush
impact(.0, .9, 1.4); sub_drop(.0, .7, 2.0); whoosh(1.5, .5, .25, 600, 6000, 0, 0); sizzle(1.5, 1.6, .5)
shimmer(wt('h2', 'susi') - .1, 1.4, .3); braam(wt('h2', 'susi') - .1, .35, 2.2); heartbeat(E('h2') + .1, .5)
click(wt('h3', 'binuksan') + .05, .6); gush(wt('h3', 'binuksan') + .25, E('h3') - wt('h3', 'binuksan') + .5, .55); stinger(E('h3') + .05, .45)
# the farm, the family: a felt piano; the Pacific warming: a riser; "super": the hit
motif(T('s1'), E('s2') + .5, .15); riser(wt('s3', 'umiinit') + 1.6, 1.6, .35); impact(wt('s4', 'super') - .05, 1.0, 1.4); sub_drop(wt('s4', 'super') - .05, .8, 2.2); braam(wt('s4', 'super') - .05, .45, 2.4)
# the months: a pulse under them, a slam on every month card with a held breath
bass_pulse(T('m1'), E('m4b') + .5, 84, [38, 34, 36, 33], .22)
for id in ('m1', 'm2', 'm3', 'm4'): impact(T(id) - .12, 1.0, 1.3); sub_drop(T(id) - .12, .6, 1.4); braam(T(id) - .1, .3, 1.8); HUSH.append((T(id) + .15, T(id) + .8))
tvvoice(T('m1'), E('m1b'), .3); [ping(wt('m1b', 'bumili') + k * .25, .2) for k in range(3)]
creak(T('m2') + .4, 1.4, .3, .2); heartbeat(wt('m2b', 'nakatitig'), .35); heartbeat(wt('m2b', 'walang'), .3)
stinger(wt('m2d', '46') + .3, .4); impact(wt('m2d', '46') + .3, .6, 1.0)
heartbeat(wt('m2e', 'dalawang') + .3, .5); heartbeat(wt('m2e', 'dalawang') + 1.1, .45)
impact(wt('m2f', 'brownout') + .15, .8, 1.2); fluo(T('m2f'), wt('m2f', 'brownout') + .15, .12)
murmur_ = murmur(); bed_add('amb', murmur_, shot_env({'market': .8, 'truck': .5, 'share': .5, 'clinic': .3}), 1.0)
coins(wt('m3b', 'doble') - .2, .35); stinger(wt('m3b', 'doble'), .3)
for k in range(5): squeak(T('m3c') + .1 + k * .62, .4)
engines(T('m3d'), E('m3e') + .5, .3); paper(wt('m3e', 'ikaw') - .3, .3, .2)
breath(T('m3f') + .3, 1.6, .35, -.3); stinger(wt('m3f', 'piso') - .05, .35)
knock(wt('m3g', 'kumatok') - .05, .6); stinger(E('m3h') + .05, .55); impact(E('m3h') + .05, .8, 1.2)
scribble(T('mia2') + 1.0, E('mia2'), .35); pad(T('mia3'), E('mia3') + .8, [50, 57, 62, 66], .12); shimmer(wt('mia3', 'wala'), 1.6, .2)
# the last tank, the clinic, the choice: heartbeats closing in; the click; the gush
t_, p_ = T('m4c'), 1.0
while t_ < T('c3'): heartbeat(t_, .4); t_ += p_; p_ = max(.55, p_ * .96)
fluo(T('m4c'), E('m4d') + .3, .1); motif(T('cta'), E('cta') + .3, .12)
click(T('c3') + .3, .7); gush(T('c3') + .55, 3.0, .6); impact(T('c3') + .3, 1.0, 1.4); sub_drop(T('c3') + .3, .8, 2.2); HUSH.append((T('c3') + .35, T('c3') + 1.2))
bubbles(T('r1'), wt('r1', 'dinala'), .3, 30); paper(T('r2') + .3, .3, .3); shutter(T('r2') + .6, .5); ping(wt('r2', 'ipinadala') + .2, .35)
pad(T('r3'), E('r3') + .6, [50, 57, 62, 66], .12); shimmer(wt('r3', 'gumaling'), 1.8, .22)
# the rain: one drop, another, then thunder and the downpour; the buckets filling; Tatay laughing
plink(wt('rain', 'isang') + .02, .6, -.2); plink(wt('rain', 'tapos') + .32, .6, .3); thunder(wt('rain', 'bumuhos') - .1, .8, 5.0, 0)
for k in range(3): fillup(T('rain3') + .2, wt('rain3', 'minuto') + .6, .3, [-.5, 0, .5][k])
pad(T('rain2'), E('end') + 1.5, [50, 57, 62, 66, 69], .14); motif(T('f1'), E('end') + 1.2, .12); shimmer(wt('end', 'walang'), 2.0, .25); reverse_swell(DUR, 1.2, .3)
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
LVL = {'mus': .22, 'sfx': .65, 'amb': .14, 'lng': .45}
for b, lv in LVL.items():
    pk = np.percentile(np.abs(BUS[b]), 99.7) + 1e-9               # the loud part of the bus, not its single loudest sample
    BUS[b] = np.tanh(BUS[b] / pk * 1.2) / np.tanh(1.2) * lv
# breath held: the bed (music + ambience) drops away in the HUSH windows
ts_all = tt(N); hush = np.ones(N)
for a, b in HUSH: hush = np.minimum(hush, 1 - .75 * np.clip((ts_all - a) / .08, 0, 1) * np.clip((b - ts_all) / .25, 0, 1))
BUS['mus'] *= hush; BUS['amb'] *= hush
sil = np.ones(N)
for a, b in SILENT: sil = np.minimum(sil, 1 - np.clip((ts_all - a) / .03, 0, 1) * np.clip((b - ts_all) / .05, 0, 1))
for k in BUS: BUS[k] *= sil if k != 'sfx' else 1
MIX = BUS['mus'] + BUS['sfx'] + BUS['amb']
MIX += DRY
def box(x, n):                                       # a centred moving average (same as convolving with a box, in O(N))
    c = np.concatenate([[0.0], np.cumsum(x)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / n
env = box(np.abs(VO), int(.08 * SR)); env = np.clip(env / .05, 0, 1)
env = box(env, int(.25 * SR)); duck = 1 - env * (1 - 10 ** (-3.5 / 20)); duck_s = 1 - env * (1 - 10 ** (-1.5 / 20)); duck_l = 1 - env * (1 - 10 ** (-8 / 20))
MIX = (BUS['mus'] + BUS['amb']) * duck + BUS['lng'] * duck_l + BUS['sfx'] * duck_s + DRY
out = MIX + VO
if os.environ.get('STEMS'):                          # debugging: each bus as it lands in the mix
    for nm, x in (('vo', np.stack([VO, VO])), ('sfx', BUS['sfx'] * duck_s), ('amb', BUS['amb'] * duck), ('mus', BUS['mus'] * duck), ('lng', BUS['lng'] * duck_l)):
        with wave.open(os.path.join(HERE, 'out', f'stem_{nm}.wav'), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes())
rms = np.sqrt(np.maximum(box(((out[0] + out[1]) * .5) ** 2, int(.05 * SR)), 0)) + 1e-9
thr = np.percentile(rms, 80); gr = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.2), 1.0); gr = box(gr, int(.03 * SR))
out = out * gr; n = int(DUR * SR); out = out[:, :n]; out = np.tanh(out / np.abs(out).max() * 1.3) / np.tanh(1.3) * .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', f'mix{SUF}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype('<i2').tobytes())
