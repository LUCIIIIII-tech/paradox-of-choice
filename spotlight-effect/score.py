"""Score + sound design for Spotlight Effect -> mix.wav (48 kHz stereo). numpy only, everything synthesised.
Symphonic jazz of the 1920s-30s: piano, pizzicato/walking bass, clarinet, muted trumpet, string tremolo, bells, harp, brushes.
120 bpm (one beat = 0.5 s); every hit is placed on the times in story.js.
Usage: python3 score.py"""
import os, wave, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000; DUR = 90.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
REV = np.zeros(N)          # reverb send (mono)

def m2f(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def n(s):                  # 'F#4' / 'Bb3' -> midi
    k = NOTE[s[0]]; i = 1
    while s[i] in '#b': k += 1 if s[i] == '#' else -1; i += 1
    return k + 12 * (int(s[i:]) + 1)

def add(t, x, gain=1.0, pan=0.0, rev=0.25):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * l * 1.414; R[i:i + len(x)] += x * r * 1.414; REV[i:i + len(x)] += x * rev

def env(nn, a=.005, d=None, rel=.05, sus=1.0):
    t = np.arange(nn) / SR; e = np.minimum(1, t / max(a, 1e-4))
    if d is not None: e *= np.exp(-t / d)
    if rel: r = int(rel * SR); r = min(r, nn); e[-r:] *= np.linspace(1, 0, r)
    return e * sus

def lowpass(x, k=5):
    if k <= 1: return x
    return np.convolve(x, np.ones(k) / k, mode='same')
def hp(x, a=.95): y = x.copy(); y[1:] = x[1:] - a * x[:-1]; return y

# ---------- instruments ----------
def piano(f, dur=1.2, vel=.6):
    nn = int((dur + .6) * SR); t = np.arange(nn) / SR; y = np.zeros(nn)
    B = 0.0004
    for k in range(1, 10):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 16000: break
        y += np.sin(2 * np.pi * fk * t + k) * (1 / k ** 1.25) * np.exp(-t * (0.9 + .55 * k) * (f / 260) ** .35)
    y *= np.minimum(1, t / .003)
    off = int(dur * SR); y[off:] *= np.exp(-np.arange(nn - off) / SR / .09)
    ham = rng.standard_normal(int(.01 * SR)) * np.linspace(1, 0, int(.01 * SR)) * .15
    y[:len(ham)] += ham
    return y * vel * .5

def chord(t, notes, dur=1.0, vel=.45, pan=0.0, spread=.012):
    for j, m in enumerate(notes): add(t + j * spread, piano(m2f(m), dur, vel), pan=pan + (j - len(notes) / 2) * .08, rev=.3)

def bass(f, dur=.45, vel=.7, walk=False):
    nn = int((dur + .15) * SR); t = np.arange(nn) / SR; y = np.zeros(nn)
    dec = .9 if walk else .35
    for k, a in enumerate([1, .55, .3, .16, .08], 1): y += np.sin(2 * np.pi * f * k * t) * a * np.exp(-t * k * (1 / dec))
    y *= np.minimum(1, t / .004); y[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR))
    return y * vel * .36

def clarinet(f, dur, vel=.4, vib=1.0):
    nn = int(dur * SR); t = np.arange(nn) / SR
    v = 1 + .006 * vib * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / .25)
    ph = 2 * np.pi * np.cumsum(f * v) / SR; y = np.zeros(nn)
    for k, a in [(1, 1), (3, .45), (5, .22), (7, .12), (9, .06), (2, .05)]: y += np.sin(k * ph) * a
    y = lowpass(y, 3) * env(nn, .05, None, .08)
    y += rng.standard_normal(nn) * .01 * env(nn, .05, None, .08)
    return y * vel * .5

def trumpet(f, dur, vel=.4, wah=0.0):
    nn = int(dur * SR); t = np.arange(nn) / SR
    v = 1 + .005 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .2)
    ph = 2 * np.pi * np.cumsum(f * v) / SR; y = np.zeros(nn)
    bright = .6 + .4 * np.sin(2 * np.pi * 2.0 * t) ** 2 * wah if wah else .7
    for k in range(1, 12):
        fk = f * k; form = np.exp(-((fk - 1500) / 900) ** 2) + .35 * np.exp(-((fk - 700) / 500) ** 2)
        y += np.sin(k * ph) * form * (bright if k > 2 else 1)
    y *= env(nn, .03, None, .06)
    return y * vel * .3

