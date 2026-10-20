"""Sound for Bangungot -> out/mix.wav (48 kHz stereo): horror drone, heartbeat that speeds up, whispers, hits on every jump,
a scream stinger on the scare, static, a music box under the explanation, and the narrator on top (music ducked under the voice).
Everything is synthesised with numpy; every time comes from timeline.json, so the sound follows the narrator.
Usage: python3 score.py [en]"""
import os, json, wave, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
import sys
LANG = sys.argv[1] if len(sys.argv) > 1 else 'tl'; SUF = '' if LANG == 'tl' else '.' + LANG
VDIR = 'voices' if LANG == 'tl' else 'voices_' + LANG
TL = json.load(open(os.path.join(HERE, f'timeline{SUF}.json'), encoding='utf-8')); DUR = TL['dur']; N = int(SR * DUR) + SR
ANCH = json.load(open(os.path.join(HERE, f'anchors{SUF}.json'))) if SUF else {}
LN = {l['id']: l for l in TL['lines']}
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N); REV = np.zeros(N); VO = np.zeros(N)

def add(t, x, gain=1.0, pan=0.0, rev=.2):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i] * gain; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + len(x)] += x * l; R[i:i + len(x)] += x * r; REV[i:i + len(x)] += x * rev
def tt(n): return np.arange(n) / SR
def band(x, lo, hi):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); F[(f < lo) | (f > hi)] = 0; return np.fft.irfft(F, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def wt(id, w):   # time a word starts (cues are written with the Tagalog words; anchors{SUF}.json maps them per language)
    w = ANCH.get(f'{id}:{w}', w); l = LN[id]
    for x in l.get('words', []):
        if x[0].lower().strip('.,?:!').startswith(w.lower()): return x[1]
    return l['t0']

# ---------- elements ----------
def boom(t, v=1.0, f0=70):
    n = int(1.6 * SR); s = tt(n); f = f0 * (1 + 1.5 * np.exp(-s * 18))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s * 2.6) + band(noise(1.6), 20, 300) * np.exp(-s * 6) * .5
    add(t, y * v, rev=.35)
def heartbeat(t, v=.8):
    for k, dt in enumerate((0, .17)):
        n = int(.3 * SR); s = tt(n); y = np.sin(2 * np.pi * (48 + 30 * np.exp(-s * 30)) * s) * np.exp(-s * 16) * (1 if k == 0 else .7)
        add(t + dt, y * v, rev=.05)
def hit(t, v=.7):            # metallic impact for the jump cuts
    n = int(1.2 * SR); s = tt(n); y = sum(np.sin(2 * np.pi * f * s) * np.exp(-s * d) for f, d in [(110, 4), (237, 6), (413, 9), (1290, 14)])
    y += band(noise(1.2), 200, 4000) * np.exp(-s * 22) * 1.5
    add(t, y * v * .4, rev=.4); boom(t, .5 * v, 55)
def whoosh(t, d=.35, v=.25, rise=True):
    y = band(noise(d), 300, 5000) * np.sin(np.pi * tt(int(d * SR)) / d) ** (2 if rise else 1)
    add(t - (d * .7 if rise else 0), y * v, pan=rng.uniform(-.4, .4), rev=.2)
def whisper(t, d=1.6, v=.22):
    n = int(d * SR); s = tt(n); env = (np.sin(2 * np.pi * 5.5 * s + rng.uniform(0, 6)) * .5 + .5) ** 3 * np.sin(np.pi * s / d)
    for pan in (-.8, .8): add(t + rng.uniform(0, .15), band(noise(d), 1800, 7500) * env * v, pan=pan, rev=.5)
def tick(t, v=.4):
    n = int(.06 * SR); s = tt(n); add(t, (np.sin(2 * np.pi * 2200 * s) + band(noise(.06), 2000, 9000)) * np.exp(-s * 120) * v, rev=.1)
