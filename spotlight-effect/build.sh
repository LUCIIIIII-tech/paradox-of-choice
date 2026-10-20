#!/bin/sh
# Rebuild the whole reel: sh build.sh   (needs node + Playwright's Chromium, ffmpeg, python3 + numpy)
# score -> subtitles -> frames (4 parallel chunks) -> concat -> mux at -14 LUFS -> poster
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
# 0. narrator (needs the Lemo-Opuscar library with its voice tier: sh setup.sh deps voice; online)
LIB=${LIB:-$HOME/lemo-opuscar}
python3 -c "import json; L=json.load(open('narration.json')); json.dump([{'id':l['id'],'text':l['text'],'voice':'fil-PH-AngeloNeural','rate':l.get('rate','+0%')} for l in L],open('out/tts_lines.json','w'),ensure_ascii=False)"
"$LIB/.venv/bin/python" "$LIB/core/tts/tts_zh.py" out/tts_lines.json voices
python3 score.py                                                    # 1. music + sound design -> out/mix.wav
python3 voicemix.py                                                 # 1b. narrator over the ducked music -> out/mix_vo.wav
node srt.mjs                                                        # 2. spotlight-effect.srt
for i in 0 1 2 3; do a=$((i*23)); b=$(( (i+1)*23 )); [ $b -gt 90 ] && b=90
  node render.mjs --from $a --to $b --out out/part$i.mp4 & done; wait   # 3. frames
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > out/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts.txt -c copy out/video.mp4   # 4. concat
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix_vo.wav -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart spotlight-effect.mp4   # 5. mux
ffmpeg -y -loglevel error -ss 7.0 -i spotlight-effect.mp4 -frames:v 1 -q:v 2 poster.jpg   # 6. poster
echo "done: $HERE/spotlight-effect.mp4"
