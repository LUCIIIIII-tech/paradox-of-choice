"""Sound for Ang White Lady ng Balete Drive -> out/mix.wav (48 kHz stereo), in numpy (the toolkit from ../undas and ../tatlo).
Rain on the street and on the car roof, the old taxi engine, wipers synced to the picture, doors, the turn signal, far thunder with no crack,
passing cars on wet asphalt, a pen on paper, a projector flutter; deep soft swells instead of hits, and silence under her lines.
Her voice (the 'babae' lines) is kept close, a little to the right, with a small room. Usage: python score.py"""
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

def smooth(x, n):
    c = np.concatenate([[0.0], np.cumsum(x)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
def shot_env(levels, default=0.0):                  # a level per shot, with short crossfades at the cuts
    e = np.full(N, default)
    for a, b, sh in SHOTS: e[int(a * SR):int(b * SR)] = levels.get(sh, default)
    return smooth(e, int(.08 * SR))
def bed_add(bus, y2, env, v=1.0):                   # a full-length stereo bed shaped by an envelope
    BUS[bus][0] += y2[0][:N] * env * v; BUS[bus][1] += y2[1][:N] * env * v
def jhash(n): x = np.sin(n * 127.1 + 311.7) * 43758.5453; return x - np.floor(x)     # the same hash as main.js
def murmur():                                       # a crowd, hushed: many voices with no words
    d = N / SR; s = tt(N); out = []
    for ch in range(2):
        y = np.zeros(N)
        for k in range(8): y += bp(noise(d), 250 + 80 * k, 1500 + 200 * k)[:N] * (.55 + .45 * np.sin(2 * np.pi * (1.7 + .35 * k + .1 * ch) * s + k)) ** 2
        out.append(lp(y, 2200) * .12)
    return out
def paper(t, d=.5, v=.35, pan=0.0):                 # paper: a crinkle of tiny clicks over a soft swish
    n = int(d * SR); y = np.zeros(n); k = 0
    while k < n - 200: y[k:k + 120] += hp(noise(120 / SR), 2500) * np.exp(-tt(120) / .001) * rng.uniform(.1, 1); k += int(rng.exponential(SR / 300)) + 1
    add('sfx', t, (y * .6 + bp(noise(d), 1500, 6000) * .2) * fade(n, .03, .1), v, pan, room=.1)
def engines(t0, t1, v=.2):                          # a road full of idling engines
    d = t1 - t0; n = int(d * SR); s = tt(n); y = lp(noise(d), 140) * (1 + .3 * np.sin(2 * np.pi * 23 * s)) + sum(np.sin(2 * np.pi * f * s) * .08 for f in (31, 47, 62))
    add2('amb', t0, y * fade(n, .4, .4), np.roll(y, 600) * fade(n, .4, .4), v)
def fluo(t0, t1, v=.06):                            # the store's fluorescent tube: a 120 Hz buzz
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, sat(sum(np.sin(2 * np.pi * 120 * k * s) / k for k in (1, 2, 3, 4, 6)), 1.5) * fade(n, .2, .2) * .25, v, .3)
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
def wind(t0, t1, v=.15):
    d = t1 - t0; n = int(d * SR); s = tt(n); out = []
    for ch in range(2): out.append(tvf(noise(d), 650 + 300 * np.sin(2 * np.pi * (.07 + .02 * ch) * s + ch) + 150 * np.sin(2 * np.pi * .23 * s), 1.4) * fade(n, 1.0, 1.0))
    add2('amb', t0, out[0], out[1], v)
def birds(t0, t1, v=.2):                            # morning: sparrows, quick chirps
    t = t0
    while t < t1:
        for k in range(rng.integers(2, 5)):
            d = rng.uniform(.04, .09); n = int(d * SR); s = tt(n); f0 = rng.uniform(3200, 5200); f = f0 * (1 + rng.uniform(-.25, .25) * s / d)
            add('lng', t + k * rng.uniform(.07, .12), np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s / d) * .3, v * rng.uniform(.4, 1), rng.uniform(-.8, .8), room=.1, hall=.25)
        t += rng.uniform(.4, 1.2)