def strings(f, dur, vel=.3, trem=0.0, swell=0.4):
    nn = int(dur * SR); t = np.arange(nn) / SR; y = np.zeros(nn)
    for det in (-.004, 0, .005):
        ph = 2 * np.pi * f * (1 + det) * t + det * 900
        for k in range(1, 9): y += np.sin(k * ph) / k * (.9 ** k)
    y = lowpass(y, 4)
    if trem: y *= .65 + .35 * np.sin(2 * np.pi * trem * t) ** 2
    y *= env(nn, swell, None, .3)
    return y * vel * .18

def bell(f, dur=2.0, vel=.35):
    nn = int(dur * SR); t = np.arange(nn) / SR; y = np.zeros(nn)
    for r, a, d in [(1, 1, 1.4), (2.76, .5, .6), (5.4, .3, .3), (8.93, .16, .15), (.5, .2, 1.8)]: y += np.sin(2 * np.pi * f * r * t) * a * np.exp(-t / d)
    y *= np.minimum(1, t / .002)
    return y * vel * .35

def brush(dur=.25, vel=.25, swish=False):
    nn = int(dur * SR); t = np.arange(nn) / SR
    x = hp(rng.standard_normal(nn), .7)
    e = (np.minimum(1, t / (.08 if swish else .002)) * np.exp(-t / (.12 if swish else .05)))
    return lowpass(x, 2) * e * vel * .75

def kick(vel=.6):
    nn = int(.35 * SR); t = np.arange(nn) / SR
    f = 50 + 70 * np.exp(-t * 30); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return y * vel * .55

def crash(dur=2.5, vel=.35):
    nn = int(dur * SR); t = np.arange(nn) / SR
    x = hp(hp(rng.standard_normal(nn), .9), .9) * np.exp(-t / .8) * np.minimum(1, t / .002)
    return x * vel * .3

def harp_gliss(t0, notes, span=.6, vel=.3, pan=0.0):
    for j, m in enumerate(notes):
        f = m2f(m); nn = int(1.6 * SR); tt = np.arange(nn) / SR
        y = sum(np.sin(2 * np.pi * f * k * tt) / k ** 1.6 * np.exp(-tt * (1.4 + k * .9)) for k in range(1, 6)) * np.minimum(1, tt / .002)
        add(t0 + span * j / len(notes), y * vel * .4, pan=pan + (j / len(notes) - .5) * .6, rev=.45)

# ---------- sound effects ----------
def sfx_switch(t, vel=.8):      # knife-switch "chunk" + filament hum start
    nn = int(.3 * SR); tt = np.arange(nn) / SR
    click = hp(rng.standard_normal(nn), .5) * np.exp(-tt * 80) * .5
    thump = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 18)
    add(t, (click + thump) * vel, rev=.2)
    nh = int(1.2 * SR); th = np.arange(nh) / SR
    hum = (np.sin(2 * np.pi * 120 * th) + .3 * np.sin(2 * np.pi * 240 * th)) * np.exp(-th * 2.5) * np.minimum(1, th / .05)
    add(t, hum * .06 * vel, rev=.1)

def sfx_glass(t):
    nn = int(1.4 * SR); tt = np.arange(nn) / SR
    x = hp(hp(rng.standard_normal(nn), .95), .95) * np.exp(-tt * 6) * .35
    for k in range(14):
        f = 2600 + rng.random() * 5200; st = rng.random() * .35
        y = np.sin(2 * np.pi * f * tt) * np.exp(-np.maximum(0, tt - st) * (14 + rng.random() * 20)) * (tt >= st)
        x += y * .12
    add(t, x, pan=.2, rev=.35)

def sfx_tick(t, vel=.3, pitch=2600):
    nn = int(.05 * SR); tt = np.arange(nn) / SR
    y = (np.sin(2 * np.pi * pitch * tt) + hp(rng.standard_normal(nn), .3) * .5) * np.exp(-tt * 140)
    add(t, y * vel, rev=.15)

