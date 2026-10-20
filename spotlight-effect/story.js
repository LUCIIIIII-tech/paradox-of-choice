// story.js: the timeline. Picture, subtitles and score all read these numbers. 120 bpm: one beat = 0.5 s.
export const DUR = 90;
export const W = 1080, H = 1920;
export const q = t => Math.floor(t * 12 + 1e-6) / 12;          // characters step on twos

// [start, end, name]
export const SHOTS = [
  [0, 3.5, 'hook'], [3.5, 6.0, 'face'], [6.0, 12.0, 'eyes'], [12.0, 18.0, 'marquee'], [18.0, 24.0, 'night'],
  [24.0, 26.5, 'doorT'], [26.5, 34.5, 'crowd'], [34.5, 44.0, 'bubbles'],
  [44.0, 48.0, 'title'], [48.0, 54.0, 'shirt'], [54.0, 68.0, 'dial'],
  [68.0, 77.0, 'kaleido'], [77.0, 82.0, 'rise'], [82.0, DUR, 'end'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

// door leaves [time the seam is closed, half-duration]: they close over the outgoing shot and split on the new one
export const DOORS = [[26.5, .45], [44.0, .4], [68.0, .4]];

// subtitle cards [start, end, text] (two lines split on '|')
export const SUBS = [
  [0.6, 3.5, 'Nadapa ka.|Sa harap ng LAHAT.'],
  [3.6, 6.1, 'Gusto mo nang lamunin ng lupa.'],
  [6.3, 9.5, 'Pakiramdam mo,|lahat nakatingin sa’yo.'],
  [12.6, 15.5, 'At iniisip nilang|nakakahiya ka.'],
  [18.2, 22.0, 'Alas-tres na ng madaling-araw…|iniisip mo pa rin.'],
  [26.6, 28.5, 'Pero halos walang nakapansin.'],
  [28.6, 31.5, 'Abala silang lahat|sa sarili nilang spotlight.'],
  [34.9, 37.7, 'Kasi pati sila,|may sariling inaalala.'],
  [37.8, 41.0, 'Iniisip din nila kung ano|ang tingin mo sa KANILA.'],
  [44.3, 47.5, 'Sobra nating tinatantiya|kung gaano tayo napapansin.'],
  [47.6, 50.6, 'Isang eksperimento sa Cornell,|taong 2000.'],
  [50.7, 53.9, 'Pinasuot sa mga estudyante|ang isang nakakahiyang T-shirt.'],
  [54.0, 56.9, 'Hula nila: ilan sa klase|ang makakapansin?'],
  [57.0, 58.5, 'Halos KALAHATI.'],
  [60.5, 64.1, 'Ang totoo? 23% lang.'],
  [64.2, 66.5, 'Mga 1 sa bawat 4 na tao.'],
  [68.3, 71.0, 'Hindi ka bida|sa kuwento ng iba.'],
  [72.6, 75.0, 'Bida sila|sa sarili nilang kuwento.'],
  [77.3, 82.0, 'Kaya huminga ka. Tumayo.|Ituloy ang sayaw.'],
  [84.9, 87.9, 'I-share sa kaibigan mong|overthinker.'],
];

// beats where things are counted (bells in the score, light in the picture)
export const EYE_T = [...Array(8)].map((_, i) => 6.4 + i * .3);
export const MARQ = 'NAKAKAHIYA';
export const MARQ_T = [...MARQ].map((_, i) => 12.5 + i * .3);
export const BUBBLE_T = [35.0, 36.0, 37.0, 38.0];
export const DIAL = { up0: 55.0, up1: 57.5, drop: 60.5, oneIn4: 64.5 };
export const END_T = [...'SPOTLIGHT'].map((_, i) => 82.5 + i * .15);
export const HITS = { slam: 0.0, crash: 1.0, title: 44.5, clang: 60.5, bow: 79.5, last: 88.0 };

// Dead air removed: [start, end] intervals of story time that are cut out of the final film (beat-aligned, so the score keeps its grid).
export const CUTS = [[9.5, 12.5], [15.5, 18.0], [22.0, 24.0], [25.5, 26.0], [31.5, 34.5], [41.0, 43.5], [58.5, 60.0], [66.5, 67.5], [71.0, 72.5], [75.0, 77.0], [82.0, 82.5]];
export const OUT_DUR = DUR - CUTS.reduce((a, [x, y]) => a + y - x, 0);
// film time -> story time
export const src = tf => { let t = tf; for (const [a, b] of CUTS) { if (t >= a) t += b - a; else break; } return t; };
// story time -> film time (a time inside a cut lands on the cut)
export const warp = ts => { let d = 0; for (const [a, b] of CUTS) { if (ts >= b) d += b - a; else if (ts > a) return a - d; } return ts - d; };