def sadpiano(t0, t1, v=.22, beat=.9, prog=((57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62))):   # Am - F - C - G, broken slowly, a bass note on each bar
    t, i = t0, 0
    while t < t1 - .2:
        ch = prog[(i // 4) % len(prog)]
        if i % 4 == 0: piano(t, ch[0] - 12, v * .8, 4.5, -.15)
        piano(t, ch[[0, 1, 2, 1][i % 4]] + 12, v * (1.0 if i % 4 == 0 else .75), 3.5, .2 * np.sin(i)); t += beat; i += 1
def fan(t0, t1, v=.25):                             # a pamaypay going back and forth: soft air
    t = t0
    while t < t1:
        d = .5; n = int(d * SR); u = tt(n) / d; add('sfx', t, bp(noise(d), 300, 2500) * np.sin(np.pi * u) ** 2 * .6, v, .3 * np.sin(t * 3), room=.1); t += .52
def ringback(t0, t1, v=.3):                         # the line ringing on the other end: 425 Hz, one second on, three off
    t = t0
    while t < t1:
        d = min(1.0, t1 - t); n = int(d * SR); s = tt(n); add('sfx', t, np.sin(2 * np.pi * 425 * s) * fade(n, .01, .02) * .3, v, 0); t += 4.0


def buzz(t0, t1, v=.4):                             # a phone vibrating on a wooden table: short buzzes
    t = t0
    while t < t1:
        d = .35; n = int(d * SR); s = tt(n); y = sat(np.sin(2 * np.pi * 150 * s) * (1 + .5 * np.sign(np.sin(2 * np.pi * 25 * s))), 3) * fade(n, .01, .03)
        add('sfx', t, lp(y, 900) * .5 + bp(noise(d), 200, 1200) * .15 * fade(n, .01, .03), v, .3, room=.15); t += .55
def chime(t, v=.35):                                # a notification: two soft bell notes
    for k, m in enumerate((88, 95)):
        d = 1.2; n = int(d * SR); s = tt(n); y = (np.sin(2 * np.pi * m2f(m) * s) + .3 * np.sin(2 * np.pi * m2f(m) * 2.76 * s) * np.exp(-s / .2)) * np.exp(-s / .45)
        add('sfx', t + k * .12, y * .3, v, .1, room=.1, hall=.35)
def jet(t, d=4.0, v=.25):                           # a plane passing far overhead
    n = int(d * SR); s = tt(n); u = s / d; add('lng', t, tvf(noise(d), 500 + 1200 * np.sin(np.pi * u), 1.2) * np.sin(np.pi * u) ** 1.5 * .6, v, .4, hall=.5)
def shutter(t, v=.4):
    for k, dt in enumerate((0, .035)):
        d = .06; n = int(d * SR); s = tt(n); add('sfx', t + dt, hp(noise(d), 2500) * np.exp(-s / .002) * 1.2 + bp(noise(d), 1400, 5000) * np.exp(-s / .01) * .5, v * (1 if k else .8), 0, room=.2)
def coins(t, v=.3):                                 # a few coins on the counter
    for k in range(3):
        d = .35; n = int(d * SR); s = tt(n); f = rng.uniform(2800, 5200); add('sfx', t + k * .09, (np.sin(2 * np.pi * f * s) + .5 * np.sin(2 * np.pi * f * 1.48 * s)) * np.exp(-s / .07) * .4 + hp(noise(d), 4000) * np.exp(-s / .003), v, .3, room=.15)
def tvvoice(t0, t1, v=.2):                          # a news anchor through a small TV speaker, no words
    d = t1 - t0; n = int(d * SR); s = tt(n); f = 150 * (1 + .12 * np.sin(2 * np.pi * 2.3 * s) + .05 * np.sin(2 * np.pi * 5.1 * s)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = bp(sum(np.sin(k * ph) / k for k in range(1, 20)), 500, 2600) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 3.7 * s)) ** 2) * fade(n, .1, .2)
    add('lng', t0, y * .3, v, -.2, room=.3)
