"""Sound for Bangungot -> out/mix.wav (48 kHz stereo): horror drone, heartbeat that speeds up, whispers, hits on every jump,
a scream stinger on the scare, static, a music box under the explanation, and the narrator on top (music ducked under the voice).
Everything is synthesised with numpy; every time comes from timeline.json, so the sound follows the narrator.
Usage: python3 score.py"""
import os, json, wave, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8')); DUR = TL['dur']; N = int(SR * DUR) + SR
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
def wt(id, w):   # time a word starts
    l = LN[id]
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

# ---------- master: room reverb, the narrator, ducking ----------
irn = int(1.4 * SR); s = tt(irn); ir = rng.standard_normal(irn) * np.exp(-s / .35)
def fconv(x, h):
    m = len(x) + len(h) - 1; F = 1 << (m - 1).bit_length(); return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
wet = fconv(REV, ir); wet *= .35 * np.abs(REV).max() / (np.abs(wet).max() + 1e-9)
L += wet; R += np.roll(wet, 401)
pk = max(np.abs(L).max(), np.abs(R).max()) + 1e-9; L /= pk / .8; R /= pk / .8
for l in TL['lines']:
    if 'wav0' not in l: continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'voices', l['id'] + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, '<i2') / 32768; y = np.tanh(y / (np.abs(y).max() + 1e-9) * 1.6) / np.tanh(1.6) * .85   # gentle compression
    i = int(l['wav0'] * SR)
    if i < 0: y = y[-i:]; i = 0          # the line's leading silence starts before the film
    n = min(len(y), N - i); VO[i:i + n] += y[:n]
env = np.convolve(np.abs(VO), np.ones(int(.1 * SR)) / int(.1 * SR), 'same'); env = np.clip(env / .04, 0, 1)
env = np.convolve(env, np.ones(int(.2 * SR)) / int(.2 * SR), 'same'); duck = 1 - env * (1 - 10 ** (-10 / 20))
outL = L * duck + VO; outR = R * duck + VO
n = int(DUR * SR); outL, outR = outL[:n], outR[:n]
pk = max(np.abs(outL).max(), np.abs(outR).max()); outL /= pk / .95; outR /= pk / .95
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([outL, outR], 1) * 32767).astype('<i2').tobytes())
print('wrote out/mix.wav', round(DUR, 2), 's')
