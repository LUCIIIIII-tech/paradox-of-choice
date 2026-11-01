"""Flash safety check on a rendered video: mean relative luminance per frame (WCAG-style), then counts the general flashes, i.e. pairs of
opposing changes of 10% or more where the darker state is below 0.8, inside any one-second window. More than 3 in a second fails.
Usage: python3 flashcheck.py video.mp4"""
import sys, subprocess, numpy as np
p = sys.argv[1]; W, H = 108, 192
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
rate = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.split()[0].strip(',')
fps = float(rate.split('/')[0]) / float(rate.split('/')[1])
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3) / 255.0
lin = np.where(f <= .04045, f / 12.92, ((f + .055) / 1.055) ** 2.4)
L = (lin @ np.array([.2126, .7152, .0722])).mean(axis=(1, 2))
# turn the luminance curve into transitions: a run in one direction that moves 0.1 or more
ev, i0, d0 = [], 0, 0
for i in range(1, len(L)):
    d = np.sign(L[i] - L[i - 1])
    if d == 0: continue
    if d0 and d != d0:
        if abs(L[i - 1] - L[i0]) >= .1 and min(L[i - 1], L[i0]) < .8: ev.append(i - 1)
        i0 = i - 1
    d0 = d
worst, at = 0, 0
for k, e in enumerate(ev):
    n = sum(1 for x in ev[k:] if x - e < fps) // 2
    if n > worst: worst, at = n, e / fps
print(f'{len(L)} frames, max frame-to-frame luminance change {np.abs(np.diff(L)).max():.3f}, transitions >=10%: {len(ev)}')
print(f'worst one-second window: {worst} flash(es) at {at:.1f}s ->', 'PASS' if worst <= 3 else 'FAIL')
