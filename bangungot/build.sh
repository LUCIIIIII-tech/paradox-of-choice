#!/bin/sh
# Rebuild the reel: sh build.sh   (needs the Lemo-Opuscar library's venv for edge-tts, node + Playwright's Chromium, ffmpeg, python3 + numpy)
# narrator -> timeline -> sound -> frames (4 parallel chunks) -> concat -> mux at -14 LUFS -> poster
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
LIB=${LIB:-$HOME/lemo-opuscar}
"$LIB/.venv/bin/python" tts.py                                      # 1. narrator (fil-PH Angelo) + word timings -> timeline.json
python3 score.py                                                    # 2. sound design + narrator -> out/mix.wav
D=$(python3 -c "import json;print(json.load(open('timeline.json'))['dur'])")
for i in 0 1 2 3; do a=$(python3 -c "print(round($i*$D/4,3))"); b=$(python3 -c "print(round(($i+1)*$D/4,3))")
  node render.mjs --from $a --to $b --out out/part$i.mp4 & done; wait   # 3. frames
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > out/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts.txt -c copy out/video.mp4
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix.wav -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart bangungot.mp4
ffmpeg -y -loglevel error -ss 1.0 -i bangungot.mp4 -frames:v 1 -q:v 2 poster.jpg
echo "done: $HERE/bangungot.mp4"
