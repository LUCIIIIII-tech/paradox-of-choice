"""The white lady's voice reference, made once with VoxCPM2 voice design (no clip to clone, a written description instead).
Writes three takes to ../voice-tests/refs/babae_take<seed>.wav, whisper-checks each and copies the best to babae_ref.wav (+ babae_ref.txt);
tts_vox.py clones every 'babae' line from it.  Run with the VoxCPM venv python:  $VPY make_ref.py [seed ...]"""
import os, re, sys, time, difflib, subprocess, shutil, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); REFS = os.path.join(HERE, '..', 'voice-tests', 'refs')
CONTROL = "A young Filipino woman in her twenties, speaking very softly and slowly, a sad, cold, breathy whisper, distant and eerie, close to the microphone"
TEXT = "Kuya... ang lamig dito. Pakihatid mo naman ako pauwi. Matagal na akong naghihintay sa ulan."
seeds = [int(s) for s in sys.argv[1:]] or [7, 11, 23]
from voxcpm import VoxCPM
import torch
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False); _asr = []
def asr():
    if not _asr:
        from faster_whisper import WhisperModel
        _asr.append(WhisperModel('small', device='cpu', compute_type='int8'))
    return _asr[0]
norm = lambda s: ' '.join(re.sub(r"[^a-z0-9 ]", "", s.lower().replace('-', ' ')).split())
best = None
for s in seeds:
    t0 = time.time(); torch.manual_seed(s)
    wav = model.generate(text=f"({CONTROL}){TEXT}", cfg_value=2.0, inference_timesteps=10); sr = model.tts_model.sample_rate
    p = os.path.join(REFS, f'babae_take{s}.wav'); sf.write(p, wav, sr)
    y = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    segs, _ = asr().transcribe(np.frombuffer(y, np.float32), language='tl'); heard = ' '.join(x.text for x in segs).strip()
    sc = difflib.SequenceMatcher(None, norm(TEXT), norm(heard)).ratio()
    print('take', s, round(len(wav) / sr, 2), 's  check', round(sc, 2), '|', heard, f'({round(time.time() - t0)} s)', flush=True)
    if best is None or sc > best[0]: best = (sc, s, p)
shutil.copy(best[2], os.path.join(REFS, 'babae_ref.wav')); open(os.path.join(REFS, 'babae_ref.txt'), 'w', encoding='utf-8').write(TEXT)
print('chose take', best[1], 'check', round(best[0], 2))
