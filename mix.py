"""Mix: procedural foley (events.json) + dialogue (voices/) + score (music/score.wav, ducked under dialogue) + one ambience per world -> mix.wav
Usage: python mix.py   (after core/render/events.mjs, voice.py and music/score.py). Needs LIB in the environment for core/audio/sfx.py."""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, click, clack, whoosh, pop, thump, compress, limit, add
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.signal import fftconvolve
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
LINES = {l['id']: l for l in json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))}
rng = np.random.default_rng(9)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def brown_(d): w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return norm(hp(w, 20))
def fade(x, a=.005, r=.02):
    n = len(x); x = x.copy(); A, R = min(n, int(a * SR)), min(n, int(r * SR)); x[:A] *= np.linspace(0, 1, A); x[n - R:] *= np.linspace(1, 0, R); return x
def sweep(f0, f1, d, curve=1.0): tt = t_(d); f = f0 * (f1 / f0) ** ((tt / d) ** curve); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def bpsweep(x, f0, f1, q=.35):
    out = np.zeros_like(x); n = len(x)
    for i in range(0, n, 480):
        f = f0 * (f1 / f0) ** (i / n); s = bp(x[max(0, i - 2400):i + 480], f * (1 - q), min(f * (1 + q), 20000)); out[i:i + 480] = s[-len(out[i:i + 480]):]
    return out
sfxb, vob, amb = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))

# —— foley (all synthesized) ——
def impact():   # frame-one hit: sub thump + bright slap
    d = .8; tt = t_(d); sub = np.sin(2 * np.pi * np.cumsum(42 + 80 * np.exp(-tt / .05)) / SR) * env_exp(d, .25)
    return norm(sub + bp(nz(d), 800, 6000) * env_exp(d, .03) * .7)
def whip(): d = .32; return norm(bpsweep(nz(d), 5000, 600, .4) * np.sin(np.pi * t_(d) / d) ** 2)
def fridge_hum(d):
    tt = t_(d); x = (np.sin(2 * np.pi * 60 * tt) * .5 + np.sin(2 * np.pi * 120 * tt) * .35 + np.sin(2 * np.pi * 180 * tt) * .12) * (1 + .1 * np.sin(2 * np.pi * .7 * tt))
    return fade(norm(x + lp(brown_(d), 300) * .3), .02, .3)
def tic(): d = .04; return norm(np.sin(2 * np.pi * 3200 * t_(d)) * env_exp(d, .008))
def cloth(): d = .3; return norm(lp(nz(d), 1500) * np.sin(np.pi * t_(d) / d) ** 2)
def rclick():   # remote button: plastic click + a beep
    x = click(.8); b = np.sin(2 * np.pi * 1480 * t_(.08)) * env_exp(.08, .04) * .5; y = np.zeros(int(.12 * SR)); y[:len(x)] += x; y[int(.025 * SR):int(.025 * SR) + len(b)] += b; return norm(y)
def portal_open():
    d = 1.5; tt = t_(d)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-tt / .12)) / SR) * env_exp(d, .45)
    down = bpsweep(nz(d), 6000, 300, .4) * env_exp(d, .5)
    swirl = np.sin(2 * np.pi * np.cumsum(300 + 520 * (tt / d) + 140 * np.sin(2 * np.pi * 7 * tt)) / SR) * np.sin(np.pi * np.minimum(tt / d, 1)) * .3
    return norm(boom + down * .7 + swirl)
def portal_hum(d):
    tt = t_(d); lfo = np.sin(2 * np.pi * .8 * tt)
    x = np.sin(2 * np.pi * 62 * tt + 2 * np.sin(2 * np.pi * 3 * tt)) * .5 + np.sin(2 * np.pi * 124.5 * tt) * .25 + bp(nz(d), 400, 1100) * (.5 + .3 * lfo) * .5
    x += np.sin(2 * np.pi * np.cumsum(460 + 70 * lfo) / SR) * .08
    return fade(norm(x), .2, .3)
