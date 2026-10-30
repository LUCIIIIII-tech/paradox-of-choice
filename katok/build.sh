#!/bin/sh
# Rebuild the reel (Katok): sh build.sh [en]   (no argument = Tagalog, "en" = English version)
# (needs the Lemo-Opuscar venv with voxcpm + faster-whisper, node + Playwright's Chromium, ffmpeg, python3 + numpy)
# narrator (VoxCPM2, cloned from ../voice-tests/18_Vox_deep_narrator.mp3) -> timeline -> sound -> frames (4 parallel chunks) -> concat -> mux at -14 LUFS -> poster
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
LANG_=${1:-tl}; if [ "$LANG_" = tl ]; then SUF=""; P=""; NAME=katok; else SUF=".$LANG_"; P="${LANG_}_"; NAME=katok_$LANG_; fi
LIB=${LIB:-$HOME/lib/lemo-opuscar}
[ -n "$SKIP_TTS" ] || "$LIB/.venv/bin/python" tts_vox.py $LANG_          # 1. narrator + word timings -> timeline.json
[ -n "$SKIP_SCORE" ] || python3 score.py $LANG_                                                # 2. sound design + narrator -> out/mix.wav
D=$(python3 -c "import json;print(json.load(open('timeline$SUF.json'))['dur'])")
for i in 0 1 2 3; do a=$(python3 -c "print(round($i*$D/4,3))"); b=$(python3 -c "print(round(($i+1)*$D/4,3))")
  node render.mjs --lang $LANG_ --from $a --to $b --out out/${P}part$i.mp4 & done; wait   # 3. frames
printf "file '${P}part0.mp4'\nfile '${P}part1.mp4'\nfile '${P}part2.mp4'\nfile '${P}part3.mp4'\n" > out/${P}parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/${P}parts.txt -c copy out/${P}video.mp4
ffmpeg -y -loglevel error -i out/${P}video.mp4 -i out/mix$SUF.wav -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart $NAME.mp4
ffmpeg -y -loglevel error -ss 1.0 -i $NAME.mp4 -frames:v 1 -q:v 2 ${P}poster.jpg
echo "done: $HERE/$NAME.mp4"
