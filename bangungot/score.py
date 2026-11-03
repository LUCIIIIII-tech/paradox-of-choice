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

# ---------- the cue sheet ----------
T = lambda id: LN[id]['t0']
# hook: boom + heartbeat on frame 1, the eyes snap open
boom(0.0, 1.1); heartbeat(0.02, 1.0); static(0.0, .12, .4)
# the horror bed: drone from frame 1 to the dark beat, louder with every step closer
drone(0.0, T('l09'), .28)
drone(T('l05'), T('l09'), .2, f=(36.7, 49.0, 73.4), grit=.8)
# heartbeat accelerating from 60 to 150 bpm until the dark beat
t, bpm = 1.0, 60
while t < T('l09') + .6:
    heartbeat(t, .75); bpm = 60 + 90 * min(1, t / T('count')); t += 60 / bpm
# cuts: a whoosh on every new shot
for l in TL['lines'][1:]:
    if l['shot'] not in ('scare', 'dark', 'count', 'hookback'): whoosh(l['t0'], .35, .22)
whisper(wt('l04', 'nakatingin') - .2, 1.8, .25)
whisper(T('l05') + .3, 1.6, .2)
boom(wt('l05', 'nakatayo'), .7, 50)
for w in LN['l06']['words']: hit(w[1], .55 if w[0].lower().startswith('siya') or w[0] == 'nang' else .8)
boom(wt('l07', 'umupo'), .9, 40); whisper(T('l07'), 1.4, .18)
for w in ('A', 'B'): hit(wt('l08', w), .5)
for k in range(3): tick(T('count') + k * .6, .6); bell(T('count') + k * .6, m2f(81 + k * 2), .5, .15)
# the dark beat: everything drops out; the scare
scream(T('scare') + .05, 1.0, 1.0)
static(T('l10'), .5, .55); tick(T('l10') + .45, .5)
# the explanation: a slow music box in A minor (90 bpm), a soft pad, a hit on the title
boom(wt('l11', 'sleep'), .8, 50); whoosh(wt('l11', 'sleep'), .6, .35)
mb = [69, 72, 76, 72, 74, 71, 67, 71, 69, 72, 76, 79, 77, 76, 74, 71]
t, i = T('l11') + .2, 0
while t < T('l19') + 1.2:
    bell(t, m2f(mb[i % 16] + 12), 1.4, .22, pan=.3 * np.sin(i)); t += 60 / 90 / 2; i += 1
drone(T('l11'), T('l20'), .14, f=(55.0, 82.4, 110.0), grit=.15)
for w in ('batibat', 'kanashibari', 'Old'): whoosh(wt('l16', w) - .5, .4, .3, rise=False)
for k in range(8): tick(wt('l17', 'walo') + k * .12, .35)
bell(T('l19'), m2f(81), 2.5, .35); bell(T('l19') + .2, m2f(88), 2.5, .25)
# the end: back to the dark, the corner, the flicker
drone(T('l20'), DUR, .3, grit=.8)
for k in range(5): static(wt('l20', 'sulok') - .3 + k * .125, .05, .45)
boom(wt('l20', 'sulok'), 1.0, 42); heartbeat(T('l21'), .8); heartbeat(T('l21') + .8, .8)
boom(T('tail') + .85, 1.0)        # the eyes open again: the loop

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

# 1. the hook: BRAAM + glitch + sub drop + the eyelids
braam(0.0, 1.0); stutter(0.0, 4, .7); eyelid(.06, .8); boom(.0, .6, 35)
# 2. the paralysis bed: clock, ringing ears, panicked breathing, wind at the window
clock_ticks(0.0, T('l09'), .25)
tinnitus(T('l02'), T('l09'), .03)
breathing(T('l02'), T('l07'), .2, 1.4); breathing(T('l07'), T('l09'), .28, 2.4)
wind(0.0, T('l09'), .12)
creak(T('l05') + .2, .8, .45); creak(T('l06') + .1, .6, .5); creak(wt('l06', 'palapit') - .1, .5, .55)
for l in TL['lines']:      # caption pops on key words, a swish on every punch-in
    keys = [k.lower().strip(':') for k in l.get('key', [])]
    for w in l.get('words', []):
        if any(w[0].lower().strip('.,?!:\'"').startswith(k) for k in keys if k): pop(w[1], .3)
    if l['shot'] not in ('scare', 'count', 'dark'): swish(l['t0'], .2)
# 3. the build into the scare: a riser that cuts to silence for 3 frames, then the scream
riser(T('scare') - .12, 1.6, .6)
# after the scream: ears ringing + a low rumble until the static comes in (no hole after the scare)
n = int(1.0 * SR); s_ = tt(n); sfx(LN['scare']['t1'] - .15, (np.sin(2 * np.pi * 6800 * s_) * .25 + band(noise(1.0), 30, 140) * 1.2) * np.exp(-s_ * 2.2) * np.minimum(1, s_ / .03), .7)
# 4. the explanation: pulse, locks, power down, warm power up, drips, pings, drums, blips
pulse_bed(T('l10'), T('l20'), 90, .3)
riser(wt('l11', 'sleep'), .8, .35)
for k in range(4): lock(wt('l12', 'pinaparalisa') + .1 + k * .12, .5)
powerdown(wt('l12', 'pinaparalisa') + .1, .5)
powerup(wt('l13', 'nauunang'), .4); clock_ticks(T('l13'), T('l14'), .15)
for k in range(9): drip(wt('l14', 'Kaya') + k * .17, .35)
creak(wt('l14', 'anino'), .7, .4)
for k in range(3): ping(wt('l15', 'iisang') + k * .25, .35)
for w in ('batibat', 'kanashibari', 'Old'): taiko(wt('l16', w) - .5, .8)
for k in range(8): pop(wt('l17', 'walo') + k * .12, .25)
for w in ('huwag', 'Igalaw', 'huminga'): taiko(wt('l18', w), .5); swish(wt('l18', w), .25)
birds(T('l19'), T('l20'), .16)
# 5. the end: clock and breathing again, a creak, the flicker, the ding, the loop
clock_ticks(T('l20'), DUR, .25); breathing(T('l20'), T('l21'), .25, 2.0); wind(T('l20'), DUR, .12)
creak(T('l20') + .3, .9, .5); riser(wt('l20', 'sulok'), 1.0, .45); stutter(wt('l20', 'sulok'), 5, .6)
ding(T('l21') + .1, .6); riser(T('tail') + .85, .8, .45); braam(T('tail') + .85, .8); eyelid(T('tail') + .9, .8)

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
