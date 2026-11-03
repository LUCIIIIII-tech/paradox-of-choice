"""Bring the latest render into the HyperFrames finishing project: copies ../out/video.mp4 and ../out/mix.wav to assets/,
then sets every data-duration in index.html to the reel length from ../timeline.json. Run after build.sh (or after a render part).
Usage: python sync.py   then   npm run dev   (preview)  /  npm run check"""
import os, re, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); UP = os.path.join(HERE, '..')
os.makedirs(os.path.join(HERE, 'assets'), exist_ok=True)
for f in ('video.mp4', 'mix.wav'):
    src = os.path.join(UP, 'out', f)
    if os.path.exists(src): shutil.copy(src, os.path.join(HERE, 'assets', f)); print('copied', f)
    else: print('missing', src, '(run ../build.sh first)')
dur = json.load(open(os.path.join(UP, 'timeline.json'), encoding='utf-8'))['dur']
p = os.path.join(HERE, 'index.html'); s = open(p, encoding='utf-8').read()
s = re.sub(r'data-duration="[0-9.]+"', f'data-duration="{dur}"', s)
s = re.sub(r'i < \d+; i\+\+\) tl\.set\("#grain"', f'i < {int(dur)}; i++) tl.set("#grain"', s)
open(p, 'w', encoding='utf-8', newline='\n').write(s); print('duration', dur)
