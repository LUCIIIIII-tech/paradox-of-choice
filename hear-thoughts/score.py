"""Sound for What If You Could Hear Everyone's Thoughts? -> out/mix.wav (48 kHz stereo). Cinematic sound design in numpy (the toolkit
from ../puyat and ../huling-tren): designed whooshes, layered impacts, sub drops, risers that cut dead before the hit, reverse swells,
a braam, glassy shimmers, a felt piano, warm pads; and foley for this story: a dawn bedroom, a kitchen (a pan sizzling, a kettle,
a wall clock), a subway car (rumble, clack-clack, doors), winter wind, an office (keyboards, air conditioning), a café (a room of
voices, cups), a park (birds, wind), an evening platform (a station hum, a train arriving, its horn), crickets and a fridge at night,
a city at midnight. The crowd of other people's thoughts is the narrator's own lines turned into whispers, panned all around you.
The thoughts you hear clearly are the narrator too, but thinner, wider and wet, as if inside your head.
Every time comes from timeline.json (and the same formulas main.js uses), so the sound follows the picture and the narrator.
Usage: python3 score.py [en|tl]"""
import os, sys, json, wave, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
LANG = sys.argv[1] if len(sys.argv) > 1 else 'en'; SUF = '' if LANG == 'tl' else '.' + LANG
VDIR = 'voices' if LANG == 'tl' else 'voices_' + LANG
TL = json.load(open(os.path.join(HERE, f'timeline{SUF}.json'), encoding='utf-8')); DUR = TL['dur']; N = int(SR * DUR) + SR
ANCH = json.load(open(os.path.join(HERE, 'anchors.tl.json'))) if LANG == 'tl' and os.path.exists(os.path.join(HERE, 'anchors.tl.json')) else {}
LN = {l['id']: l for l in TL['lines']}
rng = np.random.default_rng(11)
BUS = {k: np.zeros((2, N), np.float32) for k in ('mus', 'sfx', 'amb')}
SEND = {(b, k): np.zeros(N, np.float32) for b in BUS for k in ('room', 'hall')}
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
def nrm(s): return ''.join(c for c in s.lower() if c.isalnum() or c in "'ñ")
def wt(id, w):
    w = ANCH.get(f'{id}:{w}', w); l = LN[id]
    for x in l.get('words', []):
        if nrm(x[0]).startswith(nrm(w)): return x[1]
    return l['t0']
T = lambda id: LN[id]['t0']; E = lambda id: LN[id]['t1']; SPAN = lambda id: E(id) - T(id)
SHOTS = []
for i, l in enumerate(TL['lines']):
    end = TL['lines'][i + 1]['t0'] if i < len(TL['lines']) - 1 else DUR
    if i and l['shot'] == TL['lines'][i - 1]['shot']: SHOTS[-1][1] = end; continue
    SHOTS.append([SHOTS[-1][1] if i else 0, end, l['shot']])
def shot_ranges(name): return [(a, b) for a, b, s in SHOTS if s == name]
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
def whisper_at(id, t, skip=0.0, v=.3, pan=-.85, rate=.88, reverse=False, dur=None):   # a whisper of the narrator's line from `skip` s in
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, id + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).astype(float)[max(0, int(skip * SR)):]; y = np.interp(np.arange(0, len(y) - 1, rate), np.arange(len(y)), y)
    n, hop = 1024, 256; win = np.hanning(n); out = np.zeros(len(y) + n); ws = np.zeros(len(y) + n)
    for i in range(0, len(y) - n, hop): F = np.fft.rfft(y[i:i + n] * win); out[i:i + n] += np.fft.irfft(np.abs(F) * np.exp(1j * rng.uniform(0, 2 * np.pi, len(F))), n) * win; ws[i:i + n] += win ** 2
    w = hp(out[:len(y)] / np.maximum(ws[:len(y)], 1e-6), 700); w = w / (np.abs(w).max() + 1e-9)
    if reverse: w = w[::-1]
    if dur: w = w[:int(dur * SR)] * fade(min(len(w), int(dur * SR)), .05, .2)
    add('sfx', t, w, v, pan, room=.35, hall=.3)