def sfx_door(t, vel=.5):        # heavy deco doors: low thud + metal ring
    nn = int(1.2 * SR); tt = np.arange(nn) / SR
    y = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 7) + .2 * np.sin(2 * np.pi * 410 * tt) * np.exp(-tt * 3) + .1 * np.sin(2 * np.pi * 1130 * tt) * np.exp(-tt * 4)
    add(t, y * vel, rev=.35)

def sfx_whoosh(t, dur=.45, vel=.25, up=True):
    nn = int(dur * SR); tt = np.arange(nn) / SR
    x = rng.standard_normal(nn); k = np.linspace(9, 2, nn) if up else np.linspace(2, 9, nn)
    y = np.zeros(nn); w = 64
    for s in range(0, nn, w):            # time-varying lowpass by block
        kk = int(k[s]); y[s:s + w] = lowpass(x[max(0, s - 16):s + w + 16], kk)[min(s, 16):min(s, 16) + len(y[s:s + w])]
    y *= np.sin(np.pi * tt / dur) ** 2
    add(t, y * vel, rev=.3)

def sfx_pop(t, vel=.35):
    nn = int(.12 * SR); tt = np.arange(nn) / SR
    f = 500 + 900 * np.exp(-tt * 40); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 35)
    add(t, y * vel, rev=.2)

def sfx_clang(t, vel=.55):      # bronze clang
    nn = int(3.0 * SR); tt = np.arange(nn) / SR; y = np.zeros(nn)
    for r, a, d in [(1, 1, 1.6), (1.51, .7, 1.1), (2.37, .5, .7), (3.11, .35, .5), (4.6, .2, .3)]: y += np.sin(2 * np.pi * 196 * r * tt) * a * np.exp(-tt / d)
    y *= np.minimum(1, tt / .001)
    add(t, y * vel * .3, rev=.4)

# ================= the score =================
B = .5   # beat

# ---- HOOK 0-6: slam, crash, tremolo, heartbeat
sfx_switch(0.04, 1.0)
chord(0.05, [n('D2'), n('A2'), n('D3'), n('Eb3')], 2.0, .8)
add(0.05, crash(2.5, .5), pan=-.2)
add(0.05, strings(m2f(n('D4')), 3.4, .45, trem=12, swell=.05))
add(0.05, strings(m2f(n('Eb4')), 3.4, .3, trem=12, swell=.05), pan=.3)
sfx_whoosh(0.2, .7, .3)
sfx_glass(1.0); add(1.0, kick(.7)); chord(1.0, [n('D1'), n('D2')], 1.5, .7)
for i, tt in enumerate(np.arange(3.5, 6.0, B)):          # heartbeat pizz on D
    add(tt, bass(m2f(n('D2')), .3, .7)); add(tt + .18, bass(m2f(n('D2')), .25, .4))
add(3.5, strings(m2f(n('A3')), 2.6, .3, trem=10, swell=1.0), pan=-.3)
harp_gliss(5.5, [n(x) for x in ['D3', 'F3', 'A3', 'D4', 'F4']], .45, .25)

# ---- TANGO 6-18 (D minor). bars of 2 s
prog = [('D2', ['D3', 'F3', 'A3']), ('A1', ['C#3', 'E3', 'G3']), ('D2', ['D3', 'F3', 'A3']), ('G1', ['D3', 'G3', 'Bb3']), ('D2', ['D3', 'F3', 'A3']), ('A1', ['C#3', 'E3', 'G3', 'A3'])]
for b, (root, ch) in enumerate(prog):
    t0 = 6.0 + b * 2.0; r = m2f(n(root))
    for off, mult in [(0, 1), (.75, 1.5), (1.0, 1), (1.5, 2)]:       # habanera bass
        add(t0 + off, bass(r * mult if mult != 1.5 else r * 1.4983, .3, .65), pan=-.15)
    chord(t0, [n(x) for x in ch], .18, .35, pan=.1); chord(t0 + 1.0, [n(x) + 12 for x in ch], .18, .3, pan=.1)
    add(t0, brush(.2, .35)); add(t0 + .75, brush(.15, .25)); add(t0 + 1.0, brush(.2, .3)); add(t0 + 1.5, brush(.15, .25))
