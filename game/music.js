import {qda, qs, qsa, ael, isNull} from './utility.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';

export const music = {
  audioOn: true,
  next(skipCurrent, any) {
    const {cycle, startAt} = debug.music;
    if (cycle) {
      if (isNull(nowPlaying)) play(startAt);
      else play((nowPlaying + 1) % nTracks);
      return;
    }
    if (!isNull(nowPlaying) && ! skipCurrent) {
      if (recentIds.length === tooRecent) {
        recentIds.shift();
      }
      recentIds.push(nowPlaying);
    }
    const avoid = [...recentIds];
    if (skipCurrent) avoid.push(nowPlaying);
    let nextId, okNext;
    while (!okNext) {
      const rand = prng.music();
      nextId = 0;
      while (cdf[nextId] < rand) nextId++;
      if (any && nextId !== nowPlaying) break;
      if (avoid.includes(nextId)) continue;
      const half = Math.floor(tooRecent / 2);
      const l = recentIds.length;
      const nHeavy = recentIds.filter((e) => {
        return playlist[e].heavy
      }).length;
      const nextIsHeavy = playlist[nextId].heavy;
      if (l >= half * 2) okNext = true;
      else if (l) {
        okNext = nHeavy === half ? !nextIsHeavy :
          l - nHeavy === half ? nextIsHeavy : true;
      } else okNext = !nextIsHeavy;
    }
    play(nextId);
  },
  toggle() {
    if (this.audioOn) element.pause();
    else element.play();
    this.audioOn = !this.audioOn;
    for (const icon of icons) {
      icon.classList.toggle('inactive');
    }
  },
};

const element = qs('#music-player');
const icons = qda('icon');
const tooRecent = 6;
const recentIds = [];
let nowPlaying = null;
function play(id) {
  element.src = playlist[id].src;
  element.play();
  nowPlaying = id;
};

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
const playlist = [
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
];
const nTracks = playlist.length;

const cdf = Array(nTracks).fill(0);
cdf[0] = playlist[0].freqWeight;
for (let i = 1; i < nTracks; i++) {
  cdf[i] = cdf[i - 1] + playlist[i].freqWeight;
}
const total = cdf[nTracks - 1];
for (let i = 0; i < nTracks; i++) cdf[i] /= total;

ael(element, 'ended', () => music.next());
for (const button of qda('toggle-audio')) {
  ael(button, 'mousedown', () => music.toggle());
}