def scream(t, d=1.0, v=1.0):  # layered: a pitch-falling detuned saw choir + a band-swept noise shriek + sub
    n = int(d * SR); s = tt(n); y = np.zeros(n)
    for det in (1, 1.013, .987, 1.5, 2.02):
        f = 620 * det * (1 - .45 * s / d) * (1 + .03 * np.sin(2 * np.pi * 11 * s)); ph = 2 * np.pi * np.cumsum(f) / SR
        y += sum(np.sin(k * ph) / k for k in range(1, 12)) * .3
    shr = band(noise(d), 2500, 7000) * 1.4
    y = (y + shr) * np.minimum(1, s / .01) * np.exp(-np.maximum(0, s - d * .7) * 12)
    y = np.tanh(y * 1.5)
    add(t, y * v * .55, rev=.3); boom(t, 1.2, 45)
def static(t, d=.45, v=.5): add(t, band(noise(d), 500, 12000) * np.exp(-tt(int(d * SR)) * 2) * v, rev=.05)
def bell(t, f, d=1.8, v=.3, pan=0):
    n = int(d * SR); s = tt(n); y = sum(np.sin(2 * np.pi * f * r * s) * a * np.exp(-s / dd) for r, a, dd in [(1, 1, .9), (2.0, .4, .5), (3.01, .25, .3), (4.2, .12, .2)])
    add(t, y * np.minimum(1, s / .002) * v * .35, pan=pan, rev=.5)
def drone(t0, t1, v=.3, f=(41.2, 55.0, 61.7), grit=.5):
    n = int((t1 - t0) * SR); s = tt(n); env = np.minimum(1, s / 1.0) * np.minimum(1, (t1 - t0 - s) / .2)
    y = sum(np.sin(2 * np.pi * fr * s + i) * (1 + .3 * np.sin(2 * np.pi * .13 * (i + 1) * s)) for i, fr in enumerate(f)) / len(f)
    y += band(noise(t1 - t0), 30, 180) * grit
    swell = 1 + .5 * np.sin(2 * np.pi * .07 * s)
    add(t0, y * env * swell * v, rev=.1)
def m2f(m): return 440 * 2 ** ((m - 69) / 12)

T = lambda id: LN[id]['t0']

# ---------- SFX pass: a hook on frame 1 and a layer under every second, so nothing is ever silent ----------
SFX_L = np.zeros(N); SFX_R = np.zeros(N)
def sfx(t, x, v=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i] * v; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    SFX_L[i:i + len(x)] += x * l; SFX_R[i:i + len(x)] += x * r
def env(n, a=.005, d=.2): s = tt(n); return np.minimum(1, s / max(a, 1e-4)) * np.exp(-s / d)
def braam(t, v=1.0):          # the hook: a distorted low brass cluster
    n = int(2.2 * SR); s = tt(n); y = np.zeros(n)
    for f in (55.0, 82.4, 110.0, 130.8, 164.8):
        for det in (.995, 1.0, 1.006):
            ph = 2 * np.pi * f * det * s; y += sum(np.sin(k * ph) / k for k in range(1, 14))
    y = np.tanh(y * .5) * np.minimum(1, s / .02) * np.exp(-s / .9)
    y = band(y, 30, 2500 * np.exp(-0) )
    sfx(t, y * v * .5)
def stutter(t, k=4, v=.6):    # glitch stutter: chopped digital noise bursts
    for i in range(k):
        n = int(.035 * SR); y = band(noise(.035), 800 + 900 * i, 9000) * np.hanning(n)
        sfx(t + i * .05, y * v, pan=(-1) ** i * .5)
def riser(t_end, d=1.0, v=.5):   # noise + pitch sweep that lands on t_end
    n = int(d * SR); s = tt(n); u = s / d
    f = 200 * 2 ** (u * 3.5); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * .4
    y += band(noise(d), 1500, 9000) * (u ** 2) * 1.2
    sfx(t_end - d, y * u ** 2 * v)
def click(t, v=.5, f=3000):
    n = int(.03 * SR); s = tt(n); sfx(t, (np.sin(2 * np.pi * f * s) + band(noise(.03), 2000, 10000)) * np.exp(-s * 200) * v)
def eyelid(t, v=.5):          # a wet "tsk" as the eyes open
    sfx(t, band(noise(.06), 900, 4000) * env(int(.06 * SR), .002, .015) * v * 2)
def pop(t, v=.35):            # caption key word
    n = int(.08 * SR); s = tt(n); f = 1400 - 900 * s / .08; sfx(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s * 45) * v)
def swish(t, v=.18):
    d = .18; n = int(d * SR); sfx(t - .09, band(noise(d), 2500, 11000) * np.sin(np.pi * tt(n) / d) ** 2 * v, pan=rng.uniform(-.6, .6))