# bells: one per eye, climbing the D minor arpeggio
arp = [n(x) for x in ['D5', 'F5', 'A5', 'D6', 'F6', 'A6', 'C7', 'D7']]
for tt, m in zip([6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0], arp): add(tt, bell(m2f(m), 1.6, .4), pan=np.sin(tt * 3) * .5, rev=.4)
for k in range(30): add(10.4 + rng.random() * 1.2, bell(m2f(n('A6') + rng.integers(-5, 6)), .5, .08), pan=rng.random() * 1.6 - .8)
# trumpet commentary (muted, wah) under the eyes
for tt, m, d in [(8.0, 'A4', .45), (8.5, 'Bb4', .45), (9.0, 'A4', .9), (10.0, 'G4', .45), (10.5, 'F4', .45), (11.0, 'E4', .9)]: add(tt, trumpet(m2f(n(m)), d, .45, wah=1), pan=.35)
# NAKAKAHIYA: one bell per letter on the beat, then a trill
marq = [n(x) for x in ['D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C6', 'C#6', 'D6', 'F6']]
for i, m in enumerate(marq): add(12.5 + i * .5, bell(m2f(m), 1.2, .38), pan=-.6 + i * .13, rev=.4); sfx_switch(12.5 + i * .5, .25)
for tt, m in [(12.0, 'A4'), (13.0, 'Bb4'), (14.0, 'A4'), (15.0, 'G4'), (16.0, 'F4'), (17.0, 'E4')]: add(tt, clarinet(m2f(n(m)), .95, .45), pan=-.25)
add(17.0, strings(m2f(n('C#4')), 1.0, .3, trem=14, swell=.3)); add(17.0, strings(m2f(n('G4')), 1.0, .25, trem=14, swell=.3), pan=.3)
chord(17.5, [n('A1'), n('A2')], .4, .5)

# ---- 3 A.M. 18-24: silence, only the clock
sfx_tick(18.0, .15)
for k in range(48):                                       # the hands spin: a ratchet that slows down
    u = k / 48; tt = 18.2 + 3.0 * (1 - (1 - u) ** 1.6)
    sfx_tick(tt, .10, 3400)
for tt in np.arange(21.5, 24.0, 1.0): sfx_tick(tt, .28, 2400); sfx_tick(tt + .5, .2, 1900)
for f in (22.5, 23.0):                                     # the replay flicker
    for m in [n('D6'), n('A6')]: add(f, bell(m2f(m), .4, .06), rev=.6)
add(21.2, strings(m2f(n('D3')), 2.8, .12, swell=1.5), pan=-.2)

# ---- PERO ANG TOTOO 24-26.5
harp_gliss(24.05, [n(x) for x in ['C4', 'E4', 'F4', 'A4', 'C5', 'E5', 'F5', 'A5', 'C6']], .9, .35)
add(25.4, bell(m2f(n('C6')), 1.4, .25), rev=.5)
sfx_whoosh(26.0, .5, .25); sfx_door(26.5, .6)

# ---- FOXTROT 26.5-44 (F major): walking bass, brushes on 2 & 4, piano comp, clarinet theme
fox = [('F', ['A3', 'C4', 'E4'], ['F2', 'A2', 'C3', 'A2']), ('D', ['A3', 'C4', 'F4'], ['D2', 'F2', 'A2', 'C3']),
       ('G', ['Bb3', 'D4', 'F4'], ['G2', 'Bb2', 'D3', 'E3']), ('C', ['Bb3', 'E4', 'G4'], ['C3', 'Bb2', 'G2', 'E2']),
       ('F', ['A3', 'C4', 'E4'], ['F2', 'G2', 'A2', 'C3']), ('D', ['A3', 'C4', 'F#4'], ['D3', 'C3', 'A2', 'F#2']),
       ('G', ['Bb3', 'D4', 'F4'], ['G2', 'A2', 'Bb2', 'B2']), ('C', ['Bb3', 'E4', 'G4'], ['C3', 'G2', 'E2', 'C2'])]
