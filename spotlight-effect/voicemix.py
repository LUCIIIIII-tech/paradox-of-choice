"""Mix the narrator into the reel: voices/<id>.(wav|mp3|m4a) placed at narration.json times, music ducked ~9 dB under the voice.
Usage: python3 voicemix.py   (after score.py) -> out/mix_vo.wav ; then mux as in build.sh with out/mix_vo.wav"""
import os, json, wave, subprocess, numpy as np
from score_cuts import warp
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
def read_any(p):   # decode with ffmpeg to mono float
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2') / 32768
w = wave.open(os.path.join(HERE, 'out', 'mix.wav')); mus = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2) / 32768
vo = np.zeros(len(mus)); missing = []
for l in json.load(open(os.path.join(HERE, 'narration.json'), encoding='utf-8')):
    f = next((os.path.join(HERE, 'voices', l['id'] + e) for e in ('.wav', '.mp3', '.m4a') if os.path.exists(os.path.join(HERE, 'voices', l['id'] + e))), None)
    if not f: missing.append(l['id']); continue
    y = read_any(f); nz = np.nonzero(np.abs(y) > .01)[0]
    if len(nz): y = y[max(0, nz[0] - 960):nz[-1] + 4800]                       # trim silence
    y = y / (np.abs(y).max() + 1e-9) * .8
    i = int(warp(l['t']) * SR); n = min(len(y), len(vo) - i); vo[i:i + n] += y[:n]
    print(l['id'], 'at', l['t'], 'len', round(len(y) / SR, 2), 's')
# duck: smoothed voice envelope -> music gain down to -9 dB
env = np.convolve(np.abs(vo), np.ones(int(.12 * SR)) / int(.12 * SR), 'same'); env = np.clip(env / .05, 0, 1)
env = np.convolve(env, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
g = 1 - env * (1 - 10 ** (-9 / 20))
out = mus * g[:, None] + vo[:, None] * .9
out /= max(1, np.abs(out).max() / .95)
with wave.open(os.path.join(HERE, 'out', 'mix_vo.wav'), 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((out * 32767).astype('<i2').tobytes())
if missing: print('missing lines:', ' '.join(missing))
