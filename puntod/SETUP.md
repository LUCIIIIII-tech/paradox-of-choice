# Huwag Kang Lilingon sa Puntod: setup

Undas horror reel, Tagalog, 1080x1920, 60-90 s. This folder is the working setup.
The reel is not built yet. The voice script and a 10 s 3D style test get approved first.

The folder is `puntod/`, not `undas/`. `undas/` already holds "Ang Bata sa CCTV" (commit d09adf4), so it was left untouched.

## Pipeline

```
lines.json -> tts_vox.py -> timeline.json -> score.py -> render.mjs x4 -> concat -> mux -> size check -> small copy -> flashcheck -> hf/sync.py
```

| Step | Tool | File |
|---|---|---|
| Script, one line per entry, `voice` = `narrator` or `lola` | JSON | `lines.json` |
| Lola's ghost voice reference (voice design, 3 takes) | VoxCPM2 | `make_ref.py` writes `../voice-tests/refs/multo_take{7,11,23}.wav` |
| Voices + whisper check + retake (seed 11, then 23) + word timings | VoxCPM2 + faster-whisper | `tts_vox.py` |
| Timeline before voices exist (dev only, 2.3 words/s guess) | python | `fake_timeline.py` |
| Sound design, ducked under the voice | numpy | `score.py` |
| 3D frames, 24 fps, headless Chromium | three.js + Playwright | `main.js`, `kit.js`, `people.js`, `render.mjs` |
| Contact sheet of stills | ffmpeg | `sheet.sh out.jpg t1 t2 ...` |
| Mux at -14 LUFS / -1.5 dBTP (two-pass), under 100 MB (crf 22), small copy (crf 28, maxrate 1500k) | ffmpeg | `build.sh` |
| Flash safety check (WCAG: max 3 flashes per second) | numpy | `flashcheck.py` |
| Finishing preview: grain, vignette, scrub the timeline, check sync | HyperFrames 0.9.8 | `hf/` (`python hf/sync.py`, then `cd hf && npm run dev`) |
| Optional QA on the final MP4 | OpenMontage | `../../tools/analysis/visual_qa.py`, `frame_sampler.py`, `audio_probe.py` |
| Optional subtitles file | OpenMontage | `../../tools/subtitle/subtitle_gen.py` |
| Optional hand polish | CapCut (capcut MCP) | import `puntod.mp4` into a draft |

## Machine notes (this PC)

- Voice venv (voxcpm + faster-whisper): `~/Downloads/paradox-of-choice-main/paradox-of-choice-main/.venv-vox/Scripts/python.exe`. `build.sh` uses it by default as `$VPY`.
- `python3` is the Windows Store alias here. `build.sh` falls back to `python` (numpy 2.5.2).
- Node 24, Playwright from the global npm root, ffmpeg 9.0.2. Rendering uses SwiftShader (no GPU needed).
- One voice job at a time. `build.sh` wraps it in `timeout 7000` and reruns it. A rerun only makes the missing lines.

## Commands

```bash
# 1. Lola's voice reference (once): listen, copy the best take to multo_ref.wav
"$VPY" make_ref.py
cp ../voice-tests/refs/multo_take11.wav ../voice-tests/refs/multo_ref.wav

# 2. Style test without voices
python fake_timeline.py
sh sheet.sh out/sheet.jpg 1.5 8 15 25 40
node render.mjs --from 0 --to 10 --out out/style_test.mp4

# 3. Full build
sh build.sh
```

## Status

| Done | Next |
|---|---|
| Pipeline copied and renamed, voice table has `narrator` + `lola` | Make the `multo_ref` voice and pick a take |
| `lines.json`: 17 entries, 3 Lola lines, about 88 s on the guessed timeline | Approve the script |
| `main.js` blockout renders: nitso rows, apartment-type tombs, crosses, moon, lamp post, trees in the wind, 11 candle lights going out one by one, ground fog, dust, smoke, cards, word captions | Lola's ghost, the hero character, sampaguita, the two-headed shadow, the hand, the new lapida, a camera per shot, depth of field rack focus |
| `hf/` passes `hyperframes check` | Rewrite the `score.py` cue list for the cemetery |
| | 10 s style test for approval, then the full build, `captions.txt` (ig-caption + ig-human) |
