"""Narrator: lines.json -> voices/<id>.wav (48 kHz mono) + voices/timing.json (duration and word timings), then timeline.json.
Voice: fil-PH-AngeloNeural (Microsoft Edge online TTS via edge-tts). Run with the Lemo-Opuscar venv python (it has edge-tts):
  $LIB/.venv/bin/python tts.py [en]       (cached lines are reused; delete voices/<id>.wav to regenerate one)"""
import os, json, asyncio, subprocess, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
LANG = sys.argv[1] if len(sys.argv) > 1 else 'tl'          # tl (default) | en
SUF = '' if LANG == 'tl' else '.' + LANG
V = os.path.join(HERE, 'voices' if LANG == 'tl' else 'voices_' + LANG); os.makedirs(V, exist_ok=True)
try:
    import certifi
    if os.path.exists('/root/.ccr/ca-bundle.crt'): certifi.where = lambda: '/root/.ccr/ca-bundle.crt'   # behind a TLS proxy
except ImportError: pass
import edge_tts
VOICE, RATE, PITCH, SR = {'tl': ('fil-PH-AngeloNeural', '-4%', '-6Hz'), 'en': ('en-US-ChristopherNeural', '+2%', '-3Hz')}[LANG] + (48000,)
L = json.load(open(os.path.join(HERE, f'lines{SUF}.json'), encoding='utf-8'))
tpath = os.path.join(V, 'timing.json'); T = json.load(open(tpath)) if os.path.exists(tpath) else {}

async def synth(l):
    for attempt in range(8):
        audio, words = bytearray(), []
        try:
            c = edge_tts.Communicate(l.get('say', l['text']), VOICE, rate=l.get('rate', RATE), pitch=PITCH, boundary='WordBoundary')
            async for ch in c.stream():
                if ch['type'] == 'audio': audio += ch['data']
                elif ch['type'] == 'WordBoundary': words.append([ch['text'], ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7])
            if audio: return bytes(audio), words
        except Exception as e: print('  retry', l['id'], type(e).__name__)
        await asyncio.sleep(1.5 + attempt)
    sys.exit(f'no audio for {l["id"]}')

for l in L:
    if 'text' not in l: continue
    wav = os.path.join(V, l['id'] + '.wav')
    if os.path.exists(wav) and l['id'] in T and T[l['id']].get('text') == l.get('say', l['text']): continue
    mp3, words = asyncio.run(synth(l))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', '-', '-ar', str(SR), '-ac', '1', wav], input=mp3, check=True)
    # the display words come from the script (with its spelling), timed by the service's word boundaries
    shown = l['text'].split()
    if len(shown) != len(words):   # different split (punctuation): spread the script words over the spoken span by length
        a, b = words[0][1], words[-1][2]; tot = sum(len(w) for w in shown); acc = 0; ws = []
        for w in shown: s0 = a + (b - a) * acc / tot; acc += len(w); ws.append([w, s0, a + (b - a) * acc / tot])
    else: ws = [[s, w[1], w[2]] for s, w in zip(shown, words)]
    # squeeze long pauses down to MAXP, using the audio itself (silence = 10 ms frames well below the speech level),
    # so a cut can never clip a word even when the service's word timings are a little off
    import numpy as np, soundfile as sf
    y, _ = sf.read(wav); MAXP = .3; fr_ = int(.01 * SR)
    rms = np.array([np.sqrt((y[i:i + fr_] ** 2).mean() + 1e-12) for i in range(0, len(y) - fr_, fr_)])
    quiet = rms < max(rms.max() * .03, 1e-4)
    cut_at, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]: j += 1
            a0, a1 = i * .01, j * .01
            if a1 - a0 > MAXP + .05 and a0 > .05 and j < len(quiet): cut_at.append((a0 + MAXP / 2, a1 - MAXP / 2))
            i = j
        else: i += 1
    segs, last = [], 0.0
    for g0, g1 in cut_at: segs.append(y[int(last * SR):int(g0 * SR)]); last = g1
    segs.append(y[int(last * SR):])
    f = int(.01 * SR)
    for k in range(len(segs) - 1):          # 10 ms fades at each splice
        if len(segs[k]) > f: segs[k] = segs[k].copy(); segs[k][-f:] *= np.linspace(1, 0, f)
        if len(segs[k + 1]) > f: segs[k + 1] = segs[k + 1].copy(); segs[k + 1][:f] *= np.linspace(0, 1, f)
    sf.write(wav, np.concatenate(segs).astype(np.float32), SR)
    def mv(t):
        d = 0
        for g0, g1 in cut_at:
            if t >= g1: d += g1 - g0
            elif t > g0: return g0 - d
        return t - d
    ws = [[w, mv(a), mv(b)] for w, a, b in ws]
    T[l['id']] = {'text': l.get('say', l['text']), 'start': ws[0][1], 'end': ws[-1][2] + .08, 'words': ws}
    print(l['id'], round(words[-1][2] - words[0][1], 2), 's', l['text'])
    json.dump(T, open(tpath, 'w'), ensure_ascii=False, indent=0)

# timeline: lines back to back (no dead air), each line's speech starts after the previous one ends + its gap
tl, t = [], 0.0
for l in L:
    t += l.get('gap', .18)
    if 'beat' in l:
        tl.append({'id': l['id'], 'shot': l['shot'], 't0': round(t, 3), 't1': round(t + l['beat'], 3)}); t += l['beat']; continue
    x = T[l['id']]; t0 = t - x['start']          # where the wav starts so that speech starts at t
    sp = x['end'] - x['start']
    tl.append({'id': l['id'], 'shot': l['shot'], 't0': round(t, 3), 't1': round(t + sp, 3), 'wav0': round(t0, 3), 'key': l.get('key', []), **({'stages': l['stages']} if 'stages' in l else {}), **({'counter': l['counter']} if 'counter' in l else {}), **({'counter': l['counter']} if 'counter' in l else {}),
               'words': [[w, round(a - x['start'] + t, 3), round(b - x['start'] + t, 3)] for w, a, b in x['words']]})
    t += sp
json.dump({'dur': round(t, 3), 'lines': tl}, open(os.path.join(HERE, f'timeline{SUF}.json'), 'w'), ensure_ascii=False, indent=1)
print('timeline', round(t, 2), 's')