def clack(t, v=.3):                                  # a wheel over a rail joint
    d = .12; n = int(d * SR); s = tt(n)
    add('amb', t, lp(noise(d), 900) * np.exp(-s / .018) * 2 + np.sin(2 * np.pi * 140 * s) * np.exp(-s / .03) * .5 + bp(noise(d), 1500, 5000) * np.exp(-s / .006) * .4, v, rng.uniform(-.3, .3), room=.1)
def train_bed(t0, t1, v=.3):                         # inside a subway car: low rumble, a motor whine, clack-clack over the joints
    d = t1 - t0; n = int(d * SR); s = tt(n)
    y = lp(noise(d), 160) * 1.5 + bp(noise(d), 300, 1400) * .25 * (1 + .3 * np.sin(2 * np.pi * .4 * s)) + np.sin(2 * np.pi * (520 + 30 * np.sin(2 * np.pi * .2 * s)) * s) * .03
    add('amb', t0, y * fade(n, .3, .3), v, 0, width=.012)
    t = t0 + .2
    while t < t1:
        for dt in (0, .11, .62, .73):
            if t + dt < t1: clack(t + dt, v * .9)
        t += 1.05
def door_hiss(t, v=.45):                             # a subway door: pneumatic hiss, the slide, the stop
    d = .9; n = int(d * SR); s = tt(n)
    add('sfx', t, tvf(noise(d), 5200 * np.exp(-s * 1.8) + 900, 1.2) * np.exp(-s / .35) * 1.4, v, 0, room=.15)
    for sg in (-1, 1): add('sfx', t + .05, lp(noise(.6), 500) * np.sin(np.pi * tt(int(.6 * SR)) / .6) * .8, v * .6, sg * .6)
    k = int(.25 * SR); add('sfx', t + .66, lp(noise(.25), 400) * np.exp(-tt(k) / .03) * 2 + np.sin(2 * np.pi * 110 * tt(k)) * np.exp(-tt(k) / .05), v, 0, room=.2)
def siren(t0, t1, v=.25, pan=.5, rate=.32, dist=1.0):   # a wailing siren, far away
    n = int((t1 - t0) * SR); s = tt(n); f = 650 + 650 * np.sin(np.pi * rate * s) ** 2; ph = 2 * np.pi * np.cumsum(f) / SR
    y = lp(sum(np.sin(k * ph) / k for k in range(1, 6)), 2600 / dist)
    add('amb', t0, y * fade(n, .4, .4) * .5, v, pan, hall=.4 * dist)
def wind(t0, t1, v=.12):
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, bp(noise(d), 150, 900) * (.6 + .4 * np.sin(2 * np.pi * .21 * s) ** 2) * fade(n, .6, .6), v, .3, width=.02)
def crickets(t0, t1, v=.06):
    t = t0
    while t < t1:
        for k in range(3): m = int(.03 * SR); add('amb', t + k * .05, np.sin(2 * np.pi * 4700 * tt(m)) * np.hanning(m), v, .5)
        t += .5 + .2 * rng.random()
def owl(t, v=.15):
    for k, dt in enumerate((0, .5, .7)): d = .35 if k == 0 else .18; n = int(d * SR); s = tt(n); add('amb', t + dt, np.sin(2 * np.pi * (390 - 20 * s / d) * s) * np.sin(np.pi * s / d) ** 2 * .6, v, -.6, hall=.6)

# ---------- sounds for this story ----------
VOICED = [l['id'] for l in TL['lines'] if 'wav0' in l and l.get('fx') != 'thought']
def crowd_whispers(t0, t1, n, v=.08, spread=1.0, dmin=1.0, dmax=2.4, rev=.25):   # the crowd of other people's thoughts
    for k in range(n):
        id_ = VOICED[int(rng.integers(0, len(VOICED)))]; t = t0 + (t1 - t0) * (k + rng.random()) / max(1, n)
        whisper_at(id_, t, rng.uniform(0, max(.01, SPAN(id_) - dmax)), v * rng.uniform(.5, 1), rng.uniform(-spread, spread), rng.uniform(.82, 1.05), rng.random() < rev, rng.uniform(dmin, dmax))
