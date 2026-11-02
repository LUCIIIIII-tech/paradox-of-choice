
# ============ Paano Kung Hindi Ka Namamatay: wind, fire and glass, a crowd, a lullaby, rain and bells, the sea, the sun's roar, then silence ============
# (ear-safe: no screams, no screeches, no brake squeals; impacts are soft low thumps; the loudest moments are swells, and silence does the rest)
def thunder(t, v=.3, d=5.0, pan=0.0):                # far thunder: a slow low roll, no crack
    n = int(d * SR); s_ = tt(n); e = (1 - np.exp(-s_ / .6)) * np.exp(-s_ / 1.8) * (1 + .4 * np.sin(2 * np.pi * .9 * s_) ** 2)
    add('amb', t, lp(noise(d), 160) * e * 2.5, v, pan, hall=.4, width=.02)
def rushwind(t0, t1, v=.3):                          # falling: air tearing past the ears, rising in pitch, wide
    d = t1 - t0; n = int(d * SR); s_ = tt(n); u = s_ / d
    for ch, ph in ((0, 0), (1, 1.3)):
        y = tvf(noise(d), 400 + 2200 * u ** 1.5 + 200 * np.sin(2 * np.pi * 3 * s_ + ph), 1.2) * fade(n, .3, .05) * (.6 + .4 * u)
        BUS['lng'][ch, int(t0 * SR):int(t0 * SR) + n] += y[:max(0, min(n, N - int(t0 * SR)))] * v
def crackle(t0, t1, v=.08, pan=0.0):                 # a fire: pops and a roar under them
    d = t1 - t0; n = int(d * SR); add('amb', t0, lp(noise(d), 500) * fade(n, .5, .5) * .5, v, pan); embers(t0, t1, v * .6, pan)
def tinkle(t, n_=12, v=.12, pan=0.0):                # glass settling: little high clinks
    for k in range(n_):
        d = .25; m = int(d * SR); s_ = tt(m); f = rng.uniform(2500, 6000); add('sfx', t + k * rng.uniform(.03, .12), np.sin(2 * np.pi * f * s_) * np.exp(-s_ / .05) * .5, v * rng.uniform(.4, 1), pan + rng.uniform(-.4, .4), room=.2)
def thump(t, v=.4):                                  # a soft, low impact (no crack)
    d = .9; n = int(d * SR); s_ = tt(n); add('sfx', t, (np.sin(2 * np.pi * 48 * s_) * np.exp(-s_ / .18) * 1.2 + lp(noise(d), 180) * np.exp(-s_ / .08)), v, 0, hall=.3)
def horn(t, d=1.2, v=.18, pan=.2):                   # a truck horn far down the road, low and soft
    n = int(d * SR); s_ = tt(n); y = sum(np.sin(2 * np.pi * f * s_) / (k + 1) for k, f in enumerate((138, 174, 207))) * fade(n, .05, .3)
    add('sfx', t, lp(sat(y, 1.5), 1800) * .4, v, pan, hall=.3)
def quake(t, d=2.5, v=.35):                          # the ground shaking: a sub rumble and grinding stone
    n = int(d * SR); s_ = tt(n); e = np.sin(np.pi * s_ / d) ** .7
    add('amb', t, (lp(noise(d), 90) * 2 + bp(noise(d), 200, 900) * .3) * e, v, 0, hall=.2, width=.01)
def beep(t, v=.08):                                  # a monitor beep, soft
    d = .12; n = int(d * SR); s_ = tt(n); add('sfx', t, np.sin(2 * np.pi * 880 * s_) * fade(n, .005, .04) * .5, v, .3, room=.2)
def flatline(t, d=2.5, v=.05):
    n = int(d * SR); s_ = tt(n); add('sfx', t, np.sin(2 * np.pi * 880 * s_) * fade(n, .02, 1.6) * .4, v, .3, room=.2)
def sand(t0, t1, v=.06):                             # sand pouring in the hourglass
    d = t1 - t0; n = int(d * SR); add('sfx', t0, bp(noise(d), 3000, 9000) * (.6 + .4 * np.sin(2 * np.pi * 7 * tt(n)) ** 2) * fade(n, .3, .3) * .4, v, 0, room=.1)
def roar(t0, t1, v=.25):                             # the sun: a vast low roar, slowly breathing
    d = t1 - t0; n = int(d * SR); s_ = tt(n); y = lp(noise(d), 120) * (1 + .3 * np.sin(2 * np.pi * .2 * s_)) * fade(n, 1.0, 1.5) * 2 + bp(noise(d), 300, 1200) * .15 * fade(n, 1, 1.5)
    add('amb', t0, y, v, 0, hall=.4, width=.015)
def boil(t0, t1, v=.1):                              # water boiling off: a seething hiss, bubbles
    d = t1 - t0; n = int(d * SR); add('amb', t0, bp(noise(d), 1500, 7000) * fade(n, 1, 1) * .4, v, -.2, width=.01); bubbles(t0, t1, v * .8, 20)
