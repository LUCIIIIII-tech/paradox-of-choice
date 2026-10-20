#!/bin/sh
# Rebuild the whole film from scratch: sh build.sh
# TTS -> voice processing -> whisper check -> events -> score -> mix -> subtitles -> frames -> mux at -14 LUFS -> poster
set -e
LIB=${LIB:-/c/Users/Luciiii/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/Scripts/python.exe"; [ -x "$PY" ] || PY="$LIB/.venv/bin/python"
cd "$LIB"
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/out/raw"                 # 1. Kokoro voices (24 kHz raw)
"$PY" "$HERE/voice.py"                                                   # 2. per-character processing + lip-sync envelopes
"$PY" "$HERE/asr.py" "$HERE/lines.json" "$HERE/voices"                   # 3. whisper check of every line
node core/render/events.mjs "$HERE" --size 1080x1920                     # 4. timeline -> events.json
"$PY" "$HERE/music/score.py"                                             # 5. score -> music/score.wav
"$PY" "$HERE/mix.py"                                                     # 6. foley + voices + ducked score + ambience -> mix.wav
node "$HERE/srt.mjs"                                                     # 7. subtitles -> paradox-of-choice.srt
node core/render/video.mjs "$HERE" --fps 24 --workers 5 --size 1080x1920 --out "$HERE/out/video.mp4"   # 8. frames
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/paradox-of-choice.mp4" 24 0          # 9. mux, -14 LUFS, no grain
ffmpeg -y -loglevel error -ss 1.2 -i "$HERE/paradox-of-choice.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"   # 10. poster
echo "done: $HERE/paradox-of-choice.mp4"
