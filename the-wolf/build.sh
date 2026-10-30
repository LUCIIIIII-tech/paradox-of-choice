#!/bin/sh
# Rebuild the sample reel (The Wolf): sh build.sh   (needs python3 + edge-tts + numpy + soundfile, node + Playwright's Chromium, ffmpeg)
# voices (edge-tts, online) -> timeline + lip sync -> sound -> frames (4 parallel chunks) -> concat -> mux at -14 LUFS -> poster
# Behind a TLS-intercepting proxy: CA_BUNDLE=/path/to/ca.crt sh build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
[ -n "$SKIP_TTS" ] || python3 tts.py                                     # 1. voices + voices/timing.json + voices/lips.json + timeline.json
python3 score.py                                                          # 2. music, hits, crackle, voices -> out/mix.wav
D=$(python3 -c "import json;print(json.load(open('timeline.json'))['dur'])")
for i in 0 1 2 3; do a=$(python3 -c "print(round($i*$D/4,3))"); b=$(python3 -c "print(round(($i+1)*$D/4,3))")
  node render.mjs --from $a --to $b --out out/part$i.mp4 & done; wait   # 3. frames
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > out/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts.txt -c copy out/video.mp4
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix.wav -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart the-wolf.mp4
ffmpeg -y -loglevel error -ss 0.8 -i the-wolf.mp4 -frames:v 1 -q:v 2 poster.jpg
echo "done: $HERE/the-wolf.mp4"