theme = [  # (beat offset within an 8-bar phrase, note, beats)
    (0, 'C5', 1), (1, 'A4', 1), (2, 'F4', 1.5), (3.5, 'G4', .5), (4, 'A4', 2), (6, 'C5', 2),
    (8, 'D5', 1), (9, 'C5', 1), (10, 'A4', 1), (11, 'F4', 1), (12, 'G4', 4),
    (16, 'C5', 1), (17, 'A4', 1), (18, 'F4', 1.5), (19.5, 'G4', .5), (20, 'A4', 1), (21, 'F#4', 1), (22, 'A4', 2),
    (24, 'Bb4', 1), (25, 'A4', 1), (26, 'G4', 1), (27, 'E4', 1), (28, 'F4', 4)]
def foxtrot(t0, bars, theme_on=True, vel=1.0, stride=False):
    for b in range(bars):
        tb = t0 + b * 2.0; root, ch, walk = fox[b % 8]
        for k in range(4):
            if stride:   # stride piano: bass on 1 & 3, chord on 2 & 4
                if k % 2 == 0: add(tb + k * B, piano(m2f(n(walk[k]) - 12), .35, .5 * vel), pan=-.2)
                else: chord(tb + k * B, [n(x) for x in ch], .25, .35 * vel, pan=.15, spread=.004)
            add(tb + k * B, bass(m2f(n(walk[k])), .45, .6 * vel, walk=True), pan=-.1)
            add(tb + k * B, brush(.25, .25 * vel, swish=k % 2 == 1), pan=.3)
            if k % 2 == 1 and not stride: chord(tb + k * B, [n(x) for x in ch], .3, .28 * vel, pan=.15, spread=.006)
        add(tb, kick(.25 * vel))
    if theme_on:
        for off, m, d in theme:
            tt = t0 + off * B
            if tt < t0 + bars * 2.0: add(tt, clarinet(m2f(n(m)), d * B * .95, .5 * vel), pan=-.3, rev=.35)

add(26.5, strings(m2f(n('F3')), 2.5, .4, swell=.05)); add(26.5, strings(m2f(n('C4')), 2.5, .35, swell=.05), pan=.2); add(26.5, strings(m2f(n('A4')), 2.5, .3, swell=.05), pan=-.2)
foxtrot(26.5, 8, True, .9)   # 26.5-42.5
for tt in [26.9, 27.3, 27.7, 28.1, 28.6, 29.1, 29.6, 30.1]: sfx_switch(tt, .3); add(tt, bell(m2f(n('C6') + [0, 4, 7, 12][int(tt * 2) % 4]), .9, .2), rev=.4)
for i, tt in enumerate([35.0, 36.0, 37.0, 38.0]): sfx_pop(tt, .45); add(tt, bell(m2f(n(['F5', 'A5', 'C6', 'F6'][i])), 1.0, .3), rev=.4)
for tt, m in [(40.2, 'Eb4'), (40.7, 'D4'), (41.2, 'Eb4'), (41.7, 'D4')]: add(tt, trumpet(m2f(n(m)), .45, .5, wah=1), pan=.4)
chord(42.5, [n('Bb2'), n('D3'), n('F3'), n('A3')], 1.0, .35); chord(43.5, [n('C3'), n('E3'), n('G3'), n('Bb3')], .4, .3)
sfx_whoosh(43.55, .45, .25); sfx_door(44.0, .6)

# ---- SCIENCE 44-68
add(44.5, crash(2.0, .3)); chord(44.5, [n(x) for x in ['F2', 'C3', 'F3', 'A3', 'C4', 'F4']], 2.2, .55)
add(44.5, trumpet(m2f(n('C5')), 1.0, .45), pan=.3); add(44.5, trumpet(m2f(n('A4')), 1.0, .4), pan=-.3)
harp_gliss(45.3, [n(x) for x in ['F4', 'A4', 'C5', 'F5', 'A5', 'C6', 'F6']], .5, .3)
lect = [['F3', 'A3', 'C4', 'E4'], ['Bb2', 'D3', 'F3', 'A3'], ['G2', 'Bb2', 'D3', 'F3'], ['C3', 'E3', 'G3', 'Bb3']]
for b in range(5):                                         # 46.5-56.5: light lecture arpeggios + pizz
    t0 = 46.5 + b * 2.0; ch = lect[b % 4]
    for k, m in enumerate(ch + ch[::-1]): add(t0 + k * .25, piano(m2f(n(m) + 12), .3, .28), pan=.2 - k * .05)
    add(t0, bass(m2f(n(ch[0]) - 12), .4, .55)); add(t0 + 1.0, bass(m2f(n(ch[2]) - 12), .4, .45))
