#!/bin/bash
# Cloud environment setup script for the Dark Psyche video pipeline.
# Paste this whole file into claude.ai/code > your environment > Setup script.
# It installs the narrator tools (VoxCPM2 + faster-whisper in ~/lib/lemo-opuscar/.venv, the path build.sh expects)
# and downloads the two voice models (~5 GB). Node, Playwright's Chromium and ffmpeg are already in the cloud image.
# Safe to run twice: each step skips itself when it's already done, and nothing here can stop the session from starting.
[ -f /root/.ccr/ca-bundle.crt ] && export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt REQUESTS_CA_BUNDLE=/root/.ccr/ca-bundle.crt
LIB=$HOME/lib/lemo-opuscar; PY=$LIB/.venv/bin/python
command -v uv >/dev/null || pip install -q uv || true
export PATH=$HOME/.local/bin:$PATH

# 1. the narrator tools (pinned to the versions the reels were made with; CPU build of torch)
if ! "$PY" -c "import voxcpm, faster_whisper, soundfile" 2>/dev/null; then
  mkdir -p "$HOME/lib"
  [ -d "$LIB/.git" ] || git clone -q --depth 1 https://github.com/lemomo-ai/lemo-opuscar "$LIB" || mkdir -p "$LIB"
  uv venv -q --python 3.12 "$LIB/.venv" || true
  uv pip install -q --python "$PY" --index-url https://download.pytorch.org/whl/cpu torch==2.11.0 torchaudio==2.11.0 || true
  uv pip install -q --python "$PY" voxcpm==2.0.3 faster-whisper==1.2.1 soundfile numpy || true
fi

# 2. the voice models: VoxCPM2 (the narrator, ~4.7 GB) and faster-whisper small (word timings and take checks, ~0.5 GB)
"$PY" - <<'EOF' || true
from huggingface_hub import snapshot_download
for repo in ('openbmb/VoxCPM2', 'Systran/faster-whisper-small'):
    try: snapshot_download(repo); print('model ready:', repo)
    except Exception as e: print('model download failed (Claude can retry it in the session):', repo, e)
EOF
exit 0