def clock_ticks(t0, t1, v=.22):
    k = 0; t = np.ceil(t0)
    while t < t1: click(t, v, 2600 if k % 2 else 1900); t += 1.0; k += 1
def tinnitus(t0, t1, v=.035):
    n = int((t1 - t0) * SR); s = tt(n); e = np.minimum(1, s / .8) * np.minimum(1, (t1 - t0 - s) / .3)
    sfx(t0, (np.sin(2 * np.pi * 7200 * s) + .5 * np.sin(2 * np.pi * 7230 * s)) * e * v)
def breathing(t0, t1, v=.22, rate=1.6):   # panicked breaths through the nose
    t = t0; k = 0
    while t < t1:
        d = .55 / rate * (1.3 if k % 2 == 0 else 1); n = int(d * SR)
        y = band(noise(d), 400 if k % 2 == 0 else 250, 3000 if k % 2 == 0 else 1800) * np.sin(np.pi * tt(n) / d) ** 1.5
        sfx(t, y * v * (1.0 if k % 2 == 0 else .7), pan=-.2); t += d + .05; k += 1
def creak(t, d=.7, v=.4):      # floorboard: stick-slip clicks through a resonance
    n = int(d * SR); s = tt(n); rate = 30 + 60 * np.sin(np.pi * s / d) ** 2
    ph = np.cumsum(rate) / SR; pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    res = np.zeros(n)
    for f, a in ((420, 1), (910, .5), (1730, .3)): res += np.convolve(pulses, np.sin(2 * np.pi * f * tt(int(.03 * SR))) * np.exp(-tt(int(.03 * SR)) * 120), 'same') * a
    sfx(t, res * np.sin(np.pi * s / d) * v, pan=-.5)
def wind(t0, t1, v=.12):
    n = int((t1 - t0) * SR); s = tt(n); y = band(noise(t1 - t0), 200, 1200) * (.6 + .4 * np.sin(2 * np.pi * .23 * s) ** 2)
    sfx(t0, y * np.minimum(1, s / 1.0) * np.minimum(1, (t1 - t0 - s) / .5) * v, pan=.4)
def lock(t, v=.6):            # metal padlock snapping shut
    click(t, v, 4200); click(t + .04, v * .8, 2400)
    n = int(.25 * SR); s = tt(n); sfx(t, sum(np.sin(2 * np.pi * f * s) for f in (1250, 2780, 4130)) * np.exp(-s * 25) * v * .15)
def powerdown(t, v=.5):
    n = int(.9 * SR); s = tt(n); f = 600 * np.exp(-s * 4) + 40; sfx(t, np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-s * 3) * v * .5)
def powerup(t, v=.35):
    n = int(.7 * SR); s = tt(n); f = 120 + 900 * (s / .7) ** 2; sfx(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s / .7) * v * .5)
def drip(t, v=.4):
    n = int(.15 * SR); s = tt(n); f = 700 + 2200 * s / .15; sfx(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s * 30) * v, pan=rng.uniform(-.5, .5))
def ping(t, v=.35):
    n = int(1.2 * SR); s = tt(n); sfx(t, (np.sin(2 * np.pi * 1320 * s) + .3 * np.sin(2 * np.pi * 2640 * s)) * np.exp(-s * 4) * v, pan=rng.uniform(-.5, .5))
def taiko(t, v=.8):
    n = int(.8 * SR); s = tt(n); f = 70 + 60 * np.exp(-s * 25); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-s * 6) + band(noise(.8), 100, 1500) * np.exp(-s * 40) * .6
    sfx(t, y * v)
def birds(t0, t1, v=.18):
    t = t0
    while t < t1:
        n = int(.12 * SR); s = tt(n); f0 = 2800 + 1500 * rng.random(); f = f0 + 1200 * np.sin(2 * np.pi * 22 * s)
        sfx(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s / .12) * v, pan=rng.uniform(-.7, .7)); t += .15 + .3 * rng.random()
def ding(t, v=.5):
    for f, dt in ((1568, 0), (2093, .09)): n = int(.9 * SR); s = tt(n); sfx(t + dt, (np.sin(2 * np.pi * f * s) + .2 * np.sin(2 * np.pi * 2 * f * s)) * np.exp(-s * 5) * v * .5)
