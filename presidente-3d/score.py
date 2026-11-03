"""Sound for Ikaw ang Presidente, 3D (10 s) -> out/mix.wav (48 kHz stereo). The numpy toolkit from ../presidente. A solo jazz drum kit
(a ride in swing, ghost notes on the snare, fills into the turns, a crash when the doors open), your footsteps on the linoleum in step with
the walk in main.js, the fluorescent hum and its stutter on "namatay", the doors, the crowd behind them, the cameras. The narrator on top. Usage: python3 score.py"""
import os, sys, json, wave, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
DUR = 10.0; N = int(SR * DUR) + SR
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

TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8')); LN = {l['id']: l for l in TL['lines']}
def wt(id, w): return next((x[1] for x in LN[id]['words'] if x[0].lower().startswith(w)), LN[id]['t0'])
W_NAMATAY, W_IKAW, DOOR, FLASH = wt('h1', 'namatay'), wt('h1', 'ikaw'), 8.4, [9.05, 9.3, 9.42, 9.6, 9.75, 9.88]      # the same times as main.js
def jhash(n): x = np.sin(n * 127.1 + 311.7) * 43758.5453; return x - np.floor(x)
# ---------- the kit ----------
def kick(t, v=.6):
    d = .35; n = int(d * SR); s = tt(n); y = np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-s * 30)) / SR) * np.exp(-s / .12) + lp(noise(d), 2000) * np.exp(-s / .004) * .5
    add('sfx', t, sat(y, 1.3), v, 0, room=.15)
def snare(t, v=.5, pan=.1):
    d = .3; n = int(d * SR); s = tt(n); y = bp(noise(d), 1500, 8000) * np.exp(-s / .09) * .9 + np.sin(2 * np.pi * 190 * s) * np.exp(-s / .05) * .7 + hp(noise(d), 3000) * np.exp(-s / .005) * .6
    add('sfx', t, y, v, pan, room=.25)
def ride(t, v=.25, pan=.35):
    d = 1.2; n = int(d * SR); s = tt(n); y = sum(np.sin(2 * np.pi * f * s + k) for k, f in enumerate((3110, 4235, 5170, 6620, 7350))) * .15 * np.exp(-s / .5)
    y += hp(noise(d), 6000) * np.exp(-s / .25) * .35; y[:int(.004 * SR)] += hp(noise(.004), 4000) * .8; add('sfx', t, y, v, pan, room=.2)
def hat(t, v=.18, pan=-.3):
    d = .08; n = int(d * SR); add('sfx', t, hp(noise(d), 7000) * np.exp(-tt(n) / .02), v, pan, room=.1)
def tom(t, f=110, v=.45, pan=-.2):
    d = .5; n = int(d * SR); s = tt(n); add('sfx', t, np.sin(2 * np.pi * np.cumsum(f * (1 + .4 * np.exp(-s * 25))) / SR) * np.exp(-s / .18) + bp(noise(d), 300, 3000) * np.exp(-s / .02) * .4, v, pan, room=.25)
def crash(t, v=.45):
    d = 2.6; n = int(d * SR); s = tt(n); y = hp(noise(d), 3500) * np.exp(-s / .9) * .6 + sum(np.sin(2 * np.pi * f * s + k) for k, f in enumerate((2870, 3930, 5410, 6990))) * .08 * np.exp(-s / .7)
    add('sfx', t, y, v, -.2, room=.2, hall=.25, width=.01)
BPM = 152; B = 60 / BPM; SW = B * 2 / 3        # swing: the "and" lands two thirds of the way through the beat
def groove(t0, t1, v=1.0):
    k = 0; t = t0
    while t < t1:
        ride(t, .26 * v); hat(t + B, .2 * v)
        if k % 2 == 1: ride(t + SW, .18 * v)
        if jhash(k * 3.1) > .55: snare(t + SW + (B if jhash(k) > .5 else 0), .12 * v, .1)          # ghost notes
        if k % 2 == 0: kick(t, .18 * v)
        t += B; k += 1
def fill(t0, n=6, v=.5):                            # a run down the kit into the next phrase
    for i in range(n):
        u = t0 + i * B / 3; (snare if i < n // 2 else tom)(u, v * (.6 + .4 * i / n), *(() if i < n // 2 else (160 - i * 12, v)))
# ---------- the hallway ----------
def zMe(t): return 1.0 - 1.42 * min(t, 8.4) - ((1.42 * (t - 8.4) - .55 * (t - 8.4) ** 2) if t > 8.4 else 0)
def hum(t0, t1, v=.06):
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, sat(sum(np.sin(2 * np.pi * 120 * k * s) / k for k in (1, 2, 3, 4, 6)), 1.5) * fade(n, .2, .2) * .25, v, .2)
def zap(t, v=.3):
    d = .04; n = int(d * SR); add('sfx', t, bp(noise(d), 800, 6000) * np.exp(-tt(n) / .01) + np.sin(2 * np.pi * 120 * tt(n)) * .4, v, .1, room=.1)