def crack(t, v=.6):                                 # the land splitting: a dry tearing crackle into a low groan
    d = 1.2; n = int(d * SR); s = tt(n); cl = np.zeros(n)
    for k in range(60): i = int(rng.uniform(0, .7) ** 1.6 * SR); m = int(.004 * SR); cl[i:i + m] += rng.uniform(-1, 1) * np.exp(-np.arange(m) / (m / 4))
    y = hp(cl, 800) * 1.5 + lp(noise(d), 180) * np.exp(-s / .5) * 2 + np.sin(2 * np.pi * 42 * s) * np.exp(-s / .7)
    add('sfx', t, y * fade(n, .002, .3), v, 0, hall=.4)
def stamp(t, v=.6):                                 # a rubber stamp slammed on a desk
    d = .4; n = int(d * SR); s = tt(n); add('sfx', t, lp(noise(d), 900) * np.exp(-s / .02) * 2 + np.sin(2 * np.pi * 90 * s) * np.exp(-s / .05) + hp(noise(d), 3000) * np.exp(-s / .004) * .5, v, .1, room=.4)
def waves(t0, t1, v=.25):                           # the sea: slow swells of surf, a wash every few seconds, wide stereo
    d = t1 - t0; n = int(d * SR); s = tt(n); L, R = [], []
    for ch in range(2):
        sw = (.3 + .7 * np.clip(np.sin(2 * np.pi * s / 5.5 + ch * .8), 0, 1) ** 2); L.append(bp(noise(d), 150, 2500)[:n] * sw * fade(n, 1.0, 1.5))
    add2('amb', t0, L[0], L[1], v)
def cheer(t, d=2.5, v=.35):                         # an arena crowd roaring up and falling back
    n = int(d * SR); s = tt(n); env = np.clip(s / .25, 0, 1) * np.exp(-np.maximum(0, s - .6) / .9)
    L = bp(noise(d), 300, 3500)[:n] * env; R = bp(noise(d), 300, 3500)[:n] * env; add2('lng', t, L, R, v, hall=.4)
def bounce(t, v=.4, pan=.2):                        # a basketball on a hardwood court
    d = .3; n = int(d * SR); s = tt(n); add('sfx', t, (np.sin(2 * np.pi * 110 * s) * np.exp(-s / .04) + lp(noise(d), 1500) * np.exp(-s / .006)) * 1.2, v, pan, hall=.3)
def churchbell(t, v=.35, m=55):                     # a church bell far away: inharmonic partials, a long hum
    d = 6.0; n = int(d * SR); s = tt(n); f = m2f(m)
    y = sum(a * np.sin(2 * np.pi * f * r * s) * np.exp(-s / dd) for r, a, dd in ((.5, .6, 4), (1, 1, 3), (1.19, .5, 2), (1.5, .4, 1.6), (2, .45, 1.4), (2.51, .25, 1), (3.0, .15, .8)))
    add('mus', t, y * .25 * fade(n, .003, 1.0), v, -.2, hall=.8)

# ============ the cue sheet (ear-safe: no screams, no screeches, soft hits; the fear is silence, air and things close to you) ============
HUSH = []; DRY = np.zeros((2, N)); SILENT = []
def S0(name): return next((a for a, b, n in SHOTS if n == name), None)
def S1(name): return next((b for a, b, n in SHOTS if n == name), None)
def roomtone(t0, t1, v=.05):                         # an empty building at night: a low air rumble
    d = t1 - t0; n = int(d * SR); add2('amb', t0, lp(noise(d), 180) * fade(n, 1, 1), lp(noise(d), 190) * fade(n, 1, 1), v)
def hum(t0, t1, v=.05, f=60):                       # mains hum of the CRTs and the DVR, soft, no high whine
    d = t1 - t0; n = int(d * SR); s = tt(n); y = sum(np.sin(2 * np.pi * f * k * s) / k ** 1.5 for k in (1, 2, 3, 5)) * fade(n, .5, .5)
    add('amb', t0, y * .3 + lp(noise(d), 3000) * .03 * fade(n, .5, .5), v, .25)
