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
  [0.6, 3.4, 'Nadapa ka.|Sa harap ng LAHAT.'],
  [3.7, 5.9, 'Gusto mo nang lamunin ng lupa.'],
  [6.5, 11.8, 'Pakiramdam mo,|lahat nakatingin sa’yo.'],
  [12.5, 17.8, 'At iniisip nilang|nakakahiya ka.'],
  [18.6, 23.7, 'Alas-tres na ng madaling-araw…|iniisip mo pa rin.'],
  [27.0, 30.4, 'Pero halos walang nakapansin.'],
  [30.6, 34.3, 'Abala silang lahat|sa sarili nilang spotlight.'],
  [35.2, 39.4, 'Kasi pati sila,|may sariling inaalala.'],
  [39.6, 43.8, 'Iniisip din nila kung ano|ang tingin mo sa KANILA.'],
  [45.0, 47.9, 'Sobra nating tinatantiya|kung gaano tayo napapansin.'],
  [48.5, 51.2, 'Isang eksperimento sa Cornell,|taong 2000.'],
  [51.4, 53.9, 'Pinasuot sa mga estudyante|ang isang nakakahiyang T-shirt.'],
  [54.5, 57.0, 'Hula nila: ilan sa klase|ang makakapansin?'],
  [57.2, 60.0, 'Halos KALAHATI.'],
  [60.4, 63.9, 'Ang totoo? 23% lang.'],
  [64.2, 67.8, 'Mga 1 sa bawat 4 na tao.'],
  [68.6, 72.6, 'Hindi ka bida|sa kuwento ng iba.'],
  [72.8, 76.8, 'Bida sila|sa sarili nilang kuwento.'],
  [77.3, 81.8, 'Kaya huminga ka. Tumayo.|Ituloy ang sayaw.'],
  [86.0, 89.8, 'I-share sa kaibigan mong|overthinker.'],
];

// beats where things are counted (bells in the score, light in the picture)
export const EYE_T = [6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];
export const MARQ = 'NAKAKAHIYA';
export const MARQ_T = [...MARQ].map((_, i) => 12.5 + i * .5);
export const BUBBLE_T = [35.0, 36.0, 37.0, 38.0];
export const DIAL = { up0: 55.0, up1: 57.5, drop: 60.5, oneIn4: 64.5 };
export const END_T = [...'SPOTLIGHT'].map((_, i) => 82.5 + i * .25);
export const HITS = { slam: 0.0, crash: 1.0, title: 44.5, clang: 60.5, bow: 79.5, last: 88.0 };
