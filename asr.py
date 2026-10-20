"""Whisper check of every processed line (pads 0.6 s of silence each side; short clips are misheard without it).
A line whose "asr" is "-" is a deliberate fragment (cut mid-word) and is skipped.
Writes voices/words.json (word timestamps). Usage: python asr.py lines.json voices_dir   (exit 1 on any mismatch)"""
import sys, json, re, os, numpy as np, soundfile as sf, soxr
from faster_whisper import WhisperModel
m = WhisperModel('base.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z0-9 ]', '', s.lower().replace("'", '').replace('-', ' ').replace(',', '')).split()
bad, words = 0, {}
for L in json.load(open(sys.argv[1], encoding='utf-8')):
    if L.get('asr') == '-': print('SKIP', L['id']); continue
    y, sr = sf.read(os.path.join(sys.argv[2], L['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, 16000); pad = np.zeros(int(.6 * 16000))
    segs, _ = m.transcribe(np.concatenate([pad, y, pad]).astype(np.float32), beam_size=5, language='en', word_timestamps=True)
    segs = list(segs); got = ' '.join(s.text.strip() for s in segs)
    words[L['id']] = [(w.word.strip(), round(w.start - .6, 3), round(w.end - .6, 3)) for s in segs for w in s.words]
    want = L.get('asr', L['text']); ok = norm(got) == norm(want); bad += not ok
    print(('OK  ' if ok else 'DIFF'), L['id'], '|', want, '->', got)
json.dump(words, open(os.path.join(sys.argv[2], 'words.json'), 'w'), indent=0)
print('mismatches:', bad); sys.exit(1 if bad else 0)