def musicbox(t0, t1, v=.12, pan=-.2):               # a slow, slightly out-of-tune music box (an original phrase in A minor), far away
    mel = [69, 72, 76, 74, 72, 71, 69, None, 67, 69, 71, 72, 71, 69, 68, None]; t = t0; k = 0
    while t < t1 - 1:
        m = mel[k % len(mel)]
        if m:
            d = 1.6; n = int(d * SR); x = tt(n); f = m2f(m + 12) * (1 + .004 * np.sin(k)) * (1 - .002 * (t - t0) / max(1, t1 - t0))
            y = (np.sin(2 * np.pi * f * x) + .35 * np.sin(2 * np.pi * f * 3.01 * x) * np.exp(-x / .15)) * np.exp(-x / .6) * fade(n, .002, .3)
            add('mus', t, y * .4, v, pan, hall=.6)
        t += .62 + .06 * np.sin(k * 1.3); k += 1
def kidstep(t, v=.25, pan=0.0):                     # small bare feet on tile: a soft pat
    d = .12; n = int(d * SR); s_ = tt(n); y = lp(noise(d), 700) * np.exp(-s_ / .015) * 2 + bp(noise(d), 1500, 4000) * np.exp(-s_ / .02) * .25
    add('sfx', t, y, v, pan, room=.3, hall=.3)
def click(t, v=.2, pan=0.0):                        # a switch / a DVR button
    d = .05; n = int(d * SR); s_ = tt(n); add('sfx', t, bp(noise(d), 1500, 6000) * np.exp(-s_ / .004) * 1.5, v, pan, room=.1)
def rustle(t, d=.8, v=.15, pan=0.0):                # cloth: the uniform, a sleeve
    n = int(d * SR); u = tt(n) / d; add('sfx', t, bp(noise(d), 800, 5000) * (np.sin(np.pi * u) ** 2) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 7 * u))) * .5, v, pan, room=.1)
def embers(t0, t1, v=.06, pan=-.5):                 # a faint crackle of old fire, very close (the smell of smoke, as a sound)
    t = t0
    while t < t1:
        d = .03; n = int(d * SR); s_ = tt(n); add('lng', t, hp(noise(d), 1200) * np.exp(-s_ / .004), v * rng.uniform(.3, 1), pan + rng.uniform(-.2, .2)); t += rng.exponential(.09)
def buzzfil(t0, t1, v=.06):                         # the bulb's filament warming: a soft rising hum
    d = t1 - t0; n = int(d * SR); s_ = tt(n); u = s_ / d; f = 100 + 20 * u
    add('sfx', t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(u * 3, 0, 1) * fade(n, .05, .4) * .4 + bp(noise(d), 2000, 5000) * .05 * fade(n, .2, .2), v, .1, room=.2)
def whir(t0, t1, v=.1):                             # the DVR scrubbing back: a soft motor whir
    d = t1 - t0; n = int(d * SR); s_ = tt(n); add('sfx', t0, bp(sat(np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * 3 * s_)) / SR), 2), 200, 2000) * fade(n, .1, .1) * .3, v, .2)
def low_tone(t, d=4.0, v=.25, m=33):                # a deep soft swell (instead of a hit)
    n = int(d * SR); s_ = tt(n); y = sum(np.sin(2 * np.pi * m2f(m) * r * s_) * a for r, a in ((1, 1), (2, .3), (1.5, .15))) * np.sin(np.pi * np.minimum(1, s_ / d)) ** 1.5
    add('mus', t, y * .5, v, 0, hall=.3)


