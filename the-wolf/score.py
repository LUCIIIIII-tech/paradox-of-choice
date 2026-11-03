"""Sound for The Wolf (sample): python3 score.py -> out/mix.wav (48 kHz stereo). Needs numpy + soundfile, and timeline.json from tts.py.
A slow noir walking bass with brushes under the dialogue (ducked whenever someone speaks), old-record crackle, and the hits the picture
asks for: a chime on the diamond, a thump for each of the four words, coins clinking as the stacks grow, the lamp clicking off into a
low boom for the eyes in the dark."""
import os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
SR = 48000
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); DUR = TL['dur']; LN = {l['id']: l for l in TL['lines']}
N = int(DUR * SR) + SR // 2
rng = np.random.default_rng(7)
music, fx, vo = np.zeros(N), np.zeros(N), np.zeros(N)
def word(id, w): return next((a for x, a, b in LN[id]['words'] if x.lower().startswith(w.lower())), LN[id]['t0'])
def add(buf, t, y, g=1.0):
    i = int(t * SR); y = y[:max(0, N - i)]; buf[i:i + len(y)] += g * y
def env(n, a=.005, r=.2):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / r)
def lp(y, k):                       # one-pole low-pass, k in (0,1): smaller is darker
    o = np.empty_like(y); s = 0.0
    for i, v in enumerate(y): s += k * (v - s); o[i] = s
    return o

# ---- upright bass: Karplus-Strong plucks walking down a D minor line, 84 bpm ----
def pluck(f, d=.7, g=1.0):
    n = int(d * SR); p = int(SR / f); buf = rng.uniform(-1, 1, p); buf = lp(buf, .25); out = np.empty(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return lp(out, .18) * env(n, .004, .45) * g
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
beat = 60 / 84; walk = [38, 41, 43, 44, 45, 43, 41, 40, 38, 45, 43, 41, 40, 38, 37, 38]
END_MUSIC = LN['w3']['t1'] + .1
for k, m in enumerate(walk):
    t = .05 + k * beat
    if t < END_MUSIC: add(music, t, pluck(NOTE(m), beat * 1.1), .55)
# brushes: a soft swish on 2 and 4, a tap on the off-beats
for k in range(40):
    t = .05 + k * beat / 2
    if t >= END_MUSIC: break
    n = int(.18 * SR); sw = lp(rng.normal(0, 1, n), .5) - lp(rng.normal(0, 1, n), .05)
    add(music, t, sw * env(n, .03 if k % 4 in (2, 0) else .002, .08 if k % 2 else .03), .05 if k % 2 == 0 else .025)
# a low piano chord on the first frame (Dm9 voicing), and a tense one when the wolf leans in for "ever since"
def piano(ms, d=2.5, g=.12):
    n = int(d * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for m in ms:
        f = NOTE(m); y += sum(np.sin(2 * np.pi * f * h * t) * (.6 ** h) for h in range(1, 5)) * np.exp(-t * (1.2 + f / 900))
    return y * env(n, .004, 9) * g
add(music, .02, piano([50, 53, 57, 60, 64]))
add(music, word('w3', 'ever') - .05, piano([49, 52, 55, 58, 62], 1.6, .1))

# ---- hits ----
def chime(f=2093, d=2.2):
    n = int(d * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * dcy) for r, a, dcy in [(1, 1, 2.2), (2.76, .5, 4), (5.4, .25, 7), (1.5, .3, 3)])
add(fx, word('w2', 'a') - .02, chime() * .09); add(fx, word('w2', 'a') + .12, chime(3136) * .05)
def thump(d=.35):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (90 * np.exp(-t * 8) + 45) * t) * np.exp(-t * 12) + lp(rng.normal(0, 1, n), .3) * np.exp(-t * 40) * .4)
four = word('w2', 'four')
for k in range(3): add(fx, four + k * .2, thump() * .3)
def clink(f):
    n = int(.25 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * 26) for r, a in [(1, 1), (2.3, .6), (3.9, .35), (5.1, .2)])
t0c, t1c = LN['w3']['t0'], word('w3', 'ever')
for i in range(26): add(fx, t0c + (t1c - t0c) * (i / 26) ** .8 + rng.uniform(0, .05), clink(rng.uniform(2600, 4200)) * rng.uniform(.03, .07))
dark = LN['w3']['t1'] + .05
n = int(.06 * SR); add(fx, dark, lp(rng.normal(0, 1, n), .6) * env(n, .001, .012) * .5)                # the lamp switch
n = int(2 * SR); tt = np.arange(n) / SR
add(fx, dark + .02, (np.sin(2 * np.pi * (52 * np.exp(-tt * .6)) * tt) * np.exp(-tt * 1.6) + lp(rng.normal(0, 1, n), .02) * np.exp(-tt * 2) * 2) * .35)   # low boom
n = int((DUR - dark) * SR); tt = np.arange(n) / SR
add(fx, dark + .1, np.sin(2 * np.pi * 36.7 * tt) * np.minimum(1, tt / .4) * np.exp(-tt * .5) * .12)        # a drone under the eyes

# ---- the voices; the music ducks under them ----
for l in TL['lines']:
    y, sr = sf.read(os.path.join(HERE, 'voices', l['id'] + '.wav')); y = y if y.ndim == 1 else y.mean(1)
    add(vo, l['t0'], y / (np.abs(y).max() + 1e-9) * .8)
duck = np.ones(N)
for l in TL['lines']:
    a, b = int((l['t0'] - .08) * SR), int((l['t1'] + .1) * SR); duck[max(0, a):b] = .38
k = int(.08 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same')

# ---- old record: crackle and a little hiss ----
crack = np.zeros(N); pos = rng.integers(0, N, int(DUR * 40)); crack[pos] = rng.uniform(-1, 1, len(pos)) * rng.uniform(.1, 1, len(pos)) ** 2
crack = lp(crack, .6) * .25 + lp(rng.normal(0, 1, N), .15) * .004

mix = music * duck * .9 + fx + vo + crack
# roll the top off a little: an old optical soundtrack
mix = lp(mix, .55)
fade = np.ones(N); fl = int(.25 * SR); end = int(DUR * SR); fade[end - fl:end] = np.linspace(1, 0, fl); fade[end:] = 0
mix *= fade
mix = mix / (np.abs(mix).max() + 1e-9) * .89
st = np.stack([mix, mix], 1)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), st[:end], SR)
print('mix', round(DUR, 2), 's')
