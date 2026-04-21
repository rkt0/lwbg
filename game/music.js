import {qs, ael, isNull} from './utility.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';

class Track {
  constructor(title, quality, heavy) {
    this.src = `audio/music/${
      title.toLowerCase().replaceAll(' ', '-')
    }.mp3`;
    this.title = title;
    this.freqWeight = Math.exp(-0.5 * quality);
    this.heavy = heavy;
  }
}

export const music = {
  element: qs('#music-player'),
  tooRecent: 6,
  recentIds: [],
  nowPlaying: null,
  audioOn: true,
  playlist: [
    new Track('Grim Idol', 1, true),
    new Track('Obliteration', 1, true),
    new Track('Volatile Reaction', 1, true),
    new Track('Feral Chase', 1, false),
    new Track('Malicious', 1, false),
    new Track('Hot Pursuit', 1, false),
    new Track('Black Vortex', 2, true),
    new Track('Eternal Terminal', 2, true),
    new Track('Mistake the Getaway', 2, true),
    new Track('Serpentine Trek', 2, false),
    new Track('Shamanistic', 2, false),
    new Track('Zombie Chase', 2, false),
    new Track('Chase', 3, true),
    new Track('Clenched Teeth', 3, true),
    new Track('Darkling', 3, true),
    new Track('Constance', 3, false),
    new Track('Drums of the Deep', 3, false),
    new Track('Prelude and Action', 3, false),
    new Track('Exotic Battle', 4, true),
    new Track('Faceoff', 4, true),
    new Track('Nerves', 4, true),
    new Track('Dangerous', 4, false),
    new Track('Enter the Maze', 4, false),
    new Track('River of Io', 4, false),
  ],
  play(id) {
    music.element.src = music.playlist[id].src;
    music.element.play();
    music.nowPlaying = id;
  },
  next(skipCurrent, any) {
    const {
      playlist: pl, recentIds: ri, nowPlaying: now,
    } = music;
    const {cycle, startAt} = debug.music;
    if (cycle) {
      if (isNull(now)) music.play(startAt);
      else music.play((now + 1) % pl.length);
      return;
    }
    if (!isNull(now) && ! skipCurrent) {
      if (ri.length === music.tooRecent) ri.shift();
      ri.push(now);
    }
    const avoid = [...ri];
    if (skipCurrent) avoid.push(now);
    let nextId, okNext;
    while (!okNext) {
      const rand = prng.music();
      nextId = 0;
      while (music.cdf[nextId] < rand) nextId++;
      if (any && nextId !== now) break;
      if (avoid.includes(nextId)) continue;
      const half = Math.floor(music.tooRecent / 2);
      const l = ri.length;
      const nH = ri.filter((e) => pl[e].heavy).length;
      const nextIsH = pl[nextId].heavy;
      if (l >= half * 2) okNext = true;
      else if (l) {
        okNext = nH === half ? !nextIsH :
          l - nH === half ? nextIsH : true;
      } else okNext = !nextIsH;
    }
    music.play(nextId);
  },
}

// Compute cdf of track sampling distribution
const nTracks = music.playlist.length;
music.cdf = new Array(nTracks).fill(0);
for (let i = 0; i < nTracks; i++) {
  for (let j = 0; j <= i; j++) {
    music.cdf[i] += music.playlist[j].freqWeight;
  }
}
const totalWeight = music.cdf[nTracks - 1];
for (let i = 0; i < nTracks; i++) {
  music.cdf[i] /= totalWeight;
}

ael(music.element, 'ended', () => {music.next();});