add(48.4, bell(m2f(n('C6')), 1.5, .3), rev=.5); add(48.6, bell(m2f(n('F6')), 1.5, .25), rev=.5)
# the needle rises: a tremolo that climbs with it
nn = int(2.8 * SR); tt = np.arange(nn) / SR; u = np.clip(tt / 2.5, 0, 1); u = u * u * (3 - 2 * u)
f = m2f(n('F3')) * 2 ** (u * 19 / 12); ph = 2 * np.pi * np.cumsum(f) / SR
y = sum(np.sin(k * ph) / k for k in range(1, 7)) * (.65 + .35 * np.sin(2 * np.pi * 13 * tt) ** 2) * np.minimum(1, tt / .3) * np.exp(-np.maximum(0, tt - 2.6) * 10)
add(55.0, y * .12, rev=.35); add(55.0, y * .08, pan=.4)
add(57.5, bell(m2f(n('C6')), 1.6, .35), rev=.5); sfx_tick(57.5, .3, 1500)
add(57.5, strings(m2f(n('C4')), 3.0, .25, trem=16, swell=.1)); add(57.5, strings(m2f(n('F#4')), 3.0, .2, trem=16, swell=.1), pan=.3)
for tt in np.arange(57.5, 60.5, .5): add(tt, bass(m2f(n('C2')), .25, .45))
# the drop: clang + a descending muted-trumpet "wah"
sfx_clang(60.5, .7); add(60.5, kick(.6)); chord(60.5, [n('F1'), n('F2')], 1.5, .6)
nn = int(1.2 * SR); tt = np.arange(nn) / SR; f = m2f(n('C4')) * 2 ** (-np.minimum(tt, 1.0) * 7 / 12)
ph = 2 * np.pi * np.cumsum(f) / SR; y = sum(np.sin(k * ph) * np.exp(-((f * k - 1100) / 700) ** 2) for k in range(1, 10)) * env(nn, .02, None, .2)
add(60.6, y * .2, pan=.3, rev=.3)
for b in range(3):                                         # 62-68: playful pizz + piano in F
    t0 = 62.0 + b * 2.0; ch = [['F3', 'A3', 'C4'], ['G3', 'Bb3', 'D4'], ['C3', 'E3', 'G3']][b]
    for k in range(4): add(t0 + k * B, bass(m2f(n(ch[k % 3]) - 12 + (12 if k == 3 else 0)), .25, .55), pan=-.2)
    chord(t0 + B, [n(x) + 12 for x in ch], .15, .25); chord(t0 + 3 * B, [n(x) + 12 for x in ch], .15, .22)
add(64.5, bell(m2f(n('A6')), 2.0, .45), rev=.5); sfx_switch(64.5, .35)
sfx_whoosh(67.55, .45, .25); sfx_door(68.0, .6)

# ---- LESSON 68-82: Charleston / stride, the theme returns in full
for k in range(3):
    for i in range([6, 12, 18][k]): add(68.3 + k * .5 + (i % 3) * .08 + i * .01, bell(m2f(n(['C6', 'E6', 'G6'][k]) + (i % 3) * 5), .6, .07), pan=np.sin(i) * .7, rev=.5)
foxtrot(68.0, 6, True, 1.0, stride=True)        # 68-80
for b in range(6): add(68.0 + b * 2 + .75, piano(m2f(n('C4')), .12, .25), pan=.3)    # Charleston push
harp_gliss(72.8, [n(x) for x in ['F4', 'A4', 'C5', 'E5', 'F5', 'A5', 'C6', 'E6', 'F6']], .8, .32)
add(77.0, strings(m2f(n('C4')), 2.4, .25, swell=1.5)); add(77.0, strings(m2f(n('E4')), 2.4, .2, swell=1.5), pan=.3)
# the bow: ta-da
add(79.5, crash(1.5, .25)); chord(79.5, [n(x) for x in ['C3', 'G3', 'Bb3', 'E4']], .6, .5)
add(79.5, trumpet(m2f(n('G4')), .3, .45), pan=.3); add(79.85, trumpet(m2f(n('C5')), .8, .5), pan=.3)
# the dance: full band
for b in range(1):
    t0 = 80.2
    for k in range(4):
        add(t0 + k * B, bass(m2f(n(['F2', 'A2', 'C3', 'D3'][k])), .4, .6, walk=True)); add(t0 + k * B, brush(.2, .35, k % 2 == 1)); add(t0 + k * B, kick(.25))
        chord(t0 + k * B + (0 if k % 2 == 0 else 0), [n(x) for x in (['F3', 'A3', 'C4'] if k % 2 else ['F2'])], .25, .4)
    for off, m, d in [(0, 'C5', .5), (.5, 'D5', .5), (1.0, 'F5', .5), (1.5, 'A5', .3)]: add(t0 + off, clarinet(m2f(n(m)), d * .95, .55), pan=-.3); add(t0 + off, trumpet(m2f(n(m) - 5), d * .95, .35), pan=.3)