def motif_major(t0, t1, v=.2):                     # the warm felt-piano arpeggio (C - Am - F - G)
    bars = [[60, 67, 64, 67], [57, 64, 60, 64], [53, 60, 57, 60], [55, 62, 59, 62]]; q = .62; t, i = t0, 0
    while t < t1:
        b = bars[(i // 4) % 4]; piano(t, b[i % 4], v * (1.1 if i % 4 == 0 else .85), 3.0, .25 * np.sin(i))
        if i % 4 == 0: piano(t, b[0] - 24, v * .7, 4.0)
        t += q; i += 1
def puff(t, v=.08, pan=0.0):                        # a thought appearing: a soft breath of air with a little body
    d = .28; n = int(d * SR); u = tt(n) / d
    add('sfx', t - .08, tvf(noise(d), 700 + 2200 * u, 1.2) * np.sin(np.pi * u) ** 2 + np.sin(2 * np.pi * 95 * tt(n)) * np.exp(-tt(n) / .05) * (u > .3) * .4, v, pan, room=.15, hall=.12)
def sizzle(t0, t1, v=.1):                           # a pan of eggs frying
    d = t1 - t0; n = int(d * SR); bed = hp(noise(d), 2500) * .25; imp = np.zeros(n); m = int(d * 60); np.add.at(imp, rng.integers(0, n, m), rng.uniform(.2, 1, m) ** 3)
    k = int(.004 * SR); add('amb', t0, (bed + fconv(imp, hp(noise(.004), 3000) * np.exp(-tt(k) / .0008)) * .9) * fade(n, .4, .4), v, .45, room=.08)
def splash(t, v=.5):                                # coffee hitting a shirt
    d = .5; n = int(d * SR); s = tt(n); y = tvf(noise(d), 1800 * np.exp(-s * 3) + 400, 1.3) * np.exp(-s / .12) * 2
    add('sfx', t, y, v, .1, room=.12); bubbles(t + .05, t + .35, v * .5, 30)
def office_bed(t0, t1, v=.12):                      # air conditioning, keyboards across the room, a printer far away
    d = t1 - t0; n = int(d * SR); s = tt(n); add('amb', t0, (lp(noise(d), 300) * 1.2 + bp(noise(d), 1500, 5000) * .05) * fade(n, .4, .4), v, 0, width=.02)
    t = t0 + .5
    while t < t1 - 1: typing(t, min(t1, t + rng.uniform(.8, 2.0)), .05); t += rng.uniform(2.5, 5.0)
def cafe_bed(t0, t1, v=.14):                        # a room of voices, cups and spoons
    crowd(t0, t1, v * 1.3); t = t0 + rng.uniform(.5, 2)
    while t < t1 - .5:
        (glass_clink if rng.random() < .4 else mug_down)(t, v * .5); t += rng.uniform(2.0, 5.0)
def station_bed(t0, t1, v=.16):                     # a station: hum, a tunnel breathing, a far-off train
    d = t1 - t0; n = int(d * SR); s = tt(n)
    add('amb', t0, (lp(noise(d), 120) * 1.6 * (1 + .4 * np.sin(2 * np.pi * .05 * s)) + bp(noise(d), 300, 1200) * .15) * fade(n, .5, .5), v, 0, hall=.2, width=.03)
    hum(t0, t1, v * .25, 50)
def train_arrive(t, v=.6):                          # the train bursts out of the tunnel: rumble, horn, a wall of air
    d = 3.2; n = int(d * SR); s = tt(n); u = s / d; env = np.exp(-((u - .55) / .22) ** 2)
    add2('sfx', t - d * .55, *[lp(noise(d), 300 + 2500 * env) * env * 2.0 for _ in (0, 1)], v * .8, hall=.15)
    truck_horn(t - .9, 1.4, v * .7); whoosh(t + .1, 1.4, v * .8, 120, 3000, -.9, .9, 1.4)
    for k in range(14): clack(t + k * .09, v * .5)
def thunder(t, v=.4):
    d = 3.0; n = int(d * SR); s = tt(n); y = lp(noise(d), 180) * (np.exp(-s / .9) * (1 + .6 * np.sin(2 * np.pi * 3 * s) ** 2)) * 2 + hp(noise(d), 1500) * np.exp(-s / .06) * .5
    add('sfx', t, sat(y, 1.3), v, .3, hall=.4, width=.02)
def bell(t, m=50, v=.3):                            # a big clock bell far away (inharmonic partials, a long tail)
    f0 = m2f(m); d = 6.0; n = int(d * SR); s = tt(n)
    y = sum(np.sin(2 * np.pi * f0 * r * s + k) * a * np.exp(-s / dd) for k, (r, a, dd) in enumerate(((.5, .6, 4.0), (1, 1, 3.0), (1.19, .5, 2.2), (1.5, .35, 1.8), (2.0, .4, 1.3), (2.51, .2, 1.0), (3.0, .15, .8))))
    add('mus', t, y * np.minimum(1, s / .004) * .3, v, 0, hall=.7, width=.015)
def coin_flip(t0, t1, v=.3):                        # the flick, the spin ringing, the landing
    d = .3; n = int(d * SR); s = tt(n)
    add('sfx', t0, hp(noise(d), 3000) * np.exp(-s / .003) + sum(np.sin(2 * np.pi * f * s) * np.exp(-s / .25) * a for f, a in ((4200, .4), (6900, .25))), v, 0, room=.2)
    d = max(.2, t1 - t0); n = int(d * SR); s = tt(n)
    add('sfx', t0, np.sin(2 * np.pi * 5200 * s) * (.5 + .5 * np.sin(2 * np.pi * (14 - 8 * s / d) * s)) * np.exp(-s / (d * .8)) * .12, v, 0, hall=.2)
    d = .6; n = int(d * SR); s = tt(n)
    add('sfx', t1, (hp(noise(d), 2500) * np.exp(-s / .004) + sum(np.sin(2 * np.pi * f * s) * np.exp(-s / .3) * a for f, a in ((3800, .5), (5600, .3), (8100, .15)))) * .6, v, 0, room=.25)

# ============ the cue sheet ============
HUSH = []                                            # windows where the bed drops away (breath held)
# --- every cut: a whoosh that alternates direction; time cards: the hands spin and settle; stat cards: an air swish + a thump
for i, (a, b, shot) in enumerate(SHOTS):
    if i == 0 or shot == 'title': continue
    whoosh(a, .5, .2, p0=(-.7 if i % 2 else .7), p1=(.7 if i % 2 else -.7))
for l in TL['lines']:
    if l.get('clock'): whoosh(l['t0'] + .12, .4, .18, 900, 8000, -.3, .3); clock(l['t0'] + .05, l['t0'] + 1.25, .12, .2, 1.0); impact(l['t0'] + 1.3, .22, .45); shimmer(l['t0'] + 1.15, 1.2, .07)
    if l.get('stat'): whoosh(l['t0'] + .2, .3, .12, 1500, 9000, .3, -.3); sub_drop(l['t0'] + .1, .25, .7)
NOPUNCH = ('quiz', 'title', 'montage', 'outro', 'scroll', 'gap', 'breathe', 'inner', 'intrusive', 'kitchen', 'mom')
for l in TL['lines']:
    if l.get('words') and l['t1'] - l['t0'] > 2.6 and l['shot'] not in NOPUNCH: whoosh(l['words'][len(l['words']) // 2][1] + .2, .35, .05, 600, 7000, 0, 0)
# --- countdowns: a clock tick every second, a heartbeat between, the last second louder; a hit when time is up
for l in TL['lines']:
    if not l.get('count'): continue
    for k in range(int(round(l['t1'] - l['t0']))): tick(l['t0'] + k, .5 if k < l['count'] - 1 else .7, 1.0 if k % 2 == 0 else .85, 0); heartbeat(l['t0'] + k + .5, .2 + .25 * k / max(1, l['count'] - 1))
    riser(l['t1'], min(2.0, l['t1'] - l['t0']), .22); impact(l['t1'], .55, .8); sub_drop(l['t1'], .4)
# --- the quiz: the question lands, a pulse under the question and the countdown, the answer opens up
for q in [l for l in TL['lines'] if l.get('q')]:
    i = TL['lines'].index(q); cd = next((x for x in TL['lines'][i + 1:i + 3] if x.get('count')), None); rv = next((x for x in TL['lines'][i + 1:i + 4] if 'reveal' in x), None)
    end = cd['t1'] if cd else q['t1']
    reverse_swell(q['t0'], .7, .25); impact(q['t0'], .45, .7); bass_pulse(q['t0'] + .1, end, 112, [38, 38, 41, 36], .16); pad(q['t0'] - .2, end + .3, [50, 57, 62], .06)
    for k in range(len(q['q'])): puff(q['t0'] + .6 + k * .2, .06, (k - 1) * .5)
    if rv and q.get('ans', -1) >= 0: shimmer(rv['t0'] + .1, 1.8, .2); whoosh(rv['t0'] + .1, .4, .14, 1200, 9000, 0, 0); pad(rv['t0'], next(b for a, b in shot_ranges('quiz') if a <= rv['t0'] < b) + .3, [48, 55, 60, 64], .08)
# --- 1. the cold open: dawn; something is wrong; a voice, another, hundreds; your name
hum(0, T('title'), .03, 50); drone(0, T('title') + .5, .18, 38, .25, .003); birds(0, T('c05'), .04)
TWR = wt('c01', 'wrong'); impact(TWR, .55, .8); sub_drop(TWR, .5); reverse_swell(TWR, .8, .25); HUSH.append((TWR + .05, TWR + .9))
TV1, TA1, TH1 = wt('c02', 'voice'), wt('c02', 'another'), wt('c02', 'hundreds')
whisper_at('c05', TV1 - .05, .3, .16, .7, .95, False, 1.3); whisper_at('c06', TA1 - .05, .5, .16, -.7, .95, False, 1.3)
riser(TH1, .9, .25); impact(TH1, .5, .7); crowd_whispers(TH1 - .1, T('c03') - .3, 30, .07)
TNM = wt('c02b', 'name'); reverse_swell(TNM, .7, .3); shimmer(TNM, 1.6, .12); HUSH.append((TNM - .05, TNM + 1.1))
clock(T('c03') - .3, E('c03') + .3, 1.0, .1)
TTH = wt('c04', "They're"); crowd_whispers(T('c04') - .2, E('c04') + .2, 34, .07); impact(TTH, .4, .6); shimmer(TTH + .1, 1.4, .12); tick(wt('c04', 'midnight'), .3, .9, 0)
# --- 2. the promise: the city waking; a locked secret; play along
city(T('c05') - .2, T('title') + 3, .09); wind(T('c05'), T('title') + 3, .05); pad(T('c05') - .2, T('title'), [50, 57, 62, 65], .1)
TSE = wt('c05', 'secret'); braam(TSE, .22, 1.8); shimmer(TSE + .2, 1.6, .14); sub_drop(wt('c05', 'forever'), .3)
TTI = wt('c06', 'timer')
for k in range(5): tick(TTI + k * .7, .28, 1.0 if k % 2 == 0 else .85, 0)
TPO = wt('c06', 'point'); shimmer(TPO, 1.2, .14); impact(TPO, .3, .5)
# --- 3. the title, inside a thought
riser(T('title'), 1.4, .4); reverse_swell(T('title'), 1.0, .3); impact(T('title'), 1.0, 1.2); sub_drop(T('title'), .8); braam(T('title'), .5); shimmer(T('title') + .3, 2.2, .2)
crowd_whispers(T('title') + .2, E('title'), 12, .05)
# --- 4. 7 AM, the kitchen: eggs in the pan, the wall clock, birds; mom's worries pile up
for a, b in shot_ranges('kitchen'):
    motif_major(a, b + .3, .13); sizzle(a, b, .08); clock(a, b, 1.0, .07); birds(a, b, .04)
    for k in range(4): step(a + .15 + k * .42, .18, (-1) ** k * .1, 0, 0)
for k in range(4): puff(LN['h02']['words'][0][1] + k * 1.1, .06, .4)
TLO = wt('h03', 'loud'); crowd_whispers(TLO - .2, E('h03') + .3, 14, .07, .7); riser(E('h03') + .2, 1.0, .22)
# --- 5. 8 AM, the train: the doors close; a wall of noise; one thought is about you; minds drifting; a coin
for a, b in ((T('t01'), T('wb1')), (T('t03b'), T('s01'))): train_bed(a - .1, b + .1, .2)
motif(T('t01'), T('wb1') - .2, .1); door_hiss(wt('t01', 'close') - .1, .4)
TNO = wt('t03', 'noise'); TSL = wt('t03', 'slowly'); crowd_whispers(T('t02') + .5, TSL, 44, .08); riser(TNO, 1.2, .3); impact(TNO, .5, .8); HUSH.append((wt('t03', 'strange') - .2, E('t03') + .4))
for k in range(6): puff(T('t02') + .2 + k * 1.2, .05, (-1) ** k * .5)
crowd_whispers(T('t03b'), E('t03b'), 16, .05); shimmer(T('t03c'), 1.4, .14)
TMO = wt('t03d', 'Most'); crowd_whispers(TMO, E('t03d') + .5, 8, .04, .8); pad(TMO - .2, E('t03d') + .6, [53, 60, 64, 69], .08)
pad(T('t04'), E('t05') + .3, [53, 60, 64, 69], .09); shimmer(T('t04') + .5, 2, .1)
for k in range(5): puff(T('t04') + .4 + k * .35, .06, (k - 2) * .4)
TFF, TST5, TGO = wt('t05', 'fifty'), wt('t05', 'Still'), wt('t05', 'Good'); coin_flip(TFF, TST5 + .2, .3); impact(TGO, .3, .5); shimmer(TGO, 1.2, .15)
# --- 6. the white bear: winter wind, a cold pad; it comes back, again and again
for a, b in shot_ranges('bear'): wind(a - .2, b + .2, .14); pad(a, b + .3, [45, 52, 57, 64], .09)
TB2 = T('wb2'); braam(TB2, .3, 2.0); impact(TB2, .5, .8); shimmer(TB2 + .3, 1.6, .12)
TPU = wt('wb3', 'push'); B1_ = shot_ranges('bear')[0][1]
for i in range(9):
    for m in range(-2, 12):
        tp = TPU - i * .53 + m * 1.6
        if TPU <= tp < B1_: puff(tp, .05, rng.uniform(-.7, .7))
# --- 7. 9 AM: you walk into work... coffee everywhere; your heart drops; everyone will judge you
S0, S1 = shot_ranges('stain')[0]; O0, O1 = shot_ranges('office')[0]
office_bed(S0 - .1, O1 + .2, .12)
for k in range(5): step(S0 + .15 + k * .45, .2, (-1) ** k * .1, .1, 0)
TSP = wt('s01', 'spill'); splash(TSP + .05, .55); impact(TSP, .35, .5)
TDR = wt('s02', 'drops'); sub_drop(TDR, .6, 1.5); heartbeat(TDR + .2, .55); heartbeat(TDR + 1.1, .55)
TEV = wt('s02', 'Everyone'); drone(TEV - .3, O0 + .3, .22, 37, .4, .006); riser(O0, O0 - TEV + .1, .25); crowd_whispers(TEV, O0 - .1, 16, .06)
impact(wt('s02', 'judge'), .6, .9)
motif_major(O0 + .2, O1 + .3, .1); shimmer(wt('s04', 'Nobody'), 1.4, .14); HUSH.append((T('s04') - .05, T('s04') + .9))
for k in range(4): puff(LN['s03']['words'][0][1] + k * 1.3, .05, (k - 1.5) * .4)
puff(T('s04b'), .06, .5); sub_drop(T('s04b'), .25)
# --- 8. noon, the café: a room of voices; am I boring them? They think the same
for a, b in shot_ranges('lunch') + shot_ranges('gap'): cafe_bed(a - .1, b + .1, .13)
L0 = shot_ranges('lunch')[0][0]; G1 = shot_ranges('gap')[0][1]; pad(L0, G1 + .3, [53, 57, 60, 64], .08)
for k, m in enumerate([72, 76, 79, 77, 72, 74, 76, 69] * 6):
    tp = L0 + .3 + k * 1.24
    if tp < G1: piano(tp, m, .09, 3.0, .3 * np.sin(k))
TPA = wt('l01', 'panic'); reverse_swell(TPA, .6, .25); heartbeat(TPA + .2, .4); puff(wt('l01', 'Am'), .06, -.4); puff(T('l02'), .06, .4)
TSA = wt('l03', 'same'); shimmer(TSA, 1.6, .18); impact(TSA, .3, .5)
shimmer(wt('l04', 'liking') + .4, 1.6, .15); shimmer(T('l05') + .3, 2.0, .12)
# --- 9. 3 PM, the park: birds, a breeze, footsteps getting closer; their heart racing too; hi
for a, b in shot_ranges('crush'): birds(a, b, .06); wind(a, b, .05); pad(a, b + .3, [53, 57, 60, 65], .09)
R0 = T('r01')
for k in range(int(SPAN('r01') / .5)): step(R0 + .3 + k * .5, .06 + .18 * k / max(1, SPAN('r01') / .5), (-1) ** k * .08, 0, 0)
for k in range(3): heartbeat(T('r02') + .3 + k * .75, .35)
TNV = wt('r03', 'nervous'); shimmer(TNV, 1.6, .16); impact(TNV, .35, .5)
for w in ('written', 'barely'): whoosh(wt('r03', w), .4, .1, 700, 6000, 0, 0)
TKN = wt('r04', 'know'); shimmer(TKN, 2.2, .18); pad(TKN - .3, E('r04') + 1.0, [53, 60, 64, 69, 72], .1)
# --- 10. 6 PM, the platform: the hum of a station; a thought that turns your blood cold; the train arrives
P0, P1 = shot_ranges('platform')[0]; station_bed(P0 - .1, P1 + .3, .17)
TCO = wt('d01', 'cold'); reverse_swell(TCO, .8, .3); drone(TCO, T('d06') + .4, .24, 36, .45, .006)
reverse_swell(T('d02'), .9, .35); sub_drop(T('d02'), .45, 1.6)
k = 0
while T('d02') + .3 + k * .72 < wt('d03', 'stops'): heartbeat(T('d02') + .3 + k * .72, .5); k += 1
TSTP = wt('d03', 'stops'); impact(TSTP, .5, .8); HUSH.append((TSTP + .1, T('d04') + .1)); whoosh(wt('d03', 'turn') + .35, .6, .25, 200, 3000, -.6, .6)
reverse_swell(wt('d04', 'horrified'), .8, .25)
train_arrive(E('d05') - .1, .6)
# --- 11. intrusive thoughts: a storm cloud on the brain; 94 in 100; your mind proving you're not
thunder(wt('d06', 'intrusive') - .1, .35); TPP = wt('d06', 'pops')
for k in range(5): puff(TPP + k * .12, .05, .4)
TNI = wt('d07', 'ninety')
for k in range(12): tick(TNI + k * .1, .18, 1.2, .3)
impact(TNI + 1.2, .3, .5); TPR = wt('d07', 'Being'); pad(TPR, shot_ranges('intrusive')[0][1] + .3, [50, 57, 62, 66], .1); shimmer(TPR + .3, 2.0, .14)
# --- 12. 10 PM: home, alone; the noise gone; the phone; inner voices; breathing
N0 = T('n01'); crickets(N0, T('m01'), .04); hum(N0, T('m01'), .025, 60); pad(N0, T('m01'), [45, 52, 57, 60], .07)
TNG = wt('n01', 'noise'); crowd_whispers(N0, TNG + .3, 10, .05); HUSH.append((TNG + .3, E('n01') + .3)); shimmer(wt('n01', 'own'), 1.8, .1)
for a, b in shot_ranges('scroll'):
    t_ = a + .4
    while t_ < b - .3: paper_slide(t_, .35, .06); t_ += 1.3
TBE = wt('n01b', 'behind'); crowd_whispers(TBE - .1, T('n01c'), 10, .06, .8); sub_drop(wt('n01c', 'lose'), .4)
shimmer(wt('n02', 'Not'), 1.6, .1); shimmer(wt('n02', 'pictures'), 1.6, .12)
TMA = wt('n03', 'manually')
for k in range(4): breath(TMA - .6 + k * 1.6, 1.4, .18 if k % 2 == 0 else .14)
piano(wt('n03', 'welcome'), 84, .1, 2.0, .3)
# --- 13. midnight: the voices fade; the last thought from every side; the secret; everyone; say the thing; the bell
M0 = T('m01'); city(M0, DUR, .07); wind(M0, DUR, .05)
TFA = wt('m01', 'fade'); crowd_whispers(M0, TFA + .6, 18, .06); TLA = wt('m01', 'last'); riser(T('m02'), max(.6, T('m02') - TLA), .25)
for k in range(10): whisper_at('m02', TLA + .3 + k * .12, 0, .05, (1 if k % 2 else -1) * (1 - k / 10), .9, False, 2.5)
pad(T('m02') - .3, DUR, [48, 55, 60, 64], .1)
TSC = wt('m03', 'secret'); impact(TSC, .5, .8); shimmer(TSC, 2.0, .2); braam(TSC, .18, 1.6)
motif_major(T('m03b'), DUR - 3, .16)
for w in ('mom', 'brother', 'boss', 'crush'): whoosh(wt('m03b', w) - .35, .4, .1, 500, 6000, 0, 0); puff(wt('m03b', w) - .1, .05)
for w in ('say', 'Wear', 'Talk'): impact(wt('m05', w), .28, .45); shimmer(wt('m05', w) + .05, 1.0, .08)
TMID = T('m06'); bell(TMID, 50, .35); bell(TMID + 1.6, 50, .2)
TGN = wt('m06', 'gone'); HUSH.append((TGN - .1, TGN + 1.4)); shimmer(wt('m06', 'know'), 2.4, .18)
# --- 14. the end: your score, your answers, what to watch next
impact(T('o01'), .3, .5); shimmer(wt('o01', 'score'), 1.4, .12); whoosh(wt('o01', 'next'), .5, .14, 400, 6000, .5, -.5)

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
        for ch in (0, 1): BUS[b][ch] += (fconv(x.astype(float), IR[(kind, ch)]) * wet).astype(np.float32)
    del SEND[(b, 'room')], SEND[(b, 'hall')]
# the narrator in the middle; the thoughts thinner, wider and wet, as if inside your head
VO = np.zeros(N, np.float32); TV = np.zeros((2, N), np.float32); TVS = np.zeros(N, np.float32); HAAS = int(.011 * SR)
for l in TL['lines']:
    if 'wav0' not in l: continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, l['id'] + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, '<i2') / 32768; y = hp(y, 75); y = np.tanh(y / (np.abs(y).max() + 1e-9) * 1.7) / np.tanh(1.7) * .9
    i = int(l['wav0'] * SR)
    if i < 0: y = y[-i:]; i = 0
    n = min(len(y), N - i)
    if l.get('fx') == 'thought':
        y = hp(y, 210) * .78; y = y + hp(y, 3500) * .5
        TV[0, i:i + n] += y[:n]; m = min(n, N - i - HAAS); TV[1, i + HAAS:i + HAAS + m] += y[:m]; TVS[i:i + n] += y[:n]
    else: VO[i:i + n] += y[:n]
for ch in (0, 1): TV[ch] += (fconv(TVS.astype(float), IR[('hall', ch)]) * .55 + fconv(TVS.astype(float), IR[('room', ch)]) * .3).astype(np.float32)
LVL = {'mus': .42, 'sfx': .6, 'amb': .3}
for b, lv in LVL.items():
    pk = np.abs(BUS[b]).max() + 1e-9
    BUS[b] = (np.tanh(BUS[b] / pk * 2.0) / np.tanh(2.0) if b == 'sfx' else BUS[b] / pk) * lv
ts_all = tt(N); hush = np.ones(N, np.float32)
for a, b in HUSH: hush = np.minimum(hush, 1 - .75 * np.clip((ts_all - a) / .08, 0, 1) * np.clip((b - ts_all) / .25, 0, 1))
BUS['mus'] *= hush; BUS['amb'] *= hush
MIX = BUS['mus'] + BUS['sfx'] + BUS['amb']; del BUS
def box(x, n):                                       # a centred moving average (same as convolving with a box, in O(N))
    c = np.concatenate([[0.0], np.cumsum(x, dtype=float)]); h = n // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i - h + n, 0, len(x)); return (c[hi] - c[lo]) / n
env = box(np.abs(VO) + np.abs(TVS), int(.08 * SR)); env = np.clip(env / .05, 0, 1)
env = box(env, int(.25 * SR)); duck = (1 - env * (1 - 10 ** (-7 / 20))).astype(np.float32)
out = MIX * duck + VO + TV * .9
rms = np.sqrt(np.maximum(box(((out[0] + out[1]) * .5) ** 2, int(.05 * SR)), 0)) + 1e-9
thr = np.percentile(rms, 80); gr = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.2), 1.0); gr = box(gr, int(.03 * SR)).astype(np.float32)
out = out * gr; n = int(DUR * SR); out = out[:, :n]
fo = int(2.5 * SR); out[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
out = np.tanh(out / np.abs(out).max() * 1.3) / np.tanh(1.3) * .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', f'mix{SUF}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype('<i2').tobytes())
print('mix', round(DUR, 1), 's')
