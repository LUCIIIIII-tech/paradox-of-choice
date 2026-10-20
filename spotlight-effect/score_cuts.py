"""The dead-air cuts shared by voicemix.py (same list as story.js CUTS and score.py)."""
CUTS = [[9.5, 12.5], [15.5, 18.0], [22.0, 24.0], [25.5, 26.0], [31.5, 34.5], [41.0, 43.5], [58.5, 60.0], [66.5, 67.5], [71.0, 72.5], [75.0, 77.0], [82.0, 82.5]]
def warp(ts):
    d = 0
    for a, b in CUTS:
        if ts >= b: d += b - a
        elif ts > a: return None          # inside a cut: dropped
    return ts - d