chord(81.8, [n(x) for x in ['C3', 'E3', 'G3', 'Bb3']], .2, .3)

# ---- END 82-90: the sign, the hit, one last note
for i in range(9): add(82.5 + i * .25, bell(m2f(n(['F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'E6', 'F6', 'A6'][i])), 1.4, .38), pan=-.6 + i * .15, rev=.45); sfx_switch(82.5 + i * .25, .2)
add(84.6, crash(2.4, .35)); add(84.6, kick(.6)); chord(84.6, [n(x) for x in ['F2', 'C3', 'F3', 'A3', 'C4', 'E4']], 2.5, .55)
add(84.6, strings(m2f(n('A4')), 3.0, .3, swell=.05)); add(84.6, strings(m2f(n('F4')), 3.0, .3, swell=.05), pan=-.3); add(84.6, trumpet(m2f(n('C5')), 1.5, .4), pan=.3)
for off, m, d in [(0, 'C5', 1), (1, 'A4', 1), (2, 'F4', 1.5), (3.5, 'G4', .5), (4, 'A4', 2)]: add(86.0 + off * B, clarinet(m2f(n(m)), d * B * .95, .45), pan=-.2, rev=.4)
for k in range(6): add(86.0 + k * B, bass(m2f(n(['F2', 'A2', 'C3', 'A2', 'Bb2', 'C3'][k])), .45, .45, walk=True))
add(88.0, bell(m2f(n('F6')), 2.0, .45), rev=.5); chord(88.0, [n(x) for x in ['F3', 'A3', 'C4', 'F4']], 1.0, .4)
for i in range(6): add(89.0 + i * .1, bell(m2f(n('C7') - i * 3), .6, .12), rev=.5)
add(89.4, piano(m2f(n('F2')), .5, .4)); add(89.4, piano(m2f(n('F3')), .5, .3))

# ---------- reverb (FFT convolution with a decaying noise tail) and master ----------
ir_n = int(1.8 * SR); ti = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-ti / .45) * np.minimum(1, ti / .01); irR = rng.standard_normal(ir_n) * np.exp(-ti / .45) * np.minimum(1, ti / .012)
irL = lowpass(irL, 3); irR = lowpass(irR, 3)
def fconv(x, h):
    m = len(x) + len(h) - 1; F = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
wetL = fconv(REV, irL); wetR = fconv(REV, irR)
wetL *= .5 / (np.abs(wetL).max() + 1e-9) * np.abs(REV).max(); wetR *= .5 / (np.abs(wetR).max() + 1e-9) * np.abs(REV).max()
outL = L + wetL * 1.1; outR = R + wetR * 1.1
# warm room tone so the silence is not digital silence
room = lowpass(rng.standard_normal(N), 40) * .004
outL += room; outR += np.roll(room, 997)
pk = max(np.abs(outL).max(), np.abs(outR).max()); outL /= pk / .89; outR /= pk / .89
outL = np.tanh(outL * 1.2) / np.tanh(1.2); outR = np.tanh(outR * 1.2) / np.tanh(1.2)
fade = int(.3 * SR); outL[-fade:] *= np.linspace(1, 0, fade); outR[-fade:] *= np.linspace(1, 0, fade)
pcm = (np.stack([outL, outR], 1) * 32767 * .95).astype('<i2')
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out', 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote out/mix.wav', round(N / SR, 2), 's')