# ============ Balete Drive: rain, the taxi, the road, and her (ear-safe: no screams, no screeches, soft swells instead of hits) ============
INCAR = ['hook', 'boundary', 'tree', 'back', 'pass', 'mirror', 'why', 'smell', 'cta', 'pray', 'beside', 'empty', 'end', 'loop']
OUTNIGHT = ['city', 'rule', 'dry', 'getin', 'circle', 'house', 'final', 'accident']
DAYIN = ['photo', 'count']
def env_for(names, lv=1.0, other=0.0): return shot_env({n: lv for n in names}, other)
def rain_out(d):                                     # rain on the street: a wide hiss, drops on puddles, a gurgle in the gutter
    n = int(d * SR); L_ = hp(noise(d), 350) * .5 + bp(noise(d), 2000, 9000) * .25; R_ = hp(noise(d), 350) * .5 + bp(noise(d), 2000, 9000) * .25
    for k in range(int(d * 40)):
        i = int(rng.uniform(0, n - 2000)); m = 600; s_ = tt(m); y = np.sin(2 * np.pi * rng.uniform(900, 2600) * s_) * np.exp(-s_ / .006) * rng.uniform(.2, .8)
        (L_ if rng.random() < .5 else R_)[i:i + m] += y
    return L_ * fade(n, 1, 1), R_ * fade(n, 1, 1)
def rain_roof(d):                                    # rain on the car roof from inside: a dull drumming, low-passed taps
    n = int(d * SR); L_ = lp(noise(d), 1400) * .4; R_ = lp(noise(d), 1400) * .4
    for k in range(int(d * 70)):
        i = int(rng.uniform(0, n - 1500)); m = 1200; s_ = tt(m); y = lp(rng.standard_normal(m), 900) * np.exp(-s_ / .01) * rng.uniform(.5, 1.6)
        (L_ if rng.random() < .5 else R_)[i:i + m] += y
    return L_ * fade(n, 1, 1), R_ * fade(n, 1, 1)
def engine(d, rpm=1.0):                              # the old engine: a low firing hum with a slow wobble, road and tyre hiss on wet asphalt
    n = int(d * SR); s_ = tt(n); f = 34 * rpm * (1 + .02 * np.sin(2 * np.pi * .3 * s_)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = sat(sum(np.sin(k * ph) / k for k in (1, 2, 3, 4, 6)) * .5, 1.5) * .6 + lp(noise(d), 300) * .5 + bp(noise(d), 1500, 6000) * .12
    return y * fade(n, 1, 1)
def wiper(t, per, v=.2):                             # one cycle: a rubber swish across, a soft thunk, the swish back, the thunk at rest
    for a, b in ((0, .32), (.32, .64)):
        d = (b - a) * per; n = int(d * SR); u = tt(n) / d; y = bp(noise(d), 600, 3500) * np.sin(np.pi * u) ** 2 * .5 + np.sin(2 * np.pi * (700 + 300 * u) * tt(n)) * .03 * np.sin(np.pi * u)
        add('sfx', t + a * per, y, v, (-.3 if a == 0 else .3), room=.05)
        dd = .08; m = int(dd * SR); add('sfx', t + b * per - .02, lp(noise(dd), 300) * np.exp(-tt(m) / .02) * 1.2, v * .8, 0)
def wipers(t0, t1, per, v=.2):
    k = np.ceil(t0 / per)
    while k * per < t1 - .2: wiper(k * per, per, v); k += 1
def door(t, v=.35, open_=1, pan=.3):                 # a car door: the latch click, then the thunk (closing) or a soft creak (opening)
    add('sfx', t, bp(noise(.04), 2000, 7000) * np.exp(-tt(int(.04 * SR)) / .005) * 1.2, v, pan, room=.2)
    if open_: d = .5; n = int(d * SR); s_ = tt(n); add('sfx', t + .03, bp(sat(np.sin(2 * np.pi * np.cumsum(260 + 60 * np.sin(2 * np.pi * 2 * s_)) / SR), 2), 300, 2500) * np.sin(np.pi * s_ / d) * .25, v * .6, pan, room=.2)
    else: d = .35; n = int(d * SR); s_ = tt(n); add('sfx', t + .02, (lp(noise(d), 220) * 3 + np.sin(2 * np.pi * 70 * s_) * .8) * np.exp(-s_ / .07), v, pan, room=.3)
def blinker(t0, t1, v=.12):                          # the turn signal: tick ... tock
    t = t0; k = 0
    while t < t1: d = .03; m = int(d * SR); s_ = tt(m); add('sfx', t, bp(noise(d), 1500 if k % 2 else 2200, 5000) * np.exp(-s_ / .004) * 1.5, v, .15, room=.1); t += .38; k += 1
def thunder(t, v=.3, d=5.0, pan=0.0):                # far thunder: a slow low roll, no crack
    n = int(d * SR); s_ = tt(n); e = (1 - np.exp(-s_ / .6)) * np.exp(-s_ / 1.8) * (1 + .4 * np.sin(2 * np.pi * .9 * s_) ** 2)
    add('amb', t, lp(noise(d), 160) * e * 2.5, v, pan, hall=.4, width=.02)
def passcar(t, v=.25, d=2.2, p0=-.8, p1=.8):         # a car passing on a wet road: a tyre hiss swell crossing the stereo
    n = int(d * SR); s_ = tt(n); u = s_ / d; e = np.exp(-((u - .5) / .22) ** 2)
    y = (bp(noise(d), 600, 5000) * .6 + lp(noise(d), 200) * .5) * e
    for i, p in enumerate(np.linspace(p0, p1, 8)):
        a, b = i * n // 8, (i + 1) * n // 8; add('sfx', t + a / SR, y[a:b] * np.hanning(b - a) * 1.6 if b > a else y[a:b], v, p)
def meter_tick(t, v=.1): click(t, v, .2)
def pen(t0, t1, v=.12):                              # a ballpen on paper: scratchy little strokes
    t = t0
    while t < t1: d = rng.uniform(.06, .18); n = int(d * SR); add('sfx', t, bp(noise(d), 2500, 8000) * np.sin(np.pi * tt(n) / d) * .4, v, .1, room=.1); t += d + rng.uniform(.02, .08)
def flutter(t0, t1, v=.05):                          # an old film projector, far off: a soft 24 Hz flutter
    d = t1 - t0; n = int(d * SR); s_ = tt(n); add('amb', t0, bp(noise(d), 500, 3000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 24 * s_))) * .2 * fade(n, .3, .3), v)
