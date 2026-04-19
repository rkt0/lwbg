import {qs, ael} from './utility.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';

export const music = {
  element: qs('#music-player'),
  dir: 'audio/music',
  tooRecent: 6,
  recentIds: [],
  nowPlaying: null,
  audioOn: true,
  freqWeightFn: x => Math.exp(- x / 2),
}
music.playlist = [
  new Track('Grim Idol',            1, true),
  new Track('Obliteration',         1, true),
  new Track('Volatile Reaction',    1, true),
  new Track('Feral Chase',          1, false),
  new Track('Malicious',            1, false),
  new Track('Hot Pursuit',          1, false),
  new Track('Black Vortex',         2, true),
  new Track('Eternal Terminal',     2, true),
  new Track('Mistake the Getaway',  2, true),
  new Track('Serpentine Trek',      2, false),
  new Track('Shamanistic',          2, false),
  new Track('Zombie Chase',         2, false),
  new Track('Chase',                3, true),
  new Track('Clenched Teeth',       3, true),
  new Track('Darkling',             3, true),
  new Track('Constance',            3, false),
  new Track('Drums of the Deep',    3, false),
  new Track('Prelude and Action',   3, false),
  new Track('Exotic Battle',        4, true),
  new Track('Faceoff',              4, true),
  new Track('Nerves',               4, true),
  new Track('Dangerous',            4, false),
  new Track('Enter the Maze',       4, false),
  new Track('River of Io',          4, false),
];

// Track constructor
function Track(title, quality, heavy) {
  this.src = `${music.dir}/${
    title.toLowerCase().replaceAll(' ', '-')
  }.mp3`;
  this.title = title;
  this.freqWeight = music.freqWeightFn(quality);
  this.heavy = heavy;
}

// Compute cdf of track sampling distribution
{
  const nT = music.playlist.length;
  music.cdf = new Array(nT).fill(0);
  for (let i = 0; i < nT; i++) {
    for (let j = 0; j <= i; j++) {
      music.cdf[i] += music.playlist[j].freqWeight;
    }
  }
  const tot = music.cdf[nT - 1];
  for (let i = 0; i < nT; i++) music.cdf[i] /= tot;
}

// Draw next track and play
music.next = (skipCurrent, any) => {
  let nextId, okNext;
  const {playlist: pl, recentIds: ri} = music;
  if (music.nowPlaying !== null && ! skipCurrent) {
    if (ri.length === music.tooRecent) ri.shift();
    ri.push(music.nowPlaying);
  }
  const {cycle, startAt} = debug.music;
  if (cycle) {
    okNext = true;
    nextId = (music.nowPlaying ?? (startAt - 1)) + 1;
    if (nextId === pl.length) nextId = 0;
  }
  const avoid = [...ri];
  if (skipCurrent) avoid.push(music.nowPlaying);
  while (! okNext) {
    const rand = prng.music();
    nextId = 0;
    while (music.cdf[nextId] < rand) nextId++;
    if (any && nextId !== music.nowPlaying) break;
    if (avoid.includes(nextId)) continue;
    const half = Math.floor(music.tooRecent / 2);
    const l = ri.length;
    const nH = ri.filter(e => pl[e].heavy).length;
    const nextIsH = pl[nextId].heavy;
    if (l >= half * 2) {
      okNext = true;
    } else if (l) {
      okNext = nH === half ? ! nextIsH :
          l - nH === half ? nextIsH : true;
    } else {
      okNext = ! nextIsH;
    }
  }
  music.element.src = music.playlist[nextId].src;
  music.element.play();
  music.nowPlaying = nextId;
};

ael(music.element, 'ended', () => {music.next();});
