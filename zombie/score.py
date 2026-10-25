"""Sound for Zombie sa Mall -> out/mix.wav (48 kHz stereo). Cinematic sound design in numpy (the toolkit from ../tsunami and ../katok): a calm mall at
night (murmur, heels on marble, the fountain, soft music from the ceiling speakers), a string stinger on the scream, growls, a scuffle and the guard
hitting the floor, then the fire-alarm bell far down the hall with the red strobes, the stampede and the panic, fists and palms on the glass, a slam
and a held breath after every rule, a heartbeat in the quiet, the fire-door latch and the cool air of the stairwell, and a felt piano at the end.
Every time comes from timeline.json and the same story anchors shots.js uses. Usage: python3 score.py [en]"""
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
S_SCREAM, S_LUNGE, S_TURN2 = wt('l03', 'sumigaw'), wt('l04', 'sumunggab'), wx('l04', 'isa')
S_ALARM = T('l05') - .12; S_FLEE = S_ALARM + .3; S_JAM = T('l08')
C0 = T('l10') - .1; D_OPEN = E('l13') - 1.2                                   # the hero walks away; the fire door opens (as in shots.js)
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
def run_steps(t0, t1, v=.3, rate=3.2, pan=0.0):   # running on marble: a heel strike with a hard click on top of the thump
    t, k = t0, 0
    while t < t1:
        d = .14; n = int(d * SR); s = tt(n); y = lp(noise(d), 300) * np.exp(-s / .02) * 2 + hp(noise(d), 3000) * np.exp(-s / .003) * 1.1 + bp(noise(d), 1800, 7000) * np.exp(-s / .04) * .5
        add('sfx', t, y, v * rng.uniform(.6, 1), pan + (.15 if k % 2 else -.15), room=.06); t += 1 / rate * rng.uniform(.9, 1.1); k += 1
def murmur():                                       # a mall full of people talking (no words, just the room)
    d = N / SR; s = tt(N); out = []
    for ch in range(2):
        y = np.zeros(N)
        for k in range(9): y += bp(noise(d), 260 + 110 * k, 1100 + 260 * k) * (.55 + .45 * np.sin(2 * np.pi * (1.7 + .31 * k) * s + k * 1.3 + ch)) ** 2
        out.append(lp(y, 3000) * .22)
    return out
def heels():                                        # heels and soles on marble, all around
    y = [np.zeros(N), np.zeros(N)]; t = .05
    while t < N / SR - .1:
        d = .06; m = int(d * SR); s = tt(m); c = hp(noise(d), 2500) * np.exp(-s / .0025) * 1.2 + bp(noise(d), 1400, 4200) * np.exp(-s / .018) * .5
        p = rng.uniform(-.9, .9); i = int(t * SR); g = rng.uniform(.25, 1.0)
        y[0][i:i + m] += c * g * np.cos((p + 1) * np.pi / 4); y[1][i:i + m] += c * g * np.sin((p + 1) * np.pi / 4); t += rng.exponential(1 / 7)
    return y
def fountain():                                     # the fountain: water falling into still water, small bubbles
    d = N / SR; s = tt(N); out = []
    for ch in range(2): out.append(bp(noise(d), 700, 7000) * (.55 + .25 * np.sin(2 * np.pi * .37 * s + ch) + .2 * np.sin(2 * np.pi * 1.9 * s)) * .18)
    return out