def pulse_bed(t0, t1, bpm=90, v=.35):   # a soft sub pulse keeps the explanation moving
    t = t0
    while t < t1:
        n = int(.35 * SR); s = tt(n); sfx(t, np.sin(2 * np.pi * (45 + 20 * np.exp(-s * 20)) * s) * np.exp(-s * 9) * v); t += 60 / bpm

# ---------- more sounds for this story ----------
def murmur(t0, t1, v=.25):      # a crowd: many band-limited voices that swell and overlap
    n = int((t1 - t0) * SR); s_ = tt(n); y = np.zeros(n)
    for k in range(6):
        e = (.5 + .5 * np.sin(2 * np.pi * (2.5 + k * .7) * s_ + k)) ** 2
        y += band(noise(t1 - t0), 250 + k * 120, 1800 + k * 250) * e
    sfx(t0, y * np.minimum(1, s_ / .05) * v * .35)
def footsteps(t0, t1, v=.25, rate=7):
    t = t0
    while t < t1: click(t + rng.uniform(0, .05), v * rng.uniform(.5, 1), 900 + 600 * rng.random()); t += 1 / rate * rng.uniform(.6, 1.2)
def horn(t, v=.25):
    n = int(.5 * SR); s_ = tt(n); sfx(t, np.tanh(2 * (np.sin(2 * np.pi * 410 * s_) + np.sin(2 * np.pi * 520 * s_))) * np.minimum(1, s_ / .02) * np.minimum(1, (.5 - s_) / .05) * v * .3, pan=rng.uniform(-.8, .8))
def clatter(t, v=.4):           # a phone hitting the road
    click(t, v, 2500 + 2000 * rng.random()); click(t + .06, v * .5, 3200); n = int(.15 * SR); sfx(t, band(noise(.15), 200, 2000) * np.exp(-tt(n) * 40) * v, pan=rng.uniform(-.7, .7))
def sparkle(t, v=.2):
    for k in range(8): n = int(.4 * SR); s_ = tt(n); sfx(t + k * .03, np.sin(2 * np.pi * (3000 + 3000 * rng.random()) * s_) * np.exp(-s_ * 12) * v, pan=rng.uniform(-.8, .8))
def hum(t0, t1, v=.12):
    n = int((t1 - t0) * SR); s_ = tt(n); sfx(t0, (np.sin(2 * np.pi * 60 * s_) + .5 * np.sin(2 * np.pi * 120 * s_) + .25 * np.sin(2 * np.pi * 180 * s_)) * np.minimum(1, s_ / .3) * np.minimum(1, (t1 - t0 - s_) / .05) * v)
def alarm(t0, t1, v=.2):
    t = t0
    while t < t1: n = int(.18 * SR); sfx(t, np.sign(np.sin(2 * np.pi * 880 * tt(n))) * .3 * v); t += .45
def breaker(t, v=.5): click(t, v, 1800); boom(t, .25 * v, 60)
def sit_tones(t, v=.35):        # the "no service" three-tone
    for k, f in enumerate((950, 1400, 1800)): n = int(.3 * SR); s_ = tt(n); sfx(t + k * .33, np.sin(2 * np.pi * f * s_) * np.minimum(1, s_ / .01) * np.minimum(1, (.3 - s_) / .01) * v)
def water(t0, t1, v=.25):
    n = int((t1 - t0) * SR); s_ = tt(n); sfx(t0, band(noise(t1 - t0), 80, 900) * (s_ / (t1 - t0)) * v * 1.4)
def growl(t, d=1.0, v=.4):
    n = int(d * SR); s_ = tt(n); y = band(noise(d), 60, 400) * (.6 + .4 * np.sin(2 * np.pi * 28 * s_)) * np.sin(np.pi * s_ / d)
    sfx(t, y * v * 2, pan=rng.uniform(-.6, .6))
def howl(t, v=.25):
    n = int(2.2 * SR); s_ = tt(n); f = 520 + 260 * np.sin(np.pi * s_ / 2.2) + 8 * np.sin(2 * np.pi * 6 * s_)
    sfx(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s_ / 2.2) ** 2 * v, pan=.6)
