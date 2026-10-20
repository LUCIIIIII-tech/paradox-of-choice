"""Original score, synthesized in numpy -> music/score.wav (48 kHz stereo, film length) + music/stems/*.wav
Shape: more options, more instruments. One D-minor theme on a theremin-like lead piles up layers world by world
(home 2 -> deli-verse 1 4 -> deli-verse 2 6 -> the fall: everything, too fast), hard-cuts to silence on the landing,
then returns on one instrument (a lone Rhodes, then a lone theremin under the title).
Cue times come from events.json (exported from story.js), so each cue's first beat is its cut.
Usage: python music/score.py"""
import json, os, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
E = json.load(open(os.path.join(ROOT, 'events.json'))); DUR = E['dur']
CUE = {e['name']: e for e in E['ev'] if e['type'] == 'cue'}
SR = 48000; N = int(DUR * SR)
rng = np.random.default_rng(23)

def tt(d): return np.arange(int(round(d * SR))) / SR
def mf(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def M(s): n, o = (s[:2], s[2:]) if len(s) > 2 and s[1] in '#b' else (s[:1], s[1:]); return 12 * (int(o) + 1) + NOTE[n]
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR * .45), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def adsr(n, a=.005, d=.1, s=.6, r=.1, hold=None):
    i = np.arange(n); A, D, R = max(int(a * SR), 1), max(int(d * SR), 1), max(int(r * SR), 1); H = max(n - R if hold is None else int(hold * SR), 1)
    e = np.where(i < A, i / A, np.where(i < A + D, 1 - (1 - s) * (i - A) / D, s))
    rel = np.clip(1 - (i - H) / R, 0, 1); return np.where(i >= H, e[min(H, n - 1)] * rel, e)
def saw(ph): return 2 * (ph % 1) - 1
def sq(ph, w=.5): return np.where(ph % 1 < w, 1., -1.)

class Bus:
    def __init__(s): s.b = np.zeros((N, 2))
    def add(s, x, at, g=1., pan=0.):
        st = int(round(at * SR))
        if x.ndim == 1: l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414; x = np.stack([x * l, x * r], 1)
        if st < 0: x = x[-st:]; st = 0
        e = min(N, st + len(x))
        if e > st: s.b[st:e] += x[:e - st] * g
    def cut(s, t0, t1=None, fade=.006):
        a = int(t0 * SR); b = N if t1 is None else int(t1 * SR); f = int(fade * SR)
        s.b[a:b] = 0
        if a - f > 0: s.b[a - f:a] *= np.linspace(1, 0, f)[:, None]
BUS = {k: Bus() for k in ['drums', 'bass', 'lead', 'harm', 'guitar', 'arp', 'fx']}

# —— instruments ——
def theremin(notes, glide=.07, vib=.3, rate=5.6, bright=.14, v=1.):
    """notes: [(t, dur, midi)] played legato; returns (start, signal)"""
    t0 = notes[0][0]; t1 = max(t + d for t, d, _ in notes) + .3; n = int((t1 - t0) * SR)
    target = np.full(n, float(notes[0][2])); amp = np.zeros(n); vib_env = np.zeros(n)
    for t, d, m in notes:
        a, b = int((t - t0) * SR), int((t + d - t0) * SR); target[a:] = m
        env = adsr(b - a + int(.14 * SR), .035, .08, .85, .14, hold=d); amp[a:a + len(env)] = np.maximum(amp[a:a + len(env)], env[:n - a])
        L = int((d + .14) * SR); w = np.clip((np.arange(L) / SR - .15) / .25, 0, 1); vib_env[a:a + L] = np.maximum(vib_env[a:a + L], w[:n - a])
    k = 1 - np.exp(-1 / (glide * SR))
    mid = lfilter([k], [1, -(1 - k)], target, zi=[target[0] * (1 - k)])[0]
    f = mf(mid + vib * vib_env * np.sin(np.arange(n) / SR * rate * 2 * np.pi)); ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) + bright * np.sin(4 * np.pi * ph) + .05 * np.sin(6 * np.pi * ph)
    return t0, lp(x * amp, 5000) * v