def portal_close(): d = .45; x = bpsweep(nz(d), 300, 3000, .4)[::-1] * np.linspace(0, 1, int(d * SR)) ** 2; return norm(np.concatenate([x, thump(1, 58) * .9]))
def portal_whoosh(): d = .4; x = bpsweep(nz(d), 400, 4200, .3) * np.sin(np.pi * t_(d) / d) ** 2; return norm(x + np.sin(2 * np.pi * np.cumsum(np.linspace(200, 900, len(x))) / SR) * np.sin(np.pi * t_(d) / d) * .3)
def suck(): d = .35; x = bpsweep(nz(d), 3000, 250, .4) * np.linspace(.3, 1, int(d * SR)); return norm(np.concatenate([x, pop(.8)[:int(.12 * SR)] * .6]))
def boing(): d = .7; tt = t_(d); f = 170 * (1 + .35 * np.sin(2 * np.pi * 16 * tt) * np.exp(-tt / .25)) * (1 + .6 * np.exp(-tt / .04)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .22))
def thud(): return norm(thump(1, 68) + np.pad(lp(nz(.15), 1200) * env_exp(.15, .03), (0, int(.2 * SR))))
def step(): d = .07; return norm(lp(nz(d), 900) * env_exp(d, .015) + np.sin(2 * np.pi * 110 * t_(d)) * env_exp(d, .02) * .6)
def gulp(): d = .24; x = sweep(420, 110, d, .6) * env_exp(d, .07); x[:int(.01 * SR)] += bp(nz(.01), 500, 3000) * .8; return norm(lp(x, 1200))
def stretch():   # the neck pillow pulled like a rubber band
    d = .3; tt = t_(d); f = 220 + 600 * (tt / d) ** 1.5; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + .5 * np.sin(2 * np.pi * 40 * tt)) * np.sin(np.pi * tt / d))
def bubble(f0=300, f1=900, d=.07): return sweep(f0, f1, d, .8) * np.sin(np.pi * t_(d) / d)
def glorp():
    d = .5; tt = t_(d); f = 240 + 480 * np.sin(np.pi * tt / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + .6 * np.sin(2 * np.pi * 28 * tt)) * np.sin(np.pi * tt / d)
    out = np.zeros(int(.5 * SR))
    for k in range(7): b = bubble(150 + rng.random() * 200, 400 + rng.random() * 400, .05 + rng.random() * .04); s = int(rng.random() * .42 * SR); out[s:s + len(b)] += b
    return norm(lp(x, 1800) + lp(out, 2000) * .5)
def lick(): d = .35; return norm(bpsweep(nz(d), 1300, 400, .5) * np.sin(np.pi * t_(d) / d))
def slide(): d = .35; tt = t_(d); return norm(bp(nz(d), 500, 2500) * (.6 + .4 * np.sin(2 * np.pi * 22 * tt)) * np.sin(np.pi * tt / d))
def squeak(): d = .09; tt = t_(d); return norm(np.sin(2 * np.pi * (2000 + 500 * np.sin(2 * np.pi * 30 * tt)) * tt) * np.sin(np.pi * tt / d))
def wind(d): tt = t_(d); x = bpsweep(nz(d), 300, 1400, .6) * np.minimum(1, tt / .3); return fade(norm(x + lp(brown_(d), 500) * .6), .05, .02)
def fwump():
    d = .3; x = bpsweep(nz(d), 2500, 200, .4) * env_exp(d, .1); th = thump(.8, 70)
    y = np.zeros(max(len(x), len(th))); y[:len(x)] += x; y[:len(th)] += th * .8; return norm(y)
def crinkle(): d = .45; tt = t_(d); return norm(hp(nz(d), 2500) * (rng.random(len(tt)) > .7) * np.sin(np.pi * tt / d) ** .5)
def chomp(): x = np.zeros(int(.3 * SR)); a = clack(1.3); b = clack(1.1); x[:len(a)] += a; x[int(.07 * SR):int(.07 * SR) + len(b)] += b; x[:int(.15 * SR)] += lp(nz(.15), 3000) * env_exp(.15, .03) * .5; return norm(lp(x, 4000))
def chew(): d = .16; return norm(lp(nz(d), 1100) * np.sin(np.pi * t_(d) / d) ** 2)
def slam(): d = .9; tt = t_(d); boom = np.sin(2 * np.pi * np.cumsum(44 + 80 * np.exp(-tt / .05)) / SR) * env_exp(d, .28); return norm(boom + bp(nz(d), 1000, 6000) * env_exp(d, .04) * .5)
def whoosh_big(): return whoosh(.45)

