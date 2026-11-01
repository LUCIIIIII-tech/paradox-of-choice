#!/bin/sh
# Rebuild the reel (Ang Bata sa CCTV, Halloween special): sh build.sh
# (needs a python with voxcpm + faster-whisper as $VPY, node + Playwright's Chromium ($CHROME to pick one), ffmpeg, python3 + numpy)
# voices (VoxCPM2: narrator cloned from ../voice-tests/18_Vox_deep_narrator.mp3, the child from ../voice-tests/refs/bata_ref.wav, made by make_ref.py)
# -> timeline -> sound -> frames (4 parallel parts) -> concat -> mux at -14 LUFS / -1.5 dBTP (two-pass) -> under 100 MB -> small copy -> poster -> flash check
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"; mkdir -p out
NAME=undas; VPY=${VPY:-python3}; PY=${PY:-python3}
if [ -z "$SKIP_TTS" ]; then          # one voice job at a time; on a 7000 s timeout run it again, it only makes the missing lines
  until timeout 7000 "$VPY" tts_vox.py; do echo "voice job cut short, running again"; done
fi
[ -n "$SKIP_SCORE" ] || $PY score.py                                                        # sound design + voices -> out/mix.wav
D=$($PY -c "import json;print(json.load(open('timeline.json'))['dur'])")
if [ -z "$SKIP_RENDER" ]; then
for i in 0 1 2 3; do a=$($PY -c "print(round($i*$D/4,3))"); b=$($PY -c "print(round(($i+1)*$D/4,3))")
  node render.mjs --from $a --to $b --out out/part$i.mp4 & done; wait                          # frames
fi
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > out/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts.txt -c copy out/video.mp4
# loudness: measure, then normalise to -14 LUFS with the true peak at -1.5 dBTP
M=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | $PY -c "import sys,json;t=sys.stdin.read();j=json.loads(t[t.rindex('{'):t.rindex('}') + 1]);print(f\"measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}\")")
ffmpeg -y -loglevel error -i out/mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:$M:linear=true,aresample=48000" -c:a pcm_s16le out/mix_norm.wav
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix_norm.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $NAME.mp4
SZ=$($PY -c "import os;print(os.path.getsize('$NAME.mp4'))")
if [ "$SZ" -ge 100000000 ]; then                                                                # over 100 MB: re-encode at crf 22
  ffmpeg -y -loglevel error -i $NAME.mp4 -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -c:a copy -movflags +faststart out/re.mp4 && mv out/re.mp4 $NAME.mp4; fi
SZ=$($PY -c "import os;print(os.path.getsize('$NAME.mp4'))")
if [ "$SZ" -ge 100000000 ]; then                                                                # the grain still keeps it over: two-pass at 3.7 Mbps (about 88 MB for 3 min)
  ffmpeg -y -loglevel error -i out/video.mp4 -c:v libx264 -preset slow -b:v 3700k -pix_fmt yuv420p -pass 1 -passlogfile out/x264 -an -f null -
  ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix_norm.wav -c:v libx264 -preset slow -b:v 3700k -maxrate 6000k -bufsize 8000k -pass 2 -passlogfile out/x264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $NAME.mp4; fi
ffmpeg -y -loglevel error -i $NAME.mp4 -c:v libx264 -preset slow -crf 28 -maxrate 1500k -bufsize 3000k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart ${NAME}_small.mp4
ffmpeg -y -loglevel error -ss 1.0 -i $NAME.mp4 -frames:v 1 -q:v 2 poster.jpg
$PY flashcheck.py $NAME.mp4
ffmpeg -hide_banner -i $NAME.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
echo "done: $HERE/$NAME.mp4"
