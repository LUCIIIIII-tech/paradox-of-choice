# contact sheet of stills (16:9): sh sheet.sh out.jpg t1 t2 ...  (renders the stills, tiles them 3 across)
OUT=$1; shift; HERE=$(cd "$(dirname "$0")" && pwd); L=$(echo "$@" | tr ' ' ,)
node "$HERE/render.mjs" --still "$L" $SHEET_ARGS || exit 1
ARGS=""; N=0; for t in "$@"; do ARGS="$ARGS -i $HERE/out/stills/t$(printf %.2f $t).jpg"; N=$((N+1)); done
ffmpeg -y -loglevel error $ARGS -filter_complex "$(i=0; for t in "$@"; do printf "[$i]scale=640:360[v$i];"; i=$((i+1)); done; i=0; for t in "$@"; do printf "[v$i]"; i=$((i+1)); done; echo "xstack=inputs=$N:layout=$(i=0; for t in "$@"; do c=$((i%3)); r=$((i/3)); printf "%s_%s|" $((c*640)) $((r*360)); i=$((i+1)); done | sed 's/|$//'):fill=black")" -frames:v 1 "$OUT"
