# Paano Kung Hindi Ka Namamatay?: design

A dark what-if reel in Tagalog, 1080x1920, about 3 minutes. It lives in `hindi-namamatay/`. The viewer is "ka": a man who cannot die.

## Story

It is a timeline that gets worse as it goes. A year counter at the top rolls up between shots like an odometer.

- **Hook (the first 3 seconds):** He jumps from a burning tower in Makati, forty floors, to escape the fire. The camera falls with him. It cuts to black on "patay ka na". Then he gets up out of the glass on a crushed car roof. Title: PAANO KUNG HINDI KA NAMAMATAY?
- **Year 1:** The video of him reaches 40 million views. A truck, lightning and an earthquake follow, all of them accidents. A counter reads PATAY: 4 BESES.
- **Years 9 to 92:** He has a family. His little girl, Ligaya, asks why he never gets old. Thirty years pass in a mirror: his wife ages beside him and he does not. He buries Nanay, then his wife, then Ligaya, who is old by then ("Pa... huwag mo akong kakalimutan, ha?"). He stands alone among the graves.
- **Years 260 to 5 billion:** He changes his name every 20 years. The CTA comes here: "OO o HINDI". Manila floods, and only the dome of Quiapo stays above the sea. A million years on he is the last speaker of Tagalog. The sun swells and swallows the Earth.
- **The end:** The stars go out, and there is only the dark. In the dark he remembers Ligaya calling "Pa... laro tayo." The reel ends on "the reason every moment matters is death" and "YAKAPIN MO SILA NGAYON." It loops back to the fall.

Nobody harms themselves anywhere in the story. Every way he could have died is an accident or an escape from danger.

## Voices

There are three voices, set by the `voice` field in `lines.json`:

- **Narrator:** VoxCPM2 clone of `voice-tests/18_Vox_deep_narrator.mp3`.
- **`bata`:** the child, cloned from `voice-tests/refs/bata_ref.wav`.
- **`lola`:** the old daughter, made with VoxCPM2 voice design by `hindi-namamatay/make_ref.py`. It is saved as `voice-tests/refs/lola_ref.wav` (take 7, whisper check 0.98).

A line that has a `style` is generated with VoxCPM2 controllable cloning: the voice stays the same and the style steers the emotion, for example "voice breaking, holding back tears". Lines without a style continue from the reference. Every line gets a Whisper check, and a take below 0.72 is retaken with seed 11, then seed 23.

## Picture

The engine is the painted 2.5D canvas engine from `balete/`.

**Files:**
- `main_base.js`, `props.js` and `people.js` are reused.
- `world.js` holds this reel's props:
  - full-height people (`manReal`) and a child's face (`kidFace`)
  - the city, the fire, the glass and the falling man
  - the phone, the truck, the lightning and the rubble
  - the home, the graves, the ID cards and the hourglass
  - the sea, the drowned Quiapo and the bangka
  - the stars, the red giant and the Earth
  - heat shimmer and light leaks
- `shots.js` holds the shots.

**Effects:**
- parallax depth layers and rack focus
- speed streaks, sparks and glass in the fall
- time-lapse ageing in the mirror
- moss and day-night over the graves
- underwater light shafts
- heat shimmer under the red sun
- stars dying one by one
- warm light leaks in the memory

Nothing flashes. Lightning is a bolt with a soft glow, never a full-frame flash, and `flashcheck.py` checks the result against the WCAG rule.

## Sound

`hindi-namamatay/score.py` is built by `out/mkscore.py` from the toolkit in `undas/score.py` plus `score_cues.py`.

- **The fall:** wind tearing past, fire and glass, then a soft thump and silence.
- **Home:** a piano lullaby, the daughter's theme.
- **Time passing:** a clock that speeds up through the mirror shot.
- **Loss:** rain and church bells at the funerals, and a monitor that goes flat.
- **The far future:** the sea and the deep, then the sun's roar.
- **The end:** a heartbeat in the silence, then the lullaby carries it home.

There are no screams, screeches or brake squeals, and soft swells take the place of hits. The mix is -14 LUFS with true peak at -1.5.

## Deliverables

- `hindi-namamatay.mp4`, under 100 MB
- `hindi-namamatay_small.mp4`
- `poster.jpg`
- `captions.txt`, linted with ig-caption and ig-human

The render is resumable: 16 chunks, 4 at a time.