FX = {'impact': (impact, .7), 'whip': (whip, .5), 'tic': (tic, .15), 'cloth': (cloth, .15), 'click': (rclick, .45), 'portalOpen': (portal_open, .7),
      'portalClose': (portal_close, .5), 'portalWhoosh': (portal_whoosh, .45), 'suck': (suck, .4), 'boing': (boing, .4), 'thud': (thud, .5), 'step': (step, .25),
      'gulp': (gulp, .5), 'stretch': (stretch, .35), 'glorp': (glorp, .55), 'lick': (lick, .35), 'slide': (slide, .3), 'squeak': (squeak, .15), 'fwump': (fwump, .5),
      'crinkle': (crinkle, .3), 'chomp': (chomp, .5), 'chew': (chew, .14), 'slam': (slam, .55), 'pop': (lambda: pop(1), .35), 'whooshBig': (whoosh_big, .45)}
for e in E['ev']:
    ty, t, v = e['type'], e['t'], e.get('v', 1.0)
    if ty in FX: f, gdb = FX[ty]; add(sfxb, f() * v, t, gdb, float(rng.uniform(-.2, .2)))
    elif ty == 'portalHum': add(sfxb, portal_hum(e['d']) * v, t, .14)
    elif ty == 'fridgeHum': add(sfxb, fridge_hum(e['d']) * v, t, .05)
    elif ty == 'wind': add(sfxb, wind(e['d']) * v, t, .3)

# —— one ambience per world ——
def murmur(d, level=.03):
    tt = t_(d); x = np.zeros_like(tt)
    for k in range(6):
        am = uniform_filter1d((rng.random(len(tt)) > .9995).astype(float), int(.25 * SR)) * 60
        x += bp(nz(d), 300 + k * 90, 900 + k * 150) * np.clip(am, 0, 1)
    return norm(x) * level
def fluo(d, level=.02, buzz=0):
    tt = t_(d); x = sum(a * np.sin(2 * np.pi * f * tt) for f, a in [(120, 1), (240, .5), (360, .3), (480, .15)]) * level
    if buzz: x += bp(nz(d), 2000, 6000) * level * .25 * (1 + np.sin(2 * np.pi * 120 * tt)) * .5
    return x
def highway(d):
    out = lp(brown_(d), 250) * .02
    for k in range(int(d / 3.5)):
        c = bpsweep(nz(2.4), 300, 900, .5) * np.sin(np.pi * t_(2.4) / 2.4) ** 2 * .035; s = int((k * 3.5 + rng.random()) * SR)
        if s + len(c) < len(out): out[s:s + len(c)] += c
    return out
for e in E['ev']:
    if e['type'] != 'amb': continue
    t, d, w = e['t'], e['d'], e['w']
    if w == 'home': x = lp(brown_(d), 400) * .02
    elif w == 'deli1': x = murmur(d, .03) + lp(brown_(d), 400) * .015
    elif w == 'deli2': x = fluo(d, .012) + hp(nz(d), 4000) * .004
    elif w == 'fall': continue
    elif w == 'gas': x = fluo(d, .02, buzz=1) + highway(d)
    elif w == 'title': x = fluo(d, .012, buzz=1)
    add(amb, fade(x, .03, .05), t, 1.0)

# —— dialogue: compress, balance by RMS, pan by speaker, a short room ——
for e in E['ev']:
    if e['type'] != 'vo': continue
    L = LINES[e['id']]
    y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    y = compress(y / np.abs(y).max(), .28, 3.2)
    y = y / (np.sqrt((y ** 2).mean()) + 1e-9) * .12 * L.get('gain', 1.0)
    pan = {'OONA': -.1, 'BENNY': .1}[L['who']]
    add(vob, y, e['t'], {'OONA': 1.0, 'BENNY': .94}[L['who']], pan)
er = np.zeros(int(.09 * SR)); er[0] = 1
for dly, gdb in [(.011, .22), (.019, .16), (.031, .11), (.047, .07), (.067, .04)]: er[int(dly * SR)] += gdb
vob = np.stack([fftconvolve(vob[:, c], er)[:N] for c in range(2)], 1)

# —— score + ducking (~ -7 dB under dialogue) ——
mus, _ = sf.read(os.path.join(HERE, 'music', 'score.wav'))
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = (np.abs(vob).max(1) > .01).astype(float)
duck = 1 - .55 * np.clip(uniform_filter1d(maximum_filter1d(act, int(.3 * SR)), int(.15 * SR)), 0, 1)
mix = mus * .45 * duck[:, None] + sfxb * .85 + vob * 1.0 + amb * .9
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
def rms_db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print('mix peak %.3f  rms %.1f dB | voice %.1f  music %.1f  sfx %.1f  amb %.1f' % (np.abs(mix).max(), rms_db(mix), rms_db(vob), rms_db(mus * .45 * duck[:, None]), rms_db(sfxb * .85), rms_db(amb)))
