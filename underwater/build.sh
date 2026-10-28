#!/bin/sh
# Rebuild Lunod (10 s, three.js under water): sh build.sh   (needs node + Playwright's Chromium, ffmpeg, python3 + numpy)
# sound -> frames (4 parallel chunks, software WebGL) -> concat -> mux at -14 LUFS -> poster
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
[ -n "$SKIP_SCORE" ] || python3 score.py
for i in 0 1 2 3; do a=$(python3 -c "print(round($i*10/4,3))"); b=$(python3 -c "print(round(($i+1)*10/4,3))")
  node render.mjs --from $a --to $b --out out/part$i.mp4 & done; wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > out/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts.txt -c copy out/video.mp4
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix.wav -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart lunod.mp4
ffmpeg -y -loglevel error -ss 1.0 -i lunod.mp4 -frames:v 1 -q:v 2 poster.jpg
echo "done: $HERE/lunod.mp4"
