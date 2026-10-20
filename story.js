// story.js — the timeline: picture, subtitles, foley and score cues all read these numbers
// Characters step at 12 fps (q); camera, portal, wipes and the fall run on ones.
export const DUR = 50.5;
export const ANIM_FPS = 12;
export const q = t => Math.floor(t * ANIM_FPS + 1e-6) / ANIM_FPS;

// dialogue start times (text and speaker in lines.json)
export const VO = {
  b1: .3, o1: 2.65, b2: 5.35, o2: 6.95,
  b3: 11.9, o3: 13.55, b4: 15.05,
  b5: 17.85, o4: 20.25,
  b6a: 22.0, b6b: 23.0, b6c: 23.56, b6d: 24.0,
  b7: 27.3, o5: 28.85, b8: 31.9, o6: 33.65, o7: 38.4, b9: 40.55,
};

// shot list [start, end, name, world]
export const SHOTS = [
  [0, 2.5, 'hook', 'home'], [2.5, 5.25, 'two', 'home'], [5.25, 6.75, 'bCU', 'home'], [6.75, 9.0, 'remote', 'home'],
  [9.0, 10.0, 'open', 'home'], [10.0, 10.75, 'gulp', 'home'], [10.75, 11.0, 'rush', 'home'],
  [11.0, 13.5, 'd1Wide', 'deli1'], [13.5, 15.0, 'oCU', 'deli1'], [15.0, 17.0, 'd1Panic', 'deli1'],
  [17.0, 19.0, 'aisle', 'deli2'], [19.0, 20.25, 'lick', 'deli2'], [20.25, 21.75, 'oSpecial', 'deli2'],
  [21.75, 26.75, 'fall', 'fall'],
  [26.75, 28.75, 'insert', 'gas'], [28.75, 31.25, 'oSalad', 'gas'], [31.25, 33.5, 'bite', 'gas'], [33.5, 38.0, 'explain', 'gas'],
  [38.0, 40.25, 'offer', 'gas'], [40.25, 42.25, 'refuse', 'gas'], [42.25, 46.0, 'leave', 'gas'],
  [46.0, DUR, 'title', 'title'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

// full-screen portal swirl wipes [time it covers the frame, half-width]
export const WIPES = [[11.0, .22], [17.0, .2]];

// world tags (terminal readout, top-left) [start, end, line 1, line 2, background, ink]
export const TAGS = [
  [.5, 4.6, 'HOME', '2 OPTIONS', '#7e6a93', '#fff'],
  [11.35, 15.4, 'DELI-VERSE 1', '30 OPTIONS', '#f06c5b', '#fff'],
  [17.3, 21.4, 'DELI-VERSE 2', '3,000 OPTIONS', '#d8263b', '#fff'],
  [24.7, 28.6, 'GAS STATION', '1 OPTION', '#a08a62', '#fff'],
  [33.9, 38.0, 'PARADOX OF CHOICE', 'SCHWARTZ, 2004', '#3b2346', '#f3f0a8'],
];

// key moments
export const T = {
  whip: [0, .32], turkey: 1.72,
  press: 8.72, burst: 9.0, hop: [9.05, 9.45], oonaIn: [9.45, 9.95],
  gulp: 10.2, yank: 10.5,
  d1SpitB: 11.08, d1LandB: 11.42, d1SpitO: 11.22, d1LandO: 11.6, d1Close: 12.0,
  d1Press: 16.55, d1Open: 16.6,
  d2SpitB: 17.2, d2LandB: 17.5, d2SpitO: 17.32, d2LandO: 17.66, d2Close: 18.0,
  slideIn: [19.05, 19.4], lick: [19.42, 19.95], twitch: 19.95,
  fallPress: 21.45,
  hang: [21.75, 21.95], floors: [21.95, 22.95, 23.5, 23.9], landB: 24.3, landO: 24.42, ceilClose: 24.75,
  hand: [27.05, 27.3], crinkle: 27.15,
  unwrap: 31.3, bite: 31.45, chew: [31.55, 33.5],
  reopen: 38.05, shake: [40.3, 40.85],
  shrug: [42.55, 42.95], oonaWalk: [43.0, 43.55], close: 43.85,
  title: 46.0,
};

// score cues (music/score.py): t0 is each cue's first beat = its cut
export const CUES = [
  { name: 'home', t0: 0.0, t1: 11.0, bpm: 120 },
  { name: 'deli1', t0: 11.0, t1: 17.0, bpm: 120 },
  { name: 'deli2', t0: 17.0, t1: 21.75, bpm: 144 },
  { name: 'fall', t0: 21.75, t1: 24.3, bpm: 168, hits: [21.95, 22.95, 23.5, 23.9] },
  { name: 'bliss', t0: 31.5, t1: 42.15, bpm: 90 },
  { name: 'lone', t0: 44.0, t1: DUR, bpm: 120, hit: 46.0 },
];