def creakdoor(t, d=1.1, v=.35):
    n = int(d * SR); s = tt(n); f = 140 + 60 * np.sin(2 * np.pi * .8 * s); ph = 2 * np.pi * np.cumsum(f * (1 + .06 * np.repeat(rng.standard_normal(n // 160 + 1), 160)[:n])) / SR
    add('sfx', t, bp(sum(np.sin(k * ph) / k for k in range(1, 18)), 300, 2400) * np.sin(np.pi * s / d) ** .6 * .4, v, 0, room=.3)
def shutter(t, v=.4, pan=0.0):
    for k, dt in enumerate((0, .035)):
        d = .06; n = int(d * SR); s = tt(n); add('sfx', t + dt, hp(noise(d), 2500) * np.exp(-s / .002) * 1.2 + bp(noise(d), 1400, 5000) * np.exp(-s / .01) * .5, v * (1 if k else .8), pan, room=.2)
# ============ the cue sheet ============
impact(.0, .8, 1.2); crash(.0, .35); kick(.0, .6)
groove(.05, 2.75, .9); fill(2.75, 6, .5); impact(W_IKAW - .03, .65, 1.1); braam(W_IKAW - .05, .35, 2.0); crash(W_IKAW - .03, .3)
groove(W_IKAW + .2, 7.2, .85); fill(7.25, 6, .55); groove(7.25 + 2 * B, DOOR, .8)
crash(DOOR + .05, .5); kick(DOOR + .05, .6); impact(DOOR + .05, .6, 1.2); creakdoor(DOOR, 1.2, .4); whoosh(DOOR + .6, .9, .3, 200, 4000, 0, 0); crowd(DOOR + .2, 10.0, .45)
for f in FLASH: shutter(f, .45, float(jhash(f * 10)) - .5)
hum(0, 10.0, .12)
for n_ in range(int(W_NAMATAY * 30), int((W_NAMATAY + .55) * 30)):
    if jhash(n_) <= .45: zap(n_ / 30, .35)
# a footstep every time a foot lands (main.js: phase = (1 - z) / 0.72 * pi)
ts_ = np.arange(0, 9.45, .001); ph_ = (1 - np.array([zMe(x) for x in ts_])) / .72
for j in range(1, int(ph_[-1]) + 1):
    t_ = float(ts_[np.searchsorted(ph_, j)]); step(t_, .45 if t_ < 9.0 else .3, .1 * (1 if j % 2 else -1), .6, 0.0)
# ============ mix (the narrator on top, everything ducks under him) ============
def make_ir(dur, decay, damp, seed):
    r = np.random.default_rng(seed); n = int(dur * SR); s = tt(n); x = r.standard_normal(n) * np.exp(-s * 6.9 / decay)
    w = np.clip(s / (decay * .5), 0, 1); x = x * (1 - w) + lp(x, damp) * w; m = int(.002 * SR); x[:m] *= np.linspace(0, 1, m); return x / np.sqrt((x ** 2).sum())
IR = {('room', 0): make_ir(.6, .4, 4000, 1), ('room', 1): make_ir(.6, .4, 4000, 2), ('hall', 0): make_ir(2.4, 1.8, 2600, 3), ('hall', 1): make_ir(2.4, 1.8, 2600, 4)}
for b in BUS:
    for kind, wet in (('room', .5), ('hall', .6)):
        x = SEND[(b, kind)]
        if np.any(x):
            for ch in (0, 1): BUS[b][ch] += fconv(x, IR[(kind, ch)]) * wet
VO = np.zeros(N)
for l in TL['lines']:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, l['wav']), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, '<i2') / 32768; y = hp(y, 75); y = np.tanh(y / (np.abs(y).max() + 1e-9) * 1.7) / np.tanh(1.7) * .9; i = int(l['at'] * SR); n_ = min(len(y), N - i); VO[i:i + n_] += y[:n_]
LVL = {'mus': .22, 'sfx': .6, 'amb': .14, 'lng': .4}
for b, lv in LVL.items():
    pk = np.percentile(np.abs(BUS[b]), 99.7) + 1e-9; BUS[b] = np.tanh(BUS[b] / pk * 1.2) / np.tanh(1.2) * lv
def box(x, n): c = np.concatenate([[0.0], np.cumsum(x)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / n
env = np.clip(box(np.abs(VO), int(.08 * SR)) / .05, 0, 1); env = box(env, int(.25 * SR)); duck = 1 - env * (1 - 10 ** (-4 / 20)); duck_s = 1 - env * (1 - 10 ** (-2.5 / 20))
out = (BUS['mus'] + BUS['amb'] + BUS['lng']) * duck + BUS['sfx'] * duck_s + VO
n = int(10.0 * SR); out = out[:, :n] * fade(n, .003, .4); out = np.tanh(out / np.abs(out).max() * 1.3) / np.tanh(1.3) * .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype('<i2').tobytes())
