# Ang Bata sa CCTV: design

Halloween/Undas special. Tagalog horror reel, 1080x1920, about 3 minutes. Folder: `undas/`.

## Story

The narrator tells it in first person as a true story ("Totoong kwento 'to"). He is a night-shift guard at an old Manila hospital. The third floor, a pediatric ward that burned, has been closed for ten years, but one CCTV camera there still works. The guard he replaced warned him: "Kapag may nakita ka sa Camera 3, huwag mong titigan."

At 3:00 AM a dead bulb lights up at the end of the third-floor hallway. A girl in white stands under it, facing the wall. She then appears on Camera 2, coming down the stairs one step per blink, and on Camera 1, outside the guard house. She looks up at the camera and smiles too wide. On Camera 4 she is beside him, inside the guard house, and she whispers, "Kuya, sasamahan mo ba ako?" and "Labing-isa kami, Kuya. Kulang pa ng isa." He shuts his eyes and prays until morning.

The CTA comes here: pipikit o titingin, comment and share.

In the morning he and the reliever check the recording. There is no girl on any camera. On Camera 3 at 3:07 AM, a man in a guard's uniform stands at the end of the hallway, facing the wall. It is the narrator, though he never left the guard house. On the recording he turns to the camera and smiles. He resigned the next day. Some nights at 3 AM the old guard house number still calls him: "Kuya, balik ka na. Isa na lang."

Script and timing live in `undas/lines.json`. Each line has a `voice` field: `narrator` or `bata`.

## Voices

- **Narrator:** VoxCPM2 clone of `voice-tests/18_Vox_deep_narrator.mp3`, run through `undas/tts_vox.py`.
- **Child:** VoxCPM2 voice design (`undas/make_ref.py`) made three takes. Take 7 was chosen because Whisper read it word for word and its median F0 was 348 Hz. It is saved as `voice-tests/refs/bata_ref.wav` and every child line is cloned from it.
- **Checks:** `tts_vox.py` runs a Whisper check on every take. A take scoring under 0.72 is retaken with seed 11, then seed 23, and the best take is kept.
- **Run limits:** One voice job runs at a time, with a 7000 s timeout. A rerun only makes the lines that are still missing.

## Picture

The engine is three.js, using the same lib, importmap and render.mjs as `presidente-3d/`. It renders one frame per call to `renderAt(t)` and draws in 4 parallel parts.

Sets:
- the hospital exterior: moon, fog, sodium lamp, gate, swaying trees
- the lobby with the guard house: four CRT monitors, a clock, a Sto. Niño picture, a mug with steam, a flashlight
- the burnt third-floor corridor: beds, wheelchair, children's drawings, the bulb
- the guard's room years later: the phone

Characters:
- They are rounded toon shapes with a painterly brush texture, jointed so they can move.
- They breathe, blink and tremble.
- The girl has hair that sways with no wind, and her grin widens.

CCTV:
- Four real cameras render to textures. Each feed has an IR light that is on only while that camera renders.
- A CRT shader adds barrel distortion, mono green, grain, scanlines and a slow roll band.
- An on-screen display shows the camera name, the timestamp and REC or PLAYBACK.

Camera and post:
- **Camera:** Moves are slow dollies, over-the-shoulder shots, POV pushes into the monitors and a rack focus from the guard's ear to Camera 3. There is a gentle handheld drift. Face shots aim at the guard's real head position on every frame.
- **Post:** Depth of field is on only in shots that rack focus. On top of that come light bloom and an ink-edge grade with grain and vignette.
- **Transitions:** Cuts are a soft 0.16 s dip to dark. Nothing in the picture flashes or glitches. `flashcheck.py` checks the final video against the WCAG general-flash rule.

## Sound

`undas/score.py` builds the sound from the numpy toolkit in `tatlo/`. Nothing in it screams or screeches, and soft low swells take the place of hits.

- **Ambience:** room tone, CRT hum, a fluorescent tube, a clock, crickets and wind.
- **Story sounds:** a far music box (an original phrase), small bare footsteps on each blink, breathing at the right ear, and old embers crackling. In the morning there are birds and a far road.
- **The child's voice:** whispered, high-passed and kept drier than the narrator. It circles the stereo field, staying mostly at the right ear.
- **Mix:** Everything is ducked under the voices. The final mix is a two-pass loudnorm to -14 LUFS with true peak at -1.5 dBTP.

## Deliverables

- `undas/undas.mp4`, under 100 MB. It is re-encoded at crf 22 if it goes over.
- `undas/undas_small.mp4`, at crf 28 with maxrate 1500k.
- `undas/poster.jpg`
- `undas/captions.txt`, the FB caption, linted with ig-caption and ig-human.
- Both MP4s are opened in File Explorer for the user.
