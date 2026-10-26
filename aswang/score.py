"""Sound for Aswang sa Probinsya -> out/mix.wav (48 kHz stereo). Cinematic sound design in numpy (the toolkit from ../tsunami and ../zombie): a province night
(crickets in the grass, frogs, wind in the banana leaves), dogs barking that suddenly stop, and the crickets with them; the tik-tik (loud when it's far, faint when it's
close); scratching in the thatch, three knocks and a door creak, something under the floor, salt hissing, leathery wing beats and a shriek across the moon, the rooster
at dawn and the morning birds. A felt piano for Lola, a dark drone under the rules, a slam and a held breath on every rule card.
Every time comes from timeline.json and the same story anchors shots.js uses. Usage: python3 score.py"""
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

# ---------- the story's clock (the same anchors as shots.js) ----------
def wx(id, w):                                      # the exact word (wt takes the first word that starts with w)
    w = ANCH.get(f'{id}:{w}', w); l = LN[id]
    for x in l.get('words', []):
        if ''.join(c for c in x[0].lower() if c.isalnum() or c == "'") == w.lower(): return x[1]
    return l['t0']
W_STOP, W_ASW, W_BROWN, W_FIVE, W_KAPIT = wt('h1', 'tumigil'), wt('h1', 'aswang'), wt('s1', 'Brownout'), wt('s3', '5'), wt('s4', 'kapitbahay')
W_MALAKAS, W_MAHINA, W_PANGALAN, W_KATOK, W_MATA, W_ASW3 = wt('r1', 'malakas'), wt('r1', 'mahina'), wt('r2', 'pangalan'), wt('r3', 'kumatok'), wt('r3', 'mata'), wt('r3b', 'aswang')
W_KALUS, W_NAKA, W_ASIN, W_PAGI, W_MANAN, W_HANAP = wt('mid', 'kumakaluskos'), wt('mid', 'nakatingin'), wt('r4', 'asin'), wt('r4', 'pagi'), wt('r5', 'manananggal'), wt('r5', 'Hanapin')
W_TILA, W_TAHIMIK = wt('dawn', 'tumilaok'), wt('end', 'tumahimik')
def smooth(x, n):
    c = np.concatenate([[0.0], np.cumsum(x)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
def shot_env(levels, default=0.0):                  # a level per shot, with short crossfades at the cuts
    e = np.full(N, default)
    for a, b, sh in SHOTS: e[int(a * SR):int(b * SR)] = levels.get(sh, default)
    return smooth(e, int(.08 * SR))
def gate(e, a, b, val=0.0):                         # force a stretch of an envelope (e.g. nothing burns before the blast)
    e = e.copy(); e[int(a * SR):int(b * SR)] = val; return smooth(e, int(.05 * SR))
at_ = lambda e, t: float(e[min(N - 1, max(0, int(t * SR)))])
def bed_add(bus, y2, env, v=1.0):                   # a full-length stereo bed shaped by an envelope
    BUS[bus][0] += y2[0][:N] * env * v; BUS[bus][1] += y2[1][:N] * env * v

# ---------- sounds for this story ----------
def wind(t0, t1, v=.15):
    d = t1 - t0; n = int(d * SR); s = tt(n); out = []
    for ch in range(2): out.append(tvf(noise(d), 650 + 300 * np.sin(2 * np.pi * (.07 + .02 * ch) * s + ch) + 150 * np.sin(2 * np.pi * .23 * s), 1.4) * fade(n, 1.0, 1.0))
    add2('amb', t0, out[0], out[1], v)
def growl(t, d=1.2, v=.45, f0=72, pan=0.0):         # a throat that is not working right: a rough, jittering low voice through formants
    n = int(d * SR); s = tt(n); u = s / d
    jit = 1 + .07 * np.repeat(rng.standard_normal(n // 240 + 1), 240)[:n]
    f = f0 * (1 + .14 * np.sin(2 * np.pi * 3.1 * s)) * jit; ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(k * ph) / k for k in range(1, 26)) * (1 + .7 * np.repeat(rng.random(n // 90 + 1), 90)[:n])
    y = bp(y, 240, 880) + bp(y, 900, 1500) * .55 + bp(noise(d), 300, 2600) * .3
    add('sfx', t, sat(y * np.sin(np.pi * np.minimum(1, u * 1.15)) ** .7 * .55, 2.2), v, pan, room=.15, hall=.22)
def gasp(t, v=.5):                                  # a crowd catching its breath
    d = .7; n = int(d * SR); u = tt(n) / d; y = tvf(noise(d), 900 + 900 * u, .9) * np.minimum(1, u * 12) * np.exp(-u * 3.5)
    add('sfx', t, y, v, 0, hall=.5, width=.02)
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
def frogs():                                        # frogs in the paddies: low croaks now and then
    y = np.zeros(N); t = .3
    while t < N / SR - .5:
        d = rng.uniform(.12, .25); n = int(d * SR); s = tt(n); f = rng.uniform(180, 320); ph = 2 * np.pi * f * s
        c = sum(np.sin(k * ph) / k for k in range(1, 9)) * (np.sin(np.pi * ((s * rng.uniform(28, 45)) % 1)) ** 3) * fade(n, .01, .04); i = int(t * SR); y[i:i + n] += bp(c, 150, 1400) * rng.uniform(.3, 1); t += rng.exponential(.6)
    return [y * .09, np.roll(y, int(.017 * SR)) * .07]
def bark(t, v=.4, pan=0.0, far=1.0, f0=520):        # a dog barking somewhere in the dark: a harmonic burst with a falling pitch, a little rasp
    d = .2; n = int(d * SR); s = tt(n); f = f0 * (1 + .3 * np.exp(-s / .025)) * (1 - .3 * s / d); ph = 2 * np.pi * np.cumsum(f) / SR
    y = bp(sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 16)), 280, 3600) + bp(noise(d), 700, 3200) * .45
    y = sat(y * np.minimum(1, s / .006) * np.exp(-np.maximum(0, s - .045) / .05) * .7, 1.6)
    add('sfx', t, lp(y, 2600) if far > .5 else y, v, pan, room=.1, hall=.4 * far)
def barking(t0, t1, v=.4, pan=0.0, f0=520):
    t = t0
    while t < t1 - .2:
        for k in range(rng.integers(1, 4)): bark(t + k * rng.uniform(.22, .3), v * rng.uniform(.7, 1), pan, 1, f0 * rng.uniform(.95, 1.05))
        t += rng.uniform(.8, 1.6)
def whimper(t, v=.25, pan=0.0):                     # the dog, after: a thin whine
    d = .9; n = int(d * SR); s = tt(n); f = 950 * (1 + .1 * np.sin(2 * np.pi * 6 * s)) * (1 - .15 * s / d)
    add('sfx', t, bp(np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR), 600, 3000) * np.sin(np.pi * s / d) ** 1.5 * .5, v, pan, room=.15, hall=.2)
def tiktik(t, v=.4, near=0.0, pan=.3):              # tik ... tik: a dry hollow click, loud and echoing when far, faint and dry when close
    for k, dt in enumerate((0, .22)):
        d = .06; n = int(d * SR); s = tt(n); y = hp(noise(d), 2400) * np.exp(-s / .0018) * 1.4 + bp(noise(d), 1800, 4200) * np.exp(-s / .012) * .7 + np.sin(2 * np.pi * 2900 * s) * np.exp(-s / .01) * .3
        add('sfx', t + dt, y, v * (1 if k == 0 else .8), pan, room=.15 * (1 - near), hall=.55 * (1 - near))
def scratch(t0, t1, v=.3, pan=0.0):                 # claws in the thatch: dry rustles in bursts
    t = t0
    while t < t1:
        d = rng.uniform(.08, .3); n = int(d * SR); u = tt(n) / d; y = bp(noise(d), 1500, 6500) * np.sin(np.pi * u) ** .7 * (1 + .8 * np.sin(2 * np.pi * rng.uniform(30, 60) * tt(n)))
        add('sfx', t, y * .5, v * rng.uniform(.5, 1), pan + rng.uniform(-.3, .3), room=.1); t += rng.uniform(.05, .35)
def knock(t, v=.6):                                 # three knocks on a wooden door
    for k in range(3):
        d = .3; n = int(d * SR); s = tt(n); y = lp(noise(d), 500) * np.exp(-s / .02) * 2 + np.sin(2 * np.pi * 165 * s) * np.exp(-s / .07) * .8 + np.sin(2 * np.pi * 240 * s) * np.exp(-s / .04) * .4
        add('sfx', t + k * .28, sat(y, 1.4), v * (1 if k < 2 else 1.1), -.2, room=.3)
def creak(t, d=1.4, v=.35):                         # a door on old hinges: a rough friction tone that wanders
    n = int(d * SR); s = tt(n); f = 150 + 90 * np.sin(2 * np.pi * .7 * s) + 40 * np.sin(2 * np.pi * 2.3 * s); jit = 1 + .08 * np.repeat(rng.standard_normal(n // 160 + 1), 160)[:n]
    ph = 2 * np.pi * np.cumsum(f * jit) / SR; y = bp(sum(np.sin(k * ph) / k for k in range(1, 20)), 350, 2600) * np.sin(np.pi * s / d) ** .6
    add('sfx', t, y * .4, v, -.2, room=.25)
def flap(t, v=.4, pan=0.0):                         # one leathery wing beat
    d = .35; n = int(d * SR); u = tt(n) / d; add('sfx', t, lp(noise(d), 700) * np.sin(np.pi * u) ** 2 * 2 + bp(noise(d), 800, 2500) * np.sin(np.pi * u) ** 4 * .4, v, pan, room=.1, hall=.2)
def flaps(t0, t1, v=.4, rate=1.6, p0=-.6, p1=.6):
    t = t0
    while t < t1: flap(t, v, lerp(p0, p1, (t - t0) / max(.1, t1 - t0))); t += 1 / rate
def shriek(t, v=.6, d=1.4, pan=0.0):                # her scream: a harsh rasping cry that falls away
    n = int(d * SR); s = tt(n); f = 1250 * (1 + .25 * np.sin(2 * np.pi * 9 * s)) * (1 - .35 * s / d); ph = 2 * np.pi * np.cumsum(f) / SR
    y = bp(sum(np.sin(k * ph) / k for k in range(1, 9)), 900, 5000) + tvf(noise(d), 2400 + 600 * np.sin(2 * np.pi * 3 * s), .5) * .8
    add('sfx', t, sat(y * np.minimum(1, s / .03) * np.exp(-s / (d * .5)) * .5, 2), v, pan, room=.1, hall=.5, width=.01)
def pour(t, d=1.6, v=.4, pan=0.0):                  # salt pouring: a stream of tiny grains
    n = int(d * SR); y = np.zeros(n); k = 0
    while k < n - 60: m = 40; y[k:k + m] += hp(noise(m / SR), 4000) * np.exp(-tt(m) / .0006) * rng.uniform(.2, 1); k += int(rng.exponential(SR / 900)) + 1
    add('sfx', t, y * fade(n, .1, .3) * .7 + hp(noise(d), 5000) * fade(n, .2, .3) * .05, v, pan, room=.08)
def sizzle(t, d=2.5, v=.35):                        # salt on the cut: a hiss with crackle
    n = int(d * SR); s = tt(n); y = hp(noise(d), 3000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 7 * s))) * fade(n, .2, .8) * .4
    pops = np.zeros(n); k = 0
    while k < n - 300: pops[k:k + 200] += hp(noise(200 / SR), 2000) * np.exp(-tt(200) / .002) * rng.uniform(.2, 1); k += int(rng.exponential(SR / 40)) + 1
    add('sfx', t, y + pops * .5, v, .1, room=.1)
def rooster(t, v=.45):                              # the rooster: four calls rising, the last one long, from across the yard
    sy = [(.13, 680, 760), (.1, 820, 860), (.14, 900, 980), (.65, 1050, 880)]; tt0 = t
    for k, (d, fa, fb) in enumerate(sy):
        n = int(d * SR); s = tt(n); f = fa + (fb - fa) * s / d + (8 * np.sin(2 * np.pi * 7 * s) if k == 3 else 0); ph = 2 * np.pi * np.cumsum(f) / SR
        y = bp(sum(np.sin(i * ph) / i ** .9 for i in range(1, 14)), 700, 4200) + bp(noise(d), 1500, 4000) * .25
        add('sfx', tt0, y * fade(n, .015, .05 if k < 3 else .25) * .35, v, -.4, room=.1, hall=.5); tt0 += d + .03
def birds(t0, t1, v=.2):                            # morning: sparrows, quick chirps
    t = t0
    while t < t1:
        for k in range(rng.integers(2, 5)):
            d = rng.uniform(.04, .09); n = int(d * SR); s = tt(n); f0 = rng.uniform(3200, 5200); f = f0 * (1 + rng.uniform(-.25, .25) * s / d)
            add('sfx', t + k * rng.uniform(.07, .12), np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s / d) * .3, v * rng.uniform(.4, 1), rng.uniform(-.8, .8), room=.1, hall=.25)
        t += rng.uniform(.4, 1.2)
def hum(t0, t1, v=.08):                             # the house's power: a faint 60 Hz hum with its harmonics
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, sum(np.sin(2 * np.pi * 60 * k * s) / k for k in (1, 2, 3, 5)) * fade(n, .2, .02) * .3, v, 0)
def whisper_call(t, v=.5, pan=-.5):                 # someone outside whispering "a-nak": breath shaped by vowel formants, far and wet
    for k, (d, f1, f2, f3) in enumerate(((.55, 820, 1250, 2600), (.12, 300, 1500, 2500), (.7, 780, 1200, 2700))):
        n = int(d * SR); s_ = tt(n); x = noise(d); y = bp(x, f1 * .8, f1 * 1.25) + bp(x, f2 * .85, f2 * 1.15) * .7 + bp(x, f3 * .9, f3 * 1.1) * .35
        env = np.sin(np.pi * s_ / d) ** (1.2 if k != 1 else .5) * (1 if k != 1 else .5)
        add('sfx', t + [0, .5, .6][k], y * env * 2.2, v, pan, room=.2, hall=.6)
    d = .05; n = int(d * SR); add('sfx', t + 1.32, hp(noise(d), 2500) * np.exp(-tt(n) / .006) * 1.4, v * .7, pan, hall=.6)    # the k
def breath(t, d=1.6, v=.4, pan=0.0):                # something breathing close: a raspy inhale and exhale
    for k in range(2):
        dd = d / 2; n = int(dd * SR); u = tt(n) / dd; y = bp(noise(dd), 250 + 150 * k, 1600 - 300 * k) * np.sin(np.pi * u) ** 1.4 * (1 + .6 * np.sin(2 * np.pi * 38 * tt(n)))
        add('sfx', t + k * dd, y * 1.2, v * (.8 if k else 1), pan, room=.12)
def thump(t, v=.55, pan=0.0):                       # a heavy step on the nipa roof above: a dull thud and the thatch crunching
    d = .45; n = int(d * SR); s_ = tt(n); y = np.sin(2 * np.pi * (55 + 40 * np.exp(-s_ * 30)) * s_) * np.exp(-s_ / .1) * 1.5 + lp(noise(d), 400) * np.exp(-s_ / .04) * 1.2
    add('sfx', t, sat(y, 1.5), v, pan, room=.2); scratch(t + .02, t + .3, v * .6, pan)
def howl(t, v=.5, pan=-.4, d=2.4):                  # a dog howling at the moon
    n = int(d * SR); s_ = tt(n); u = s_ / d; f = (480 + 260 * np.sin(np.pi * np.minimum(1, u * 1.3)) - 120 * u) * (1 + .012 * np.sin(2 * np.pi * 5.5 * s_)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = bp(sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 12)), 350, 3500) * np.sin(np.pi * u) ** .8 * .5 + bp(noise(d), 600, 2500) * np.sin(np.pi * u) * .08
    add('sfx', t, y, v, pan, room=.1, hall=.5)