def bass(d, m, v=1., cut=900):
    n = int((d + .06) * SR); ph = np.cumsum(np.full(n, mf(m))) / SR
    x = .7 * saw(ph) + .5 * np.sin(2 * np.pi * ph) + .25 * np.sin(4 * np.pi * ph) + .12 * np.sin(6 * np.pi * ph)   # harmonics so it speaks on small speakers
    y = lp(x, cut) * .6 + lp(x, cut * 3) * .4 * np.exp(-np.arange(n) / SR / .08)
    return y * adsr(n, .004, .15, .55, .05, hold=d) * v
def pluckSq(d, m, v=1., w=.3, cut=3200):
    n = int((d + .12) * SR); ph = np.cumsum(np.full(n, mf(m))) / SR
    return lp(sq(ph, w) * adsr(n, .002, .08, .2, .08, hold=d), cut) * v
def rhodes(d, m, v=1.):
    n = int((d + .9) * SR); tn = np.arange(n) / SR; f = mf(m)
    x = np.sin(2 * np.pi * f * tn) * np.exp(-tn / 1.6) + .35 * np.sin(2 * np.pi * f * 2 * tn) * np.exp(-tn / .35) + .1 * np.sin(2 * np.pi * f * 7.1 * tn) * np.exp(-tn / .04)
    return x * (1 + .15 * np.sin(2 * np.pi * 4.5 * tn)) * adsr(n, .003, .2, 1, .35, hold=d) * v
def vibes(m, v=1.):
    n = int(1.4 * SR); tn = np.arange(n) / SR; f = mf(m)
    x = np.sin(2 * np.pi * f * tn) * np.exp(-tn / .8) + .3 * np.sin(2 * np.pi * f * 4 * tn) * np.exp(-tn / .18) + .08 * np.sin(2 * np.pi * f * 10 * tn) * np.exp(-tn / .05)
    return x * (1 + .35 * np.sin(2 * np.pi * 5.5 * tn)) * v
def ks(m, d=.5, v=1., bright=.6):   # Karplus-Strong string (surf guitar)
    n = int(d * SR); f = mf(m); L = max(2, int(SR / f)); buf = lp(rng.standard_normal(L), 2500 + 5000 * bright); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % L]; buf[i % L] = .5 * (buf[i % L] + buf[(i + 1) % L]) * .997
    return np.tanh(out * 2.2) * v
def strings_trem(d, ms, v=1., rise=0):
    n = int(d * SR); tn = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for dt in (-.12, 0, .12): x += saw(np.cumsum(mf(m + dt + rise * tn / d)) / SR + rng.random())
    return lp(x, 2600) * (.55 + .45 * np.sin(2 * np.pi * 13 * tn)) * adsr(n, .06, .1, 1, .01, hold=d - .01) * v / len(ms)
def kazoo(d, m, v=1., bend=-1.0):
    n = int(d * SR); tn = np.arange(n) / SR; f = mf(m + bend * (tn / d) ** 2 + .25 * np.sin(2 * np.pi * 6 * tn))
    x = saw(np.cumsum(f) / SR); buzz = np.tanh(3 * x) + .3 * rng.standard_normal(n) * .2
    y = bp(buzz, 600, 2600) + .5 * bp(buzz, 2600, 4200)
    return y * adsr(n, .01, .05, .9, .05, hold=d - .05) * v
def kick(v=1.):
    n = int(.4 * SR); tn = np.arange(n) / SR; f = 50 + 100 * np.exp(-tn / .035)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tn / .17) + .3 * hp(rng.standard_normal(n), 2000) * np.exp(-tn / .003)) * v
def brush(v=1., d=.18):
    n = int(d * SR); tn = np.arange(n) / SR; return bp(rng.standard_normal(n), 1500, 7000) * (np.exp(-tn / .05) * .8 + .2) * np.sin(np.pi * tn / d) * v
def ride(v=1.):
    n = int(.6 * SR); tn = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 3000, 9000) * .4 + sum(np.sin(2 * np.pi * f * tn + rng.random() * 6) for f in (3120, 4370, 5210)) * .15   # band-passed noise + a little FM, no square cymbal fizz
    return x * np.exp(-tn / .25) * v
def snare(v=1.):
    n = int(.22 * SR); tn = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 1200, 6000) * np.exp(-tn / .06) + .5 * np.sin(2 * np.pi * 190 * tn) * np.exp(-tn / .04)) * v
