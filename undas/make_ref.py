"""The child's voice reference, made once with VoxCPM2 voice design (no clip to clone, a written description instead).
Writes three takes to ../voice-tests/refs/bata_take<seed>.wav; tts_vox.py clones every 'bata' line from the chosen one (bata_ref.wav).
Run with the VoxCPM venv python:  $VPY make_ref.py [seed ...]"""
import os, sys, time, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); REFS = os.path.join(HERE, '..', 'voice-tests', 'refs')
CONTROL = "A little Filipino girl, about seven years old, whispering very softly and slowly, breathy and airy, sad and eerie, close to the microphone"
TEXT = "Kuya... ang dilim dito. Sasamahan mo ba ako? Ang lamig, Kuya. Hinahanap ko pa ang mama ko."
seeds = [int(s) for s in sys.argv[1:]] or [7, 11, 23]
from voxcpm import VoxCPM
import torch
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
for s in seeds:
    t0 = time.time(); torch.manual_seed(s)
    wav = model.generate(text=f"({CONTROL}){TEXT}", cfg_value=2.0, inference_timesteps=10)
    p = os.path.join(REFS, f'bata_take{s}.wav'); sf.write(p, wav, model.tts_model.sample_rate)
    print('take', s, round(len(wav) / model.tts_model.sample_rate, 2), 's in', round(time.time() - t0), 's', flush=True)
