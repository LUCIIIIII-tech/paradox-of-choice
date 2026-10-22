"""Narrator with VoxCPM2 (offline, Apache-2.0): lines.json -> voices/<id>.wav + voices/timing.json, then timeline.json.
Every line is cloned from one reference clip (voice-tests/18_Vox_deep_narrator.mp3) so the narrator stays the same person.
Word timings come from faster-whisper on the generated audio (the script's own words are shown, timed by it).
Run with the Lemo-Opuscar venv python (it has voxcpm + faster-whisper):  $LIB/.venv/bin/python tts_vox.py [tl|en] [tempo]
  tempo (default auto): speed-up applied to every line (pitch kept) so the reel lands near TARGET seconds."""
import os, sys, json, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LANG = next((a for a in sys.argv[1:] if a in ('tl', 'en')), 'tl'); SUF = '' if LANG == 'tl' else '.' + LANG
V = os.path.join(HERE, 'voices' if LANG == 'tl' else 'voices_' + LANG); os.makedirs(V, exist_ok=True)
SR, MAXP = 48000, .3
TARGET = float(os.environ.get('TARGET', 90))      # the reel length the auto tempo aims for (long form: pass a tempo instead)
REF_MP3 = os.path.join(HERE, '..', 'voice-tests', '18_Vox_deep_narrator.mp3')
REF_TEXT = "Nagising ka... at wala nang ibang tao sa mundo. Ang unang sisira sa'yo... hindi gutom."
L = json.load(open(os.path.join(HERE, f'lines{SUF}.json'), encoding='utf-8'))
RAW = os.path.join(V, 'raw'); os.makedirs(RAW, exist_ok=True)

def load(p, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)

# 1. generate every line once (cached in voices/raw), cloned from the reference voice
todo = [l for l in L if 'text' in l and not os.path.exists(os.path.join(RAW, l['id'] + '.wav'))]
if todo:
    from voxcpm import VoxCPM
    import torch
    ref_wav = os.path.join(RAW, '_ref.wav'); sf.write(ref_wav, load(REF_MP3, 16000), 16000)
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
    for l in todo:
        torch.manual_seed(l.get('seed', 7))   # a line can ask for another take with its own seed
        wav = model.generate(text=l.get('say', l['text']), prompt_wav_path=ref_wav, prompt_text=REF_TEXT, cfg_value=2.0, inference_timesteps=10)
        sf.write(os.path.join(RAW, l['id'] + '.wav'), wav, model.tts_model.sample_rate)
        print('generated', l['id'], round(len(wav) / model.tts_model.sample_rate, 2), 's', flush=True)

# 2. squeeze long pauses (from the audio itself), then pick one tempo for all lines so the reel lands near TARGET
def squeeze(y):
    fr = int(.01 * SR); rms = np.array([np.sqrt((y[i:i + fr] ** 2).mean() + 1e-12) for i in range(0, len(y) - fr, fr)])
    q = rms < max(rms.max() * .03, 1e-4); cuts, i = [], 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if (j - i) * .01 > MAXP + .05: cuts.append((i * .01 + (MAXP / 2 if i else 0), j * .01 - (MAXP / 2 if j < len(q) else 0)))
            i = j
        else: i += 1
    segs, last = [], 0.0
    for a, b in cuts: segs.append(y[int(last * SR):int(a * SR)]); last = b
    segs.append(y[int(last * SR):]); f = int(.01 * SR)
    for k in range(len(segs) - 1):
        if len(segs[k]) > f: segs[k] = segs[k].copy(); segs[k][-f:] *= np.linspace(1, 0, f)
        if len(segs[k + 1]) > f: segs[k + 1] = segs[k + 1].copy(); segs[k + 1][:f] *= np.linspace(0, 1, f)
    return np.concatenate(segs)
sq = {l['id']: squeeze(load(os.path.join(RAW, l['id'] + '.wav'))) for l in L if 'text' in l}
speech = sum(len(y) / SR for y in sq.values()) + sum(l.get('beat', 0) for l in L) + .18 * len(L)
nums = [a for a in sys.argv[1:] if a not in ('tl', 'en')]
tempo = float(nums[0]) if nums else min(1.3, max(1.0, speech / TARGET))
print('speech', round(speech, 1), 's  tempo', round(tempo, 3))
for k, y in sq.items():
    tmp = os.path.join(V, k + '_tmp.wav'); sf.write(tmp, (y / (np.abs(y).max() + 1e-9) * .9).astype(np.float32), SR)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', f'atempo={tempo:.4f}', '-ar', str(SR), os.path.join(V, k + '.wav')], check=True); os.remove(tmp)

# 3. word timings with faster-whisper; show the script's words, timed by the recognised ones
from faster_whisper import WhisperModel
asr = WhisperModel('small', compute_type='int8'); T = {}
for l in L:
    if 'text' not in l: continue
    p = os.path.join(V, l['id'] + '.wav'); y = load(p, 16000).astype(np.float32)
    segs, _ = asr.transcribe(y, language=LANG, word_timestamps=True)
    ww = [(w.start, w.end) for s in segs for w in s.words]
    shown = l['text'].split()
    if not ww: ww = [(0.05, len(y) / 16000 - .05)]
    a, b = ww[0][0], ww[-1][1]
    if len(ww) == len(shown): words = [[w, s, e] for w, (s, e) in zip(shown, ww)]
    else:
        tot = sum(len(w) for w in shown); acc = 0; words = []
        for w in shown: s0 = a + (b - a) * acc / tot; acc += len(w); words.append([w, s0, a + (b - a) * acc / tot])
    T[l['id']] = {'text': l['text'], 'start': words[0][1], 'end': words[-1][2] + .08, 'words': words}
    print(l['id'], round(b - a, 2), 's', l['text'], flush=True)
json.dump(T, open(os.path.join(V, 'timing.json'), 'w'), ensure_ascii=False, indent=0)

# 4. timeline: lines back to back (same rules as tts.py)
tl, t = [], 0.0
for l in L:
    t += l.get('gap', .18)
    if 'beat' in l: tl.append({'id': l['id'], 'shot': l['shot'], 't0': round(t, 3), 't1': round(t + l['beat'], 3), **{k: v for k, v in l.items() if k not in ('id', 'shot', 'beat', 'gap')}}); t += l['beat']; continue
    x = T[l['id']]; sp = x['end'] - x['start']
    tl.append({'id': l['id'], 'shot': l['shot'], 't0': round(t, 3), 't1': round(t + sp, 3), 'wav0': round(t - x['start'], 3), 'key': l.get('key', []),
               **{k: v for k, v in l.items() if k not in ('id', 'shot', 'text', 'say', 'gap', 'rate', 'key', 'seed')},
               'words': [[w, round(s - x['start'] + t, 3), round(e - x['start'] + t, 3)] for w, s, e in x['words']]})
    t += sp
json.dump({'dur': round(t, 3), 'lines': tl}, open(os.path.join(HERE, f'timeline{SUF}.json'), 'w'), ensure_ascii=False, indent=1)
print('timeline', round(t, 2), 's')