def pop(t, v=.5):                                   # the bulb going out: a snap and a fizz
    d = .5; n = int(d * SR); s_ = tt(n); add('sfx', t, hp(noise(d), 1800) * np.exp(-s_ / .004) * 2 + bp(noise(d), 2000, 7000) * np.exp(-s_ / .15) * .3 * (1 + np.sin(2 * np.pi * 120 * s_)), v, 0, room=.2)
def wail(t, v=.25, pan=.5, d=3.5):                  # a far voice in the wind, rising and falling
    n = int(d * SR); s_ = tt(n); u = s_ / d; f = 520 * (1 + .25 * np.sin(np.pi * u) + .02 * np.sin(2 * np.pi * 4.5 * s_)); ph = 2 * np.pi * np.cumsum(f) / SR
    add('sfx', t, bp(np.sin(ph) + .3 * np.sin(2 * ph), 300, 2500) * np.sin(np.pi * u) ** 2 * .3, v, pan, hall=.8)
def flame(t, v=.35):                                # a match struck, the wick catching
    d = .6; n = int(d * SR); s = tt(n); add('sfx', t, hp(noise(d), 1500) * np.exp(-s / .05) * 1.2 + lp(noise(d), 800) * np.exp(-s / .2) * .6, v, .3, room=.15)