def lullaby(t0, t1, v=.2):                           # a slow piano lullaby in C (an original phrase): the daughter's theme
    mel = [72, 76, 79, 76, 77, 74, 72, None, 71, 72, 74, 76, 74, 72, None, None]; bass = [48, 53, 55, 48]; t = t0; k = 0
    while t < t1 - 1:
        m = mel[k % len(mel)]
        if m: piano(t, m, v, 2.6, .1)
        if k % 4 == 0: piano(t, bass[(k // 4) % 4], v * .7, 3.6, -.1)
        t += .55; k += 1

fall0, fall1 = S0('fall'), S1('fall'); rise0, rise1 = S0('rise'), S1('rise')
# the fall: air tearing past, fire and glass, the city far below; a soft thump and then a held silence before he breathes
rushwind(fall0, fall1 + .05, .35); crackle(fall0, fall1, .1, .4); tinkle(fall0 + .5, 10, .1); tinkle(fall0 + 2.5, 8, .08)
thump(fall1 - .05, .45); SILENT.append((fall1, rise0 + .7)); breath(rise0 + .5, 1.6, .3, 0)
low_tone(fall0 + .05, 6.0, .3, 31); riser(fall1, 1.6, .2)
# getting up: the crowd's hush, glass under his shoes, the fire above, the curse
murmur_ok = True
try: bed_add('amb', murmur(), shot_env({'rise': 1.0, 'viral': .2}, 0.0), .5)
except Exception: murmur_ok = False
tinkle(wt('h3', 'tumayo') + .2, 14, .12, .1); crackle(rise0, rise1, .07, .5); low_tone(wt('h4', 'sumpa') - .3, 6.0, .34, 29); reverse_swell(wt('h4', 'sumpa'), 1.4, .16)
# viral: notifications, a scroll, the counter ticking
for k in range(6): ping(S0('viral') + .4 + k * .7, .1)
for k in range(24): tick(S0('viral') + .3 + k * .12, .05, 1.6)
# the accidents: a horn and a soft thump; thunder; the earth shaking; each time a low tone
horn(wt('s2', 'truck') - .9, 1.1, .16); thump(wt('s2', 'truck') - .05, .35); thunder(wt('s2', 'kidlat') - .05, .35, 4.0); quake(wt('s2', 'lindol') - .3, 2.6, .35)
for w_ in ('truck', 'kidlat', 'lindol'): low_tone(wt('s2', w_) - .1, 2.5, .18, 33)
# home: the lullaby, a clock
lullaby(S0('family') + .2, S1('family'), .18); clock(S0('family'), S1('mirror'), 1.0, .06)
# the mirror: the clock speeds up as thirty years go by
clock(S0('mirror'), S1('mirror'), .5, .12, 3.0); shimmer(wt('s4', 'Ikaw') - .2, 2.0, .12)
# the funerals: rain, a church bell, the lullaby slowed
churchbell(S0('funeral') + .3, .25); churchbell(wt('s5', 'Sumunod'), .2)
sadpiano(S0('funeral'), S1('graves'), .16)
# the deathbed: the monitor, her voice, then the flat tone fading under silence
t_ = S0('deathbed') + .2
while t_ < E('L2') + .3: beep(t_, .07); t_ += .9
flatline(E('L2') + .4, 2.8, .05); HUSH.append((E('L2') + .3, S1('deathbed'))); low_tone(E('L2') + .2, 6.0, .3, 29)
# the graves: wind through grass, birds by day, crickets by night
wind(S0('graves'), S1('graves'), .12); birds(S0('graves'), S1('graves'), .06)
# new names: the cards dropping one by one, a clock
for k in range(10): paper(S0('names') + k * SPAN('s8') / 10, .3, .14, (k % 3 - 1) * .3)
# the question: sand running, a low held tone
sand(S0('cta'), S1('cta'), .08); low_tone(S0('cta'), 6.0, .22, 36)
# a thousand years: the sea, gulls (birds), then under the water: bubbles and the muffled deep
waves(S0('flood'), S1('flood'), .22); birds(S0('flood'), wt('s10', 'bahay') - 1.5, .05); bubbles(wt('s10', 'bahay') - 1.4, S1('flood'), .12)
whoosh(wt('s10', 'bahay') - 1.3, 1.2, .14, 150, 1500, 0, 0, 1.6)
# a million years: a strange pad; then alone by the fire
pad(S0('future'), T('s12'), (50, 57, 62, 66), .1); crackle(T('s12') - .3, S1('future'), .08, .3)
# the sun: the roar, the boiling sea
roar(S0('sun'), S1('swallow') + 1, .3); boil(wt('s13', 'Kumukulo') - .3, S1('sun'), .1)
# swallowed: the deepest swell; then (drift) nothing but a slow heartbeat
low_tone(wt('s14', 'Nilamon') - .3, 7.0, .4, 26); braam(wt('s14', 'Nilamon') - .1, .35, 3.0)
HUSH.append((S0('drift'), S1('dark') - .2))
for k in range(4): heartbeat(S0('drift') + .6 + k * 1.3, .18)
shimmer(S0('stars') + .2, 3.0, .12); shimmer(wt('s16', 'Isa-isang'), 3.5, .1)
for k in range(3): heartbeat(S0('dark') + .4 + k * (1.6 + .5 * k), .14 - .03 * k)
SILENT.append((E('s17') + .2, S0('memory') + .3))
# the memory: the lullaby again, birds, warm air; the end: the lullaby carries it home
lullaby(T('L3') - 1.2, S1('end'), .2); birds(S0('memory'), S1('memory'), .06); pad(S0('end'), S1('end'), (48, 55, 60, 64), .1)
low_tone(wt('s20', 'yakapin') - .2, 5.0, .22, 36)
# the loop back to the fall
rushwind(S0('loop'), DUR, .3)