def hat(v=1.):
    n = int(.06 * SR); tn = np.arange(n) / SR; return bp(rng.standard_normal(n), 6000, 11000) * np.exp(-tn / .012) * v
def spring_verb(x, mix=.22, d=1.2):
    n = int(d * SR); tn = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-tn / .35) * (1 + .5 * np.sin(2 * np.pi * 9 * tn)); ir = lp(ir, 4500); ir /= np.abs(ir).sum() ** .5 * 6
    wet = np.stack([fftconvolve(x[:, c], ir)[:len(x)] for c in range(2)], 1); return x + wet * mix

# —— the theme (D minor; one phrase = 4 bars of 4 beats) ——
# (beat offset, beats, note)
THEME = [(0, 1, 'D5'), (1, .5, 'F5'), (1.5, .5, 'E5'), (2, .5, 'D5'), (2.5, .5, 'C#5'), (3, 1, 'D5'),
         (4, 1, 'C5'), (5, .5, 'Bb4'), (5.5, .5, 'A4'), (6, .5, 'G#4'), (6.5, .5, 'A4'), (7, 1, 'E4'),
         (8, .5, 'F4'), (8.5, .5, 'G4'), (9, 1, 'A4'), (10, 1, 'D5'), (11, .5, 'C5'), (11.5, .5, 'Bb4'),
         (12, 2.5, 'A4'), (14.5, .5, 'C#5'), (15, 1, 'D5')]
CHORDS = [('D', ['D3', 'F3', 'A3']), ('D', ['D3', 'F3', 'A3']), ('Bb', ['Bb2', 'D3', 'F3']), ('A', ['A2', 'C#3', 'E3'])]
ROOT = {'D': 'D2', 'Bb': 'Bb1', 'A': 'A1'}

def section(name, layers, transpose=0, swing=0., beats_limit=None):
    c = CUE[name]; t0, t1, bpm = c['t0'], c['t1'], c['bpm']; bt = 60 / bpm
    nb = int(round((t1 - t0) / bt)) if beats_limit is None else beats_limit
    sw = lambda b: b + (swing * .5 if (b * 2) % 2 == 1 else 0)          # swing the off-beat 8ths
    if 'lead' in layers:
        notes = []
        for k in range(0, nb, 16):
            for (b, d, n) in THEME:
                if k + b >= nb: break
                notes.append((t0 + (k + sw(b)) * bt, d * bt * .95, M(n) + transpose))
        if notes:
            s, x = theremin(notes, v=.5); BUS['lead'].add(x, s, 1., .1)
    for bar in range(int(np.ceil(nb / 4))):
        ch, tones = CHORDS[bar % 4]; tb = t0 + bar * 4 * bt
        if tb >= t1 - .01: break
        if 'bass' in layers:
            pat = [(0, 1.5), (1.5, .5), (2, 1), (3, 1)] if 'swingbass' not in layers else [(0, 1), (1, 1), (2, 1), (3, 1)]
            for i, (b, d) in enumerate(pat):
                m = M(ROOT[ch]) + transpose + (12 if i == 1 else 0) + (7 if 'swingbass' in layers and i == 2 else 0)
                BUS['bass'].add(bass(d * bt * .9, m, .55), tb + b * bt, 1.)
        if 'kick' in layers:
            for b in (0, 2): BUS['drums'].add(kick(.8), tb + b * bt, 1.)
        if 'swing' in layers:
            for b in range(4):
                BUS['drums'].add(ride(.35), tb + b * bt, 1., .25); BUS['drums'].add(ride(.22), tb + (b + .5 + swing * .5) * bt, 1., .25)
                if b in (1, 3): BUS['drums'].add(brush(.5), tb + b * bt, 1., -.1)
        if 'vibes' in layers:
            for b in (0, 2.5): [BUS['harm'].add(vibes(M(n) + 12 + transpose, .16), tb + b * bt, 1., -.3) for n in tones]
        if 'surf' in layers:
            for b8 in range(8):
                n = tones[[0, 2, 1, 2, 0, 2, 1, 2][b8]]
                for tr in range(2): BUS['guitar'].add(ks(M(n) + 12 + transpose, bt * .26, .22), tb + (b8 * .5 + tr * .25) * bt, 1., -.35)
            BUS['drums'].add(snare(.45), tb + 1 * bt, 1.); BUS['drums'].add(snare(.45), tb + 3 * bt, 1.)
        if 'arp' in layers:
            for k in range(16):
                n = tones[k % 3] if k % 4 != 3 else tones[0]
                BUS['arp'].add(pluckSq(bt * .2, M(n) + 24 + transpose, .07), tb + k * .25 * bt, 1., .35)
        if 'hats' in layers:
            for k in range(8): BUS['drums'].add(hat(.25), tb + k * .5 * bt, 1., .2)
        if 'strings' in layers:
            BUS['harm'].add(strings_trem(4 * bt, [M(n) + 12 + transpose for n in tones], .22, rise=1.5), tb, 1.)