def crickets(t0, t1, v=.08):
    t = t0
    while t < t1:
        for k in range(3): n = int(.03 * SR); sfx(t + k * .05, np.sin(2 * np.pi * 4700 * tt(n)) * np.hanning(n) * v, pan=.5)
        t += .5 + .2 * rng.random()
def typing(t0, t1, n_keys):
    for k in range(n_keys): click(lerp(t0, t1, k / max(1, n_keys - 1)) + rng.uniform(0, .02), .3, 4000 + 1000 * rng.random())
def lerp(a, b, u): return a + (b - a) * u
def melody(t0, t1, notes, step=.5, v=.25, oct_=12):
    t, i = t0, 0
    while t < t1: bell(t, m2f(notes[i % len(notes)] + oct_), 1.6, v, pan=.3 * np.sin(i)); t += step; i += 1

TV = wt('l01', 'wala')
# 1. the hook: a busy city... then everyone vanishes on "wala"
murmur(0, TV + .05, .4); footsteps(0, TV, .3, 9); horn(.3, .25); horn(.9, .2); hum(0, TV, .05)
riser(TV, .9, .55); braam(TV, 1.0); boom(TV, .9, 40); stutter(TV, 4, .6); sparkle(TV + .05, .25)
for k in range(14): clatter(TV + .25 + k * .04 + rng.uniform(0, .05), .35)
wind(TV, DUR, .1); drone(TV, T('l13'), .2, f=(41.2, 61.7, 82.4), grit=.3)
# 2. the open loop
heartbeat(T('l02') + .2, .7); heartbeat(T('l02') + 1.1, .7); riser(wt('l02', 'hindi'), .8, .4); boom(wt('l02', 'hindi'), .7, 45)
# every time jump: a riser that lands on a counter hit
for l in TL['lines']:
    if l.get('counter') and l['id'] != 'l01': riser(l['t0'], .6, .35); taiko(l['t0'], .6); click(l['t0'], .5, 2600)
# 3-4. hour one: the traffic light still clicks; then a warm morning
for k in range(int((T('l04') - T('l03')) / 1.2) + 1): click(T('l03') + k * 1.2, .35, 1500)
for k in range(4): click(T('l03') + .3 + k * .7, .15, 700)    # paper scraping along the road
birds(T('l04'), T('l05'), .14); melody(T('l04'), T('l05'), [72, 76, 79, 84], .35, .2)
# 5-6. the grid shuts down, block by block
hum(T('l05'), wt('l05', 'nagsasara') + .3, .14); powerdown(wt('l05', 'nagsasara') + .2, .6); alarm(wt('l05', 'nagsasara') + .4, T('l06'), .18)
for k in range(9): breaker(T('l06') + .5 + k * (LN['l06']['t1'] - T('l06')) / 9, .5)
# 7. Earth goes dark
boom(wt('l07', 'Didilim'), 1.0, 35); drone(T('l07'), T('l08'), .2, f=(32.7, 49.0, 65.4), grit=.1)
# 8. the subway floods
water(T('l08'), T('l09'), .35)
for k in range(10): drip(T('l08') + .2 + k * .35, .3)
# 9. no signal
sit_tones(wt('l09', 'Walang'), .3); stutter(wt('l09', 'Putol'), 3, .5)
# 10. the dogs
for k in range(6): growl(T('l10') + .3 + k * .55, .8, .35)
footsteps(T('l10'), T('l11'), .12, 14); howl(T('l10') + .6, .22)
# 11. the rooftop: crickets and a lonely music box
crickets(T('l11'), T('l13'), .07); melody(T('l11'), T('l12'), [69, 72, 76, 72, 74, 71, 67, 71], .45, .22)
# 12. something answers... then the scare
heartbeat(T('l12') + .1, .8); heartbeat(T('l12') + .8, .9); whisper(wt('l12', 'sumagot') - .1, 1.2, .35)
riser(T('scare') - .12, 1.4, .6); scream(T('scare') + .05, 1.0, 1.0)
n = int(1.0 * SR); s_ = tt(n); sfx(LN['scare']['t1'] - .15, (np.sin(2 * np.pi * 6800 * s_) * .25 + band(noise(1.0), 30, 140) * 1.2) * np.exp(-s_ * 2.2), .7)
# 13-16. the truth: static, a ticking experiment, the brain making people, the reveal
static(T('l13'), .5, .55); pulse_bed(T('l13'), T('l17'), 90, .3); drone(T('l13'), T('l17'), .14, f=(55.0, 82.4, 110.0), grit=.1)
for k in range(int((LN['l14']['t1'] - T('l14')) / .25)): click(T('l14') + k * .25, .2 if k % 4 else .35, 2200)
whisper(wt('l14', 'mukha') - .5, 1.6, .2)
for k in range(6): pop(wt('l15', 'gumagawa') + k * .12, .3)
taiko(wt('l16', 'Hindi'), .8); braam(wt('l16', 'pag-iisa'), .8); boom(wt('l16', 'pag-iisa'), .8, 40)
# 17-20. years: birds and deer, rust, forest, the long quiet
birds(T('l17'), T('l20'), .13)
for k in range(5): click(T('l17') + 1.0 + k * .45, .15, 600)
creak(wt('l18', 'Kalawang'), .9, .45); creak(wt('l18', 'Kalawang') + 1.0, .7, .35); boom(wt('l18', 'lahat'), .5, 50)
drone(T('l20'), T('l22'), .18, f=(36.7, 55.0, 73.4), grit=.15)
# 21-24. the last one who remembers; the twist; the message; the question
melody(T('l21'), T('l23'), [69, 72, 76, 79, 77, 76, 72, 74], .4, .26)
heartbeat(T('l22') + .1, .6); boom(wt('l22', 'Pero'), .6, 55); bell(wt('l22', 'Pero'), m2f(88), 2.5, .35)
msg_n = len('Kumusta ka? Miss na kita.'); typing(T('l23'), LN['l23']['t1'] - .3, msg_n); swish(LN['l23']['t1'] - .3, .3); ding(LN['l23']['t1'] - .25, .5)
pop(T('l24'), .4); ding(T('l24') + .2, .45)
# loop: the crowd flickers back in -> frame 1
heartbeat(T('tail') + .05, .7); riser(T('tail') + .45, .45, .4); murmur(T('tail') + .45, DUR, .35); stutter(T('tail') + .45, 3, .4)