def gust_cold(t, d=2.0, v=.12, p0=.6, p1=-.2): whoosh(t + d / 2, d, v, 150, 1600, p0, p1, 1.8)

inc = env_for(INCAR, 1.0); out_ = env_for(OUTNIGHT, 1.0)
L_, R_ = rain_out(N / SR); BUS['amb'][0] += L_ * out_ * .9; BUS['amb'][1] += R_ * out_ * .9
L_, R_ = rain_roof(N / SR); BUS['amb'][0] += L_ * inc * .9; BUS['amb'][1] += R_ * inc * .9
eng = engine(N / SR); drive = shot_env({'hook': 1, 'boundary': 1, 'tree': .8, 'back': .9, 'pass': 1, 'mirror': .9, 'why': .8, 'smell': .8, 'cta': .9, 'pray': .7, 'beside': .6, 'end': 1, 'loop': 1, 'city': .5, 'circle': .7}, 0.0)
BUS['amb'][0] += eng * drive * .5; BUS['amb'][1] += eng * drive * .5
roomtone(0, DUR, .04)
# wipers, synced to the picture (windshield(t, {per}) in shots.js)
wipers(S0('tree'), S1('tree'), 2.0, .16); wipers(S0('cta'), S1('cta'), 2.0, .14); wipers(S0('end'), S1('end'), 2.2, .16)
# far thunder now and then, outside
for tt_ in (S0('city') + 1.0, S0('rule') + 3.0, S0('house') + 1.5, S0('final') + .5): thunder(tt_, .22, 6.0, rng.uniform(-.5, .5))
# the hook: a deep swell under "pasahero", the bed drops away on "walang nakaupo"
low_tone(wt('h1', 'pasahero') - .3, 5.0, .26, 33); HUSH.append((wt('h2', 'walang') - .1, E('h2') + .5)); low_tone(wt('h2', 'walang') - .2, 5.0, .3, 29)
reverse_swell(wt('h2', 'walang'), 1.4, .14)
# the city: cars passing on the wet road; the rule: the bed dims, a low tone under each rule
for k, p in enumerate((-.8, .6, -.3)): passcar(S0('city') + .6 + k * 1.6, .2, 2.2, p, -p)
passcar(S0('rule') + 1.5, .22, 3.0, .9, -.9)
low_tone(wt('s3', 'nakaputi') - .3, 4.0, .22, 33); low_tone(wt('s3', 'titingin') - .3, 4.5, .24, 31)
drone(S0('rule'), S0('getin') + 1, .14, 36); drone(S0('getin'), S0('house'), .18, 33, .4); drone(S0('house'), S0('morning') + .5, .15, 31, .45); drone(S0('accident'), S0('final') + 4, .17, 31, .45)
# the meter
for k in range(4): meter_tick(S0('boundary') + .5 + k * 1.3, .08)
# the tree: the lady; the engine slows, a low tone
low_tone(wt('s5', 'nakaputi') - .3, 5.0, .26, 31); HUSH.append((wt('s6', 'tuyo') - .1, E('s6') + .3)); shimmer(wt('s6', 'tuyo') - .1, 2.4, .1)
# she gets in: the car stops, the back door opens, shuts; the cold comes in
door(wt('s7', 'Sumakay') - .5, .32, 1, .5); door(wt('s7', 'Sumakay') + 1.4, .4, 0, .5); gust_cold(wt('s7', 'lumamig') - .3, 2.4, .12)
# her voice: breath behind his right shoulder before each of her lines
for id_ in ('L1', 'L2', 'L3', 'L4', 'L5'): breath(T(id_) - 1.6, 1.4, .14, .65)
# around and around: the blinker on "Kaliwa"
blinker(wt('s9', 'Kaliwa') - .2, wt('s9', 'ulit') + .4, .1)
low_tone(wt('s9', 'paikot') - .3, 5.0, .24, 31)
low_tone(wt('s10', 'nandoon') - .3, 5.0, .26, 30)
# the mirror: everything holds its breath; the seat sinking: a slow creak of the springs
HUSH.append((T('s11') - .1, E('s12') + .4)); heartbeat(T('s11') + .4, .2); heartbeat(T('s11') + 1.3, .2)
creak(wt('s12', 'lubog') - .1, 1.4, .14, .4); low_tone(wt('s12', 'Walang') - .2, 5.0, .3, 29)
# "bakit ka tumingin?": dead silence under her, then a deep swell after
SILENT.append((T('L3') - .25, E('L3') + .15)); reverse_swell(E('L3') + .1, 1.2, .14); low_tone(E('L3') + .05, 5.5, .32, 28)
# the smell: candle crackle, earth sifting
embers(wt('s13', 'Kandila') - .2, S1('smell'), .05, .5)
# praying: the beads, the heartbeat slowing
for k in range(10): click(T('s14') + .6 + k * .4, .07, .05)
for k in range(4): heartbeat(T('s14') + .4 + k * (.9 + .15 * k), .2 - .03 * k)
# "nandito na tayo": right at his ear; the engine stops under her
SILENT.append((T('L4') - .2, E('L4') + .2)); breath(T('L4') - .7, 1.0, .2, .8); low_tone(E('L4'), 5.0, .3, 28)
# the house: the engine idles down; the door; nobody
door(wt('s16', 'Bumukas') - .1, .3, 1, .6); door(wt('s16', 'Sumara') - .05, .4, 0, .6)
HUSH.append((wt('s16', 'wala') - .1, E('B1') + .4)); shimmer(wt('s16', 'sampaguita') - .1, 2.2, .1)
# morning: birds, a rooster far off, a jeepney, the gate's iron squeal (soft)
birds(S0('morning'), S0('accident'), .12); engines(S0('morning'), S0('photo'), .05)
creak(wt('s17', 'nagbukas') - .4, 1.0, .12, .2)
# the photo: a sad piano, quiet; "Elena": a soft tone
sadpiano(S0('photo') + .3, S0('accident') + .5, .14); low_tone(wt('s19', 'Elena') - .2, 4.0, .2, 36)
# twenty years ago: the projector flutter, rain, the old engine; on "bumangga" a soft low swell and then nothing (no crash)
flutter(S0('accident'), S1('accident'), .05); HUSH.append((wt('s20', 'bumangga') - .1, wt('s20', 'bumangga') + 1.2)); low_tone(wt('s20', 'bumangga') - .1, 6.0, .32, 27)
# the notebook: the pen writes the fourteenth line; crosses beside the names
pen(wt('s21', 'ikalabing') - .1, wt('s21', 'ikalabing') + 2.1, .12); low_tone(T('s22') - .2, 5.0, .28, 29)
# the handprint: a drip, then a cold gust
for k in range(5): click(wt('s23', 'kamay') + .3 + k * .7, .05, -.2)
low_tone(wt('s23', 'loob') - .2, 5.0, .3, 28)
# the end: years later, any rainy night; the last line: the rain, the engine going away, then only rain
low_tone(wt('s24', 'gilid') - .3, 5.0, .26, 30); breath(wt('s24b', 'bumubulong') - .4, 1.6, .2, .75); low_tone(wt('s23b', 'upuan') - .2, 4.5, .26, 29); low_tone(wt('s25', 'hihinto') - .2, 6.0, .32, 27)

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
VO = np.zeros(N); KID = np.zeros((2, N))
for l in TL['lines']:
    if 'wav0' not in l or not os.path.exists(os.path.join(HERE, VDIR, l['id'] + '.wav')): continue
    if l.get('voice') == 'babae':    # her: close behind the right shoulder, slowly drifting, a small cold room, kept out of VO so it can move
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, l['id'] + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
        y = np.frombuffer(raw, '<i2') / 32768; y = hp(y, 160); y = y / (np.abs(y).max() + 1e-9) * .85
        i = max(0, int(l['wav0'] * SR)); n = min(len(y), N - i); s_ = tt(n); p = .35 + .25 * np.sin(2 * np.pi * .07 * s_ + 1.2)
        KID[0, i:i + n] += y[:n] * np.cos((p + 1) * np.pi / 4) * 1.2; KID[1, i:i + n] += y[:n] * np.sin((p + 1) * np.pi / 4) * 1.2
        tail = fconv(y[:n], IR[('room', 0)]) * .35; KID[0, i:i + n] += tail * .8; KID[1, i:i + n] += tail
        continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, l['id'] + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, '<i2') / 32768; y = hp(y, 75); y = np.tanh(y / (np.abs(y).max() + 1e-9) * 1.7) / np.tanh(1.7) * .9
    i = int(l['wav0'] * SR)
    if i < 0: y = y[-i:]; i = 0
    n = min(len(y), N - i); VO[i:i + n] += y[:n]