# home: 2 layers (lead + bass) and a kick
section('home', ['lead', 'bass', 'kick'])
# deli-verse 1: + brushed swing kit, vibes (swung 8ths, walking bass)
section('deli1', ['lead', 'bass', 'swingbass', 'kick', 'swing', 'vibes'], swing=.33)
# deli-verse 2: + surf guitar, square arpeggio, faster
section('deli2', ['lead', 'bass', 'kick', 'surf', 'arp', 'hats'])
# the fall: everything at once, too fast, plus panic strings, a kazoo stinger per floor (shorter each time)
section('fall', ['lead', 'bass', 'kick', 'surf', 'arp', 'hats', 'strings', 'vibes'], transpose=2)
for i, h in enumerate(CUE['fall']['hits']):
    BUS['fx'].add(kazoo([.42, .3, .2, .12][i], M('A4') + i * 2, .55, bend=-2.5), h, 1.)
    BUS['drums'].add(kick(1.0), h, 1.)
LAND = CUE['fall']['t1']
for b in BUS.values(): b.cut(LAND, CUE['bliss']['t0'])          # hard cut on the landing, reverb tails included (applied after verb too)

# bliss: one instrument, the theme on a lone warm Rhodes (D major colour, slower)
c = CUE['bliss']; bt = 60 / c['bpm']
for (b, d, n) in THEME:
    t = c['t0'] + b * bt
    if t > c['t1'] - .4: break
    m = M(n) - 12 + (1 if n.startswith('F') else 0) - (1 if n.startswith('C#') else 0)   # F -> F#, keep it gentle
    BUS['harm'].add(rhodes(d * bt * .9, m, .3), t, 1., .05)
    if b % 4 == 0: [BUS['harm'].add(rhodes(3.6 * bt, M(x) - 12 + (1 if x.startswith('F') else 0), .11), t, 1., -.1) for x in CHORDS[int(b // 4) % 4][1]]
for bb in BUS.values(): bb.cut(CUE['bliss']['t1'] + .05, CUE['lone']['t0'], fade=.25)   # the second silence
# lone: the theme's last phrase on the theremin alone; one kick on the title hit
c = CUE['lone']; bt = 60 / c['bpm']; hit = c['hit']
phrase = [(-2, 1, 'F4'), (-1, 1, 'G4'), (0, 2, 'A4'), (2, 1, 'C#5'), (3, 3, 'D5')]
s, x = theremin([(hit + b * bt, d * bt * .97, M(n)) for b, d, n in phrase], v=.42, vib=.36); BUS['lead'].add(x, s, 1., 0)
BUS['drums'].add(kick(1.1), hit, 1.); BUS['bass'].add(bass(2.4, M('D2'), .5), hit, 1.)

# —— master the stems ——
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
mixb = np.zeros((N, 2))
GAIN = {'drums': .9, 'bass': .8, 'lead': .9, 'harm': .9, 'guitar': .8, 'arp': .7, 'fx': .9}
for k, b in BUS.items():
    y = spring_verb(b.b, .25 if k in ('lead', 'guitar', 'harm') else .08)
    y[int(LAND * SR):int(CUE['bliss']['t0'] * SR)] = 0
    y[int((CUE['bliss']['t1'] + .3) * SR):int(CUE['lone']['t0'] * SR)] *= 0
    sf.write(os.path.join(HERE, 'stems', k + '.wav'), y.astype(np.float32), SR)
    mixb += y * GAIN[k]
mixb = mixb / (np.abs(mixb).max() + 1e-9) * .8
sf.write(os.path.join(HERE, 'score.wav'), mixb.astype(np.float32), SR)
print('score.wav', round(DUR, 2), 's')
