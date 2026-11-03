"""Two voices with edge-tts (online): lines.json -> voices/<id>.wav (48 kHz mono) + voices/timing.json (duration + word times per line).
The wolf is low, slow and smug; the pig is higher and quicker. Usage: python3 tts.py
Behind a TLS-intercepting proxy set CA_BUNDLE to its certificate bundle."""
import os, json, asyncio, subprocess
import certifi
if os.environ.get('CA_BUNDLE'): certifi.where = lambda: os.environ['CA_BUNDLE']
import edge_tts
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, 'voices'); os.makedirs(V, exist_ok=True)
CAST = {'WOLF': dict(voice='en-US-ChristopherNeural', rate='-12%', pitch='-10Hz'),
        'PIG': dict(voice='en-US-EricNeural', rate='+4%', pitch='+22Hz')}
# per-voice colour after TTS: the wolf gets a little more chest, the pig a thin, nasal band
FX = {'WOLF': 'aresample=48000,asetrate=48000*0.94,aresample=48000,atempo=1.04,bass=g=4:f=140,highpass=f=70',
      'PIG': 'aresample=48000,highpass=f=220,equalizer=f=1800:t=q:w=1.2:g=5'}

async def say(l):
    c = edge_tts.Communicate(l['text'], boundary='WordBoundary', **CAST[l['who']])
    mp3, words = os.path.join(V, l['id'] + '.mp3'), []
    with open(mp3, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': words.append([ch['text'], ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7])
    wav = os.path.join(V, l['id'] + '.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', mp3, '-af', FX[l['who']] + ',silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ac', '1', '-ar', '48000', wav], check=True)
    os.remove(mp3)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
    if l['who'] == 'WOLF': words = [[w, a / (0.94 * 1.04), b / (0.94 * 1.04)] for w, a, b in words]   # the pitch drop stretches time
    w0 = words[0][1] if words else 0                                                             # leading silence was trimmed
    return l['id'], {'dur': round(dur, 3), 'words': [[w, round(max(0, a - w0), 3), round(max(0, b - w0), 3)] for w, a, b in words]}

async def main():
    L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
    out = dict(await asyncio.gather(*[say(l) for l in L]))
    json.dump(out, open(os.path.join(V, 'timing.json'), 'w'), indent=1)
    for k, v in out.items(): print(k, v['dur'], 's')
    lips(L); timeline(L, out)

def lips(L):      # mouth openness per 1/24 s, from the voice's own loudness
    import numpy as np, soundfile as sf
    res = {}
    for l in L:
        y, sr = sf.read(os.path.join(V, l['id'] + '.wav')); fr = sr // 24
        r = np.array([np.sqrt((y[i:i + fr] ** 2).mean()) for i in range(0, len(y), fr)])
        res[l['id']] = [round(float(min(1, v / (np.percentile(r, 90) + 1e-6))), 2) for v in r]
    json.dump(res, open(os.path.join(V, 'lips.json'), 'w'))

GAP = {'p1': .2, 'w2': .2, 'w3': .15}     # breath before each line; the reel ends on ~1 s of the wolf's eyes in the dark
def timeline(L, T):
    t, lines = .15, []
    for l in L:
        t += GAP.get(l['id'], 0); d = T[l['id']]['dur']
        lines.append({'id': l['id'], 'who': l['who'], 'text': l['text'], 't0': round(t, 3), 't1': round(t + d, 3),
                      'words': [[w, round(t + a, 3), round(t + b, 3)] for w, a, b in T[l['id']]['words']]})
        t += d
    json.dump({'dur': round(max(10, t + 1), 2), 'lines': lines}, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
    print('timeline', round(max(10, t + 1), 2), 's')
asyncio.run(main())
