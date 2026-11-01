"""Dev only: a timeline.json with guessed word times (2.3 words/s) so the scene can be built before the voices exist. tts_vox.py writes the real one."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
tl, t = [], 0.0
for l in L:
    t += l.get('gap', .18)
    if 'beat' in l: tl.append({'id': l['id'], 'shot': l['shot'], 't0': round(t, 3), 't1': round(t + l['beat'], 3)}); t += l['beat']; continue
    ws = l['text'].split(); rate = 1.6 if l.get('voice') == 'bata' else 2.3; words = []
    for w in ws: d = (.25 + .06 * len(w)) / rate * 2.3 * .62 + (.25 if w.endswith(('.', ',', '?')) else 0); words.append([w, round(t, 3), round(t + d, 3)]); t += d
    tl.append({'id': l['id'], 'shot': l['shot'], 't0': words[0][1], 't1': words[-1][2], 'wav0': 0, 'key': l.get('key', []), 'voice': l.get('voice', 'narrator'), 'words': words})
json.dump({'dur': round(t, 3), 'lines': tl}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('fake timeline', round(t, 1), 's')
