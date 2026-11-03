"""Lola's ghost voice reference, made once with VoxCPM2 voice design (a written description instead of a clip to clone).
Writes three takes to ../voice-tests/refs/multo_take<seed>.wav and the line they say to multo_ref.txt.
Listen, copy the best take to multo_ref.wav; tts_vox.py clones every 'lola' line from it.
(The older lola_ref.wav is the warm, living Lola from hindi-namamatay: not this one.)
Run with the VoxCPM venv python:  $VPY make_ref.py [seed ...]"""
import os, sys, time, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); REFS = os.path.join(HERE, '..', 'voice-tests', 'refs')
CONTROL = ("A very old Filipino grandmother, about eighty-five, whispering slowly close to the ear, raspy and cracked, "
           "breathy and dry, trembling, tender but cold and eerie")
TEXT = "Apo... nandito lang si Lola. Ang lamig dito sa ilalim, apo. Lumapit ka... huwag kang matakot sa akin."
seeds = [int(s) for s in sys.argv[1:]] or [7, 11, 23]
from voxcpm import VoxCPM
import torch
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
open(os.path.join(REFS, 'multo_ref.txt'), 'w', encoding='utf-8').write(TEXT + '\n')
for s in seeds:
    t0 = time.time(); torch.manual_seed(s)
    wav = model.generate(text=f"({CONTROL}){TEXT}", cfg_value=2.0, inference_timesteps=10)
    p = os.path.join(REFS, f'multo_take{s}.wav'); sf.write(p, wav, model.tts_model.sample_rate)
    print('take', s, round(len(wav) / model.tts_model.sample_rate, 2), 's in', round(time.time() - t0), 's', flush=True)