# ---------- master: room reverb, the narrator, ducking ----------
irn = int(1.4 * SR); s = tt(irn); ir = rng.standard_normal(irn) * np.exp(-s / .35)
def fconv(x, h):
    m = len(x) + len(h) - 1; F = 1 << (m - 1).bit_length(); return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
wet = fconv(REV, ir); wet *= .35 * np.abs(REV).max() / (np.abs(wet).max() + 1e-9)
L += wet; R += np.roll(wet, 401)
pk = max(np.abs(L).max(), np.abs(R).max()) + 1e-9; L /= pk / .8; R /= pk / .8
pk = max(np.abs(SFX_L).max(), np.abs(SFX_R).max()) + 1e-9
SFX_L = np.tanh(SFX_L / pk * 2.2) / np.tanh(2.2) * .55; SFX_R = np.tanh(SFX_R / pk * 2.2) / np.tanh(2.2) * .55
L += SFX_L; R += SFX_R
for l in TL['lines']:
    if 'wav0' not in l: continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, VDIR, l['id'] + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, '<i2') / 32768; y = np.tanh(y / (np.abs(y).max() + 1e-9) * 1.6) / np.tanh(1.6) * .85   # gentle compression
    i = int(l['wav0'] * SR)
    if i < 0: y = y[-i:]; i = 0          # the line's leading silence starts before the film
    n = min(len(y), N - i); VO[i:i + n] += y[:n]
env = np.convolve(np.abs(VO), np.ones(int(.1 * SR)) / int(.1 * SR), 'same'); env = np.clip(env / .04, 0, 1)
env = np.convolve(env, np.ones(int(.2 * SR)) / int(.2 * SR), 'same'); duck = 1 - env * (1 - 10 ** (-7 / 20))
outL = L * duck + VO; outR = R * duck + VO
n = int(DUR * SR); outL, outR = outL[:n], outR[:n]
pk = max(np.abs(outL).max(), np.abs(outR).max()); outL /= pk / .95; outR /= pk / .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', f'mix{SUF}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([outL, outR], 1) * 32767).astype('<i2').tobytes())
print(f'wrote out/mix{SUF}.wav', round(DUR, 2), 's')
