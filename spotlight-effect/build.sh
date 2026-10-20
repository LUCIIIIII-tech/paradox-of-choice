#!/bin/sh
# Rebuild the whole reel: sh build.sh   (needs node + Playwright's Chromium, ffmpeg, python3 + numpy)
# score -> subtitles -> frames (4 parallel chunks) -> concat -> mux at -14 LUFS -> poster
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
python3 score.py                                                    # 1. music + sound design -> out/mix.wav
node srt.mjs                                                        # 2. spotlight-effect.srt
for i in 0 1 2 3; do a=$((i*23)); b=$(( (i+1)*23 )); [ $b -gt 90 ] && b=90
  node render.mjs --from $a --to $b --out out/part$i.mp4 & done; wait   # 3. frames
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > out/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts.txt -c copy out/video.mp4   # 4. concat
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix.wav -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart spotlight-effect.mp4   # 5. mux
ffmpeg -y -loglevel error -ss 7.0 -i spotlight-effect.mp4 -frames:v 1 -q:v 2 poster.jpg   # 6. poster
echo "done: $HERE/spotlight-effect.mp4"