# ============ the cue sheet ============
HUSH = []; DRY = np.zeros((2, N)); SILENT = []
NIGHT_E = shot_env({'hook': 1.0, 'loop': 1.0, 'arrive': .35, 'kubo': .6, 'whisper': .5, 'neighbor': .6, 'roof': .45, 'call': .7, 'nanay': .35, 'visitor': .55, 'eye': .25, 'floor': .35,
                    'cta': .35, 'garlic': .5, 'grove': 1.0, 'salt': 1.0, 'dawn': .9, 'end': 1.0})
NIGHT_E = gate(NIGHT_E, W_STOP + .05, T('s1') - .05, 0.0); NIGHT_E = gate(NIGHT_E, W_TAHIMIK + .05, T('tail') - .1, 0.0)
NIGHT_E = NIGHT_E * np.clip(1 - (tt(N) - T('dawn')) / max(.1, E('dawn') + 1 - T('dawn')) * ((tt(N) > T('dawn')) & (tt(N) < T('s5'))), 0, 1)
bed_add('amb', crickets(), NIGHT_E, 1.0); bed_add('amb', frogs(), NIGHT_E * shot_env({'hook': 1, 'loop': 1, 'grove': 1, 'salt': 1, 'end': 1, 'kubo': .6, 'call': .7}), .8)
wind(0, DUR, .1)
SILENT.append((W_STOP + .05, W_ASW - .1)); SILENT.append((W_TAHIMIK + .05, T('tail') - .05))
# the hook: frame 1 is loud: a dog close by yelps and howls, the others bark, a deep hit; on "tumigil" everything stops dead; a heartbeat; on "aswang" a hit and a screech
impact(.02, 1.0, 1.4); sub_drop(.02, .7, 2.0); howl(.15, .55, -.45, 2.6); bark(.05, .6, -.5, 0, 560)
barking(.6, W_STOP, .5, -.55, 540); barking(.3, W_STOP, .38, .6, 620); barking(1.0, W_STOP, .25, .1, 480)
for k in range(3): tiktik(1.2 + k * .6, .35, 0, .5)
whimper(W_STOP + .35, .35, -.5); heartbeat(W_STOP + .9, .6); heartbeat(W_STOP + 1.75, .65)
impact(W_ASW - .02, 1.0, 1.5); stinger(W_ASW - .05, .9); shriek(W_ASW + .05, .45, 1.2, .2); growl(W_ASW + .2, 1.4, .45, 58, .1)
# under everything: a low drone and, now and then, a far wail in the wind (not in the morning)
drone(0, T('s5'), .22, 29, .5, .005); drone(E('s5'), DUR, .22, 29, .5, .005)
for tw in (10.5, 27.5, 44.0, 63.5, 85.0, 111.0): wail(tw, .3, (.6 if int(tw) % 2 else -.6))
# a whoosh and a soft hit on every cut
for i, (a_, b_, sh) in enumerate(SHOTS):
    if i and sh != 'loop': whoosh(a_, .5, .3, p0=(-.6 if i % 2 else .6), p1=(.6 if i % 2 else -.6)); impact(a_ + .02, .35, .7)