def muzak():                                        # soft music from the ceiling speakers: an electric piano and a pad, band-limited like small speakers far away
    y = np.zeros(N); beat = 60 / 88; t, i = .0, 0; chords = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]]
    while t < N / SR - 2:
        ch = chords[(i // 8) % 4]; m = ch[[0, 2, 1, 3, 2, 1, 3, 2][i % 8]] + 12 * (i % 16 == 15)
        d = 1.6; n = int(d * SR); s = tt(n); f = m2f(m); trem = 1 + .25 * np.sin(2 * np.pi * 5.2 * s)
        note = (np.sin(2 * np.pi * f * s) + .35 * np.sin(2 * np.pi * 2 * f * s) + .08 * np.sin(2 * np.pi * 3.01 * f * s)) * np.exp(-s / .7) * trem
        j = int(t * SR); k = min(n, N - j); y[j:j + k] += note[:k] * .3
        if i % 8 == 0:
            d2 = beat * 8; n2 = int(d2 * SR); s2 = tt(n2); pd = sum(np.sin(2 * np.pi * m2f(q - 12) * s2 + q) for q in ch) * fade(n2, .4, .6) * .07; k = min(n2, N - j); y[j:j + k] += pd[:k]
        t += beat / 2; i += 1
    y = bp(y, 320, 3600); return [y, np.concatenate([np.zeros(int(.013 * SR)), y])[:N]]
def gasp(t, v=.5):                                  # a crowd catching its breath
    d = .7; n = int(d * SR); u = tt(n) / d; y = tvf(noise(d), 900 + 900 * u, .9) * np.minimum(1, u * 12) * np.exp(-u * 3.5)
    add('sfx', t, y, v, 0, hall=.5, width=.02)
def growl(t, d=1.2, v=.45, f0=72, pan=0.0):         # a throat that is not working right: a rough, jittering low voice through formants
    n = int(d * SR); s = tt(n); u = s / d
    jit = 1 + .07 * np.repeat(rng.standard_normal(n // 240 + 1), 240)[:n]
    f = f0 * (1 + .14 * np.sin(2 * np.pi * 3.1 * s)) * jit; ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(k * ph) / k for k in range(1, 26)) * (1 + .7 * np.repeat(rng.random(n // 90 + 1), 90)[:n])
    y = bp(y, 240, 880) + bp(y, 900, 1500) * .55 + bp(noise(d), 300, 2600) * .3
    add('sfx', t, sat(y * np.sin(np.pi * np.minimum(1, u * 1.15)) ** .7 * .55, 2.2), v, pan, room=.15, hall=.22)
def scuffle(t, v=.45):                              # bodies colliding, cloth, shoes on marble
    for k in range(5):
        d = .14; n = int(d * SR); s = tt(n); add('sfx', t + k * rng.uniform(.06, .13), lp(noise(d), 1300) * np.exp(-s / .03) * 1.6 + bp(noise(d), 2000, 7000) * np.exp(-s / .02) * .4, v * rng.uniform(.5, 1), rng.uniform(-.3, .3), room=.15)
def body_fall(t, v=.6):
    impact(t, v * .7, .6); d = .5; n = int(d * SR); add('sfx', t + .05, lp(noise(d), 900) * np.exp(-tt(n) / .08) * .9, v * .5, 0, room=.2)
def alarm_bell():                                   # the fire-alarm bell far down the hall: a striker hammering a gong ~19 times a second
    n1 = int(.3 * SR); s = tt(n1); f0 = 1040
    hit = sum(a * np.sin(2 * np.pi * f0 * r * s + r) * np.exp(-s / dc) for r, a, dc in ((1.0, 1.0, .3), (2.76, .5, .18), (5.4, .28, .1), (8.93, .15, .06)))
    hit = hit + hp(noise(.3), 3500) * np.exp(-s / .0015) * .4
    y = np.zeros(N + n1); t = .0
    while t < N / SR:
        i = int(t * SR); y[i:i + n1] += hit * rng.uniform(.8, 1.0); t += 1 / 19 * rng.uniform(.96, 1.04)
    return lp(bp(y[:N], 450, 7000), 3600) * .12
def panic():                                        # a crowd in panic: bright, ragged, with screams swelling up out of it (shaped noise, no tones)
    d = N / SR; s = tt(N); out = []
    for ch in range(2):
        z = np.zeros(N)
        for k in range(10): z += bp(noise(d), 380 + 160 * k, 1400 + 400 * k) * (.35 + .65 * np.abs(np.sin(2 * np.pi * (1.3 + .37 * k) * s + k + ch))) ** 2
        out.append(lp(z, 4600) * .2)
    sc = np.zeros(N); t = .2
    while t < d - 1.2:
        dd = rng.uniform(.5, 1.1); m = int(dd * SR); u = tt(m) / dd; fc = 1300 + 1700 * np.sin(np.pi * u) * rng.uniform(.6, 1.0)
        i = int(t * SR); sc[i:i + m] += tvf(noise(dd), fc, .32) * np.sin(np.pi * u) ** 1.5 * rng.uniform(.3, .8); t += rng.uniform(.2, .8)
    return [out[0] + sc * .8, out[1] + np.roll(sc, int(.011 * SR)) * .8]
def glass_bang(t, v=.4):                            # palms and fists on a glass door
    d = .25; n = int(d * SR); s = tt(n); add('sfx', t, lp(noise(d), 300) * np.exp(-s / .03) * 2 + bp(noise(d), 1800, 6000) * np.exp(-s / .05) * .35 * (1 + np.sin(2 * np.pi * 37 * s)), v, rng.uniform(-.5, .5), room=.2)
def latch(t, v=.6):                                 # a fire-door push bar: the bar, the bolt, the heavy door coming free
    d = .3; n = int(d * SR); s = tt(n)
    y = hp(noise(d), 3000) * np.exp(-s / .002) * 1.5 + np.sin(2 * np.pi * 820 * s) * np.exp(-s / .06) * .25 + np.sin(2 * np.pi * 1310 * s) * np.exp(-s / .04) * .15 + lp(noise(d), 400) * np.exp(-s / .05) * 1.2
    add('sfx', t, y, v, -.2, room=.25); add('sfx', t + .09, hp(noise(.05), 2500) * np.exp(-tt(int(.05 * SR)) / .004), v * .6, -.2, room=.2)
def cool_air(t, v=.35):                             # the stairwell breathing out: air, and a faint high shimmer of strip lights
    d = 2.2; n = int(d * SR); u = tt(n) / d; add('sfx', t, tvf(noise(d), 600 + 1800 * u, 1.2) * np.sin(np.pi * u) * .8, v, -.3, hall=.4); shimmer(t + .1, 2.0, .12)

# ============ the cue sheet ============
HUSH = []; DRY = np.zeros((2, N))
pre = lambda e: gate(e, T('l02'), S_ALARM)         # nothing panics before the alarm (the hook is a flash-forward to the jam)
ALARM_E = pre(shot_env({'rush': .75, 'loop': .75, 'well': 1.0, 'brain': .8, 'freeze': .35, 'crush': .8, 'noise': .6, 'r1': .35, 'r2': .14, 'r3': .06, 'exit': .1, 'real': .5, 'truth': .7, 'tip': .12}))
PANIC_E = pre(shot_env({'rush': 1.0, 'loop': .9, 'well': .9, 'brain': .9, 'freeze': .5, 'crush': 1.0, 'noise': .7, 'r1': .4, 'r2': .22, 'r3': .08, 'exit': .16, 'real': .5, 'truth': .75, 'tip': .2}))
PANIC_E = gate(PANIC_E, S_ALARM, S_FLEE - .1, 0.0)
MURMUR_E = shot_env({'atrium': 1.0, 'scream': 1.0, 'lunge': .15, 'comment': .85, 'cta': .85})
MURMUR_E = MURMUR_E * np.clip(1 - (tt(N) - S_SCREAM) / 1.2 * ((tt(N) > S_SCREAM) & (tt(N) < T('l05'))), .15, 1)
MUZAK_E = gate(shot_env({'atrium': 1.0, 'scream': 1.0, 'lunge': 1.0, 'comment': .8, 'cta': .8}), S_ALARM, T('l06'))
bell = alarm_bell() * ALARM_E; add('amb', 0, bell, 1.0, .25, hall=.55, width=.01); add('amb', .021, bell, .55, -.5, hall=.4)
bed_add('amb', panic(), PANIC_E, .8)
bed_add('amb', murmur(), MURMUR_E, .5); bed_add('amb', heels(), MURMUR_E, .35); bed_add('amb', fountain(), MURMUR_E, .35); bed_add('amb', muzak(), MUZAK_E, .55)
wind(0, DUR, .04)
# the hook: a hit on frame 1, the crush already on, fists on the glass, a low drone; the cut to the calm mall is a hard cut
impact(.04, .85, 1.3); sub_drop(.04, .6, 1.8); braam(.06, .55); drone(0, T('l02') + .1, .2, 36, .45, .006)
t_ = .15
while t_ < T('l02') - .1: glass_bang(t_, .3); t_ += rng.uniform(.2, .45)
growl(.5, 1.3, .22, 66, .3)
# the scream (a screech of strings and a gasp), the music in the speakers keeps going; growls; the guard goes down; the second one
stinger(S_SCREAM, .8); gasp(S_SCREAM + .15, .45); growl(S_SCREAM - .4, 1.0, .3, 64, -.3)
drone(S_SCREAM, T('l10'), .2, 33, .5, .007)
growl(S_LUNGE - .05, .9, .55, 84, -.4); scuffle(S_LUNGE + .08, .45); body_fall(S_LUNGE + .5, .6)
growl(S_TURN2 - .1, 1.3, .45, 70, .4); scuffle(S_TURN2 + .05, .35); body_fall(S_TURN2 + .45, .45); reverse_swell(S_ALARM - .02, 1.2, .4)
# the alarm: the bell starts, a hit and a brass swell with the first red flash
impact(S_ALARM, .9, 1.4); sub_drop(S_ALARM, .7, 2.4); braam(S_ALARM + .02, .6, 3.0); gasp(S_ALARM + .25, .5); HUSH.append((S_ALARM + .08, S_ALARM + .4))
# the stampede: feet everywhere, a driving pulse under it
for k in range(4): run_steps(S_FLEE, T('l10'), .3 * (1 - .15 * k), 3.2 + .45 * k, -.6 + .4 * k)
bass_pulse(S_FLEE + .4, T('l10') - .2, 104, [38, 38, 41, 36], .22)
for l in TL['lines']:
    if l.get('stat'): whoosh(l['t0'] + .2, .3, .14, 1500, 9000, .3, -.3); sub_drop(l['t0'] + .1, .25, .7)
for i, (a, b, shot) in enumerate(SHOTS):
    if i and shot not in ('loop', 'lunge', 'r1', 'r2', 'r3'): whoosh(a, .45, .16, p0=(-.6 if i % 2 else .6), p1=(.6 if i % 2 else -.6))
# 3 in 4 freeze: the room goes far away, a heartbeat
HUSH.append((T('l07') + .2, E('l07')))
t_, p_ = T('l07') + .1, .8
while t_ < E('l07'): heartbeat(t_, .5); t_ += p_; p_ = max(.55, p_ * .97)
# the doors jam: fists on glass, bodies going down
t_ = S_JAM + .1
while t_ < E('l09'): glass_bang(t_, at_(ALARM_E, t_) * .4 + .1); t_ += rng.uniform(.18, .45)
for k in range(3): body_fall(S_JAM + .5 + k * .8 + rng.uniform(0, .3), .35)
# the noise draws them: growls from everywhere, shuffling feet
for k in range(5): growl(T('l09') + .2 + k * .55, rng.uniform(.9, 1.4), .38, rng.uniform(58, 80), rng.uniform(-.8, .8))
step_t = T('l09')
while step_t < E('l09'): step(step_t, .12, rng.uniform(-.7, .7), .6, .2); step_t += rng.uniform(.25, .5)
# the rules: every card slams in, then a held breath
for id in ('l10', 'l11', 'l12'):
    impact(T(id), .85, 1.0); sub_drop(T(id), .5, 1.0); whoosh(T(id) - .05, .35, .25, 300, 6000, -.4, .4); HUSH.append((T(id) + .15, T(id) + .85))
braam(T('l10') + .02, .45)
run_steps(C0 + .1, C0 + 2.5, .2, 2.6, .1)                                   # walking away, quick
for k in range(5): step(T('l11') + .3 + k * .55, .1, .1, .2, 0)            # steps in the concrete corridor
HUSH.append((T('l12') + .2, E('l12') + .1))                                # stay quiet: almost nothing, a heartbeat, one of them breathing
t_, p_ = T('l12') + .25, .62
while t_ < E('l12'): heartbeat(t_, .42); t_ += p_
growl(T('l12') + .7, 1.6, .16, 60, .4); growl(T('l12') + 2.3, 1.2, .13, 57, .4)
for k in range(5): step(T('l12') + .35 + k * .6, .07, -.2, 0, 0)          # careful steps
# the door nobody is looking at: running feet, the bar, the bolt, cool air; the music lifts and opens
run_steps(T('l13') + .1, D_OPEN, .32, 3.0, -.1); riser(D_OPEN, 1.6, .35)
latch(D_OPEN, .7); cool_air(D_OPEN + .08, .4); impact(D_OPEN + .02, .4, .8)
pad(D_OPEN - .1, E('l13') + 1.2, [50, 57, 62, 66], .16)
# zombies aren't real; the same crowd, the same mistake: a low drone and a felt piano
drone(T('l14'), T('l17'), .18, 31, .3, .004); piano(T('l14') + .05, 50, .32, 4.5); piano(T('l14') + .05, 38, .26, 5.0)
motif(T('l15') + .2, T('l17') - .3, .18)
t_, p_ = T('l15') + .1, 1.05
while t_ < E('l15'): heartbeat(t_, .3); t_ += p_
# back to the calm night: comment, share; then the crush comes back for the loop into frame 1
pad(T('l17') - .2, T('tail') + .2, [45, 52, 57, 60], .12); piano(T('l18'), 57, .22, 3.5)
t_ = T('tail') + .2
while t_ < DUR - .1: glass_bang(t_, .22); t_ += rng.uniform(.25, .5)
reverse_swell(DUR, 1.3, .45); riser(DUR, 1.6, .3)
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
LVL = {'mus': .4, 'sfx': .62, 'amb': .42}
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