LVL = {'mus': .2, 'sfx': .42, 'amb': .14, 'lng': .3}
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
env = box(np.abs(VO) + np.abs(KID).mean(0), int(.08 * SR)); env = np.clip(env / .05, 0, 1)
env = box(env, int(.25 * SR)); duck = 1 - env * (1 - 10 ** (-3.5 / 20)); duck_s = 1 - env * (1 - 10 ** (-1.5 / 20)); duck_l = 1 - env * (1 - 10 ** (-8 / 20))
MIX = (BUS['mus'] + BUS['amb']) * duck + BUS['lng'] * duck_l + BUS['sfx'] * duck_s + DRY
out = MIX + VO + KID
if os.environ.get('STEMS'):                          # debugging: each bus as it lands in the mix
    for nm, x in (('vo', np.stack([VO, VO])), ('sfx', BUS['sfx'] * duck_s), ('amb', BUS['amb'] * duck), ('mus', BUS['mus'] * duck), ('lng', BUS['lng'] * duck_l)):
        with wave.open(os.path.join(HERE, 'out', f'stem_{nm}.wav'), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes())
rms = np.sqrt(np.maximum(box(((out[0] + out[1]) * .5) ** 2, int(.05 * SR)), 0)) + 1e-9
thr = np.percentile(rms, 80); gr = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.2), 1.0); gr = box(gr, int(.03 * SR))
out = out * gr; n = int(DUR * SR); out = out[:, :n]; out = np.tanh(out / np.abs(out).max() * 1.3) / np.tanh(1.3) * .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', f'mix{SUF}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype('<i2').tobytes())