# Lola's house: the bulb's hum, then it pops; a match, the lamp; a felt piano
hum(T('s1'), W_BROWN, .14); pop(W_BROWN, .6); impact(W_BROWN, .55, .9); flame(W_BROWN + .6, .45)
motif(T('s2'), W_KAPIT - .4, .16)
whoosh(W_FIVE, .4, .2, 400, 6000); reverse_swell(W_KAPIT, 1.0, .45); impact(W_KAPIT, .8, 1.2); stinger(W_KAPIT, .55); flaps(W_KAPIT, W_KAPIT + 1.2, .3, 2.2)
# the rules: a slam on every card, then a held breath
for id in ('r1', 'r2', 'r3', 'r4', 'r5'):
    impact(T(id), 1.0, 1.2); sub_drop(T(id), .6, 1.2); braam(T(id) + .02, .35, 1.8); whoosh(T(id) - .05, .35, .3, 300, 6000, -.4, .4); HUSH.append((T(id) + .15, T(id) + .8))
# rule 1: the tik-tik, loud and far, then faint and close; steps on the roof, claws in the thatch, bits falling
for k in range(3): tiktik(W_MALAKAS + k * .55, .6, 0, .6 - .3 * k)
for k in range(4): tiktik(W_MAHINA + .2 + k * .5, .2, 1, 0)
thump(W_MAHINA + .1, .7, .1); thump(W_MAHINA + .9, .6, -.1); scratch(W_MAHINA + .3, E('r1') + .2, .5); stinger(W_MAHINA + .4, .5)
# rule 2: it calls "a-nak" from outside; the face rises with a screech; your heart; then Nanay asleep beside you
whisper_call(W_PANGALAN + .1, .7, -.55); whisper_call(W_PANGALAN + 2.2, .55, -.6)
stinger(wt('r2', 'Nanay') - .2, .7); impact(wt('r2', 'Nanay') - .1, .7, 1.1)
t_, p_ = W_PANGALAN, .8
while t_ < E('r2b'): heartbeat(t_, .55); t_ += p_; p_ = max(.5, p_ * .95)
SILENT.append((T('r2b') - .05, T('r2b') + .3)); breath(T('r2b') + .5, 1.8, .35, .4)
# rule 3: three knocks, the door creaks; her face changes with a screech; the eye
knock(W_KATOK, .85); creak(T('r3') + 1.2, 1.3, .55); stinger(W_MATA - .1, .8); impact(W_MATA - .05, .8, 1.2); shriek(W_MATA, .35, .9, 0)
impact(W_ASW3, .9, 1.3); sub_drop(W_ASW3, .6, 1.6); whoosh(W_ASW3 - .2, .4, .3, 200, 4000)
# 3:30: scratching under the floor, breathing; it looks up
scratch(W_KALUS, W_NAKA, .45, .2); breath(W_KALUS + .8, 1.8, .5, -.1); breath(W_KALUS + 2.8, 1.6, .5, .1)
stinger(W_NAKA - .05, .85); impact(W_NAKA, .9, 1.3); growl(W_NAKA, 1.8, .5, 50, 0); SILENT.append((W_NAKA - .45, W_NAKA - .05))
# the share, in the quiet: a slow heartbeat
t_ = T('cta') + .1
while t_ < E('cta'): heartbeat(t_, .4); t_ += .9
# rule 4: salt along the door, the stingray tail cracks the air
pour(W_ASIN, 1.4, .6); whoosh(W_PAGI, .3, .5, 600, 7000, .3, -.3); impact(W_PAGI + .1, .5, .7)
# rule 5: wings across the moon, her shriek; the half she left; salt, sizzling, a dying scream
flaps(W_MANAN - .6, W_MANAN + 2.4, .6, 1.8, .8, -.8); shriek(W_MANAN, .8, 1.6, 0); impact(W_MANAN, .8, 1.2)
pour(T('r5b') + .1, 1.6, .38); sizzle(wt('r5b', 'abo') + .45, 3.0, .6); shriek(T('r5b') + 1.0, .5, 2.2, .3)
# all night she screams in the sky; the rooster; the sky goes pale
flaps(T('dawn'), W_TILA, .45, 1.5, -.6, .6); shriek(T('dawn') + .3, .65, 1.8, -.3); shriek(T('dawn') + 1.9, .55, 1.4, .4)
rooster(W_TILA, .8); pad(W_TILA, E('s5') + .5, [50, 57, 62, 66], .14)
# morning: birds, the footprints; the neighbour's window
birds(T('s5') - .3, E('s5') + .6, .35); stinger(wt('s5', 'kapitbahay'), .55); impact(wt('s5', 'kapitbahay'), .7, 1.1)
# so if the dogs go quiet tonight: barking; then nothing, a hit; then the barking again into frame 1
barking(T('end'), W_TAHIMIK, .5, -.4, 520); barking(T('end') + .3, W_TAHIMIK, .38, .5, 600); impact(W_TAHIMIK + .05, .8, 1.2); sub_drop(W_TAHIMIK + .05, .6, 1.6)
barking(T('tail') + .1, DUR, .45, -.5, 520); howl(T('tail') + .2, .4, -.4, 2.0); reverse_swell(DUR, 1.3, .55); riser(DUR, 1.5, .35)
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
LVL = {'mus': .3, 'sfx': .7, 'amb': .23}
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
env = box(env, int(.25 * SR)); duck = 1 - env * (1 - 10 ** (-3.5 / 20)); duck_s = 1 - env * (1 - 10 ** (-1.5 / 20))
MIX = (BUS['mus'] + BUS['amb']) * duck + BUS['sfx'] * duck_s + DRY
out = MIX + VO
if os.environ.get('STEMS'):                          # debugging: each bus as it lands in the mix
    for nm, x in (('vo', np.stack([VO, VO])), ('sfx', BUS['sfx'] * duck_s), ('amb', BUS['amb'] * duck), ('mus', BUS['mus'] * duck)):
        with wave.open(os.path.join(HERE, 'out', f'stem_{nm}.wav'), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes())
rms = np.sqrt(np.maximum(box(((out[0] + out[1]) * .5) ** 2, int(.05 * SR)), 0)) + 1e-9
thr = np.percentile(rms, 80); gr = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.2), 1.0); gr = box(gr, int(.03 * SR))
out = out * gr; n = int(DUR * SR); out = out[:, :n]; out = np.tanh(out / np.abs(out).max() * 1.3) / np.tanh(1.3) * .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', f'mix{SUF}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype('<i2').tobytes())
