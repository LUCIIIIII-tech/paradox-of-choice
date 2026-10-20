"""Voice post: out/raw/<id>.wav (Kokoro, 24 kHz) -> voices/<id>.wav (48 kHz, per character) + voices/dur.json + voices/lips.json
- "tape": resample factor < 1 lowers pitch and slows the line together (Oona's deadpan gravel)
- "cut":  truncate at this many seconds (the machine-gun "Too—"), 30 ms fade
- OONA: light saturation + 180 Hz bump; BENNY: presence boost at 3.2 kHz
Lip sync: per 1/24 s, mouth opening o (RMS, 95th-percentile normalised) and brightness b (spectral centroid).
Usage: python voice.py"""
import json, os, numpy as np, soundfile as sf, soxr
from scipy.signal import lfilter, stft
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
os.makedirs(os.path.join(HERE, 'voices'), exist_ok=True)

def peq(x, f, gain_db, q=1.0):   # RBJ peaking EQ
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x)

dur, lips = {}, {}
for l in L:
    y, sr = sf.read(os.path.join(HERE, 'out/raw', l['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    tape = l.get('tape', 1.0)
    y = soxr.resample(y, sr * tape, SR)          # played back at SR: pitch x tape, length / tape
    if l.get('cut'):
        n = int(l['cut'] * SR); y = y[:n].copy(); f = int(.03 * SR); y[-f:] *= np.linspace(1, 0, f)
    y = y / (np.abs(y).max() + 1e-9) * .9
    if l['who'] == 'OONA':
        sat = np.tanh(y * 2.4) / np.tanh(2.4); y = .72 * y + .28 * sat
        y = peq(y, 180, 2.5, .8); y = peq(y, 2800, -1.5, 1.0)
    else:
        y = peq(y, 3200, 2.0, .9)
    y = y / (np.abs(y).max() + 1e-9) * .9
    sf.write(os.path.join(HERE, 'voices', l['id'] + '.wav'), y.astype(np.float32), SR)
    dur[l['id']] = round(len(y) / SR, 3)
    hop = SR // 24; win = int(.05 * SR)
    f, _, Z = stft(y, fs=SR, nperseg=win, noverlap=win - hop, nfft=4096, boundary='even', padded=True)
    S = np.abs(Z); rms = np.sqrt((S ** 2).mean(0)); p = np.percentile(rms, 95) + 1e-9
    cen = (S * f[:, None]).sum(0) / (S.sum(0) + 1e-9)
    o = np.clip((rms / p - .1) / .8, 0, 1); b = np.clip((cen - 1200) / 2600, 0, 1)
    lips[l['id']] = {'o': [round(float(v), 2) for v in o], 'b': [round(float(v), 2) for v in b]}
    print(l['id'], dur[l['id']])
json.dump(dur, open(os.path.join(HERE, 'voices/dur.json'), 'w'), indent=0)
json.dump(lips, open(os.path.join(HERE, 'voices/lips.json'), 'w'))
