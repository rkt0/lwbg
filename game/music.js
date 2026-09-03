import {qjs, qd, isNull} from './utility.js';
import {prng} from './prngs.js';
import {debug} from './debug.js';

export const music = {
  element: qjs('music-player'),
  audioOn: false,
  allowed: false,
  next(skipCurrent, any) {
    const {cycle, startAt} = debug.music;
    if (cycle) {
      if (isNull(nowPlaying)) play(startAt);
      else play((nowPlaying + 1) % nTracks);
      return;
    }
    if (!isNull(nowPlaying) && !skipCurrent) {
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
  reconcilePlayPauseState() {
    if (!this.allowed) return;
    const {element} = this;
    if (this.audioOn) {
      if (element.src) element.play();
      else this.next();
    } else element.pause();
  },
};

const tooRecent = 6;
const recentIds = [];
let nowPlaying = null;
function play(id) {
  const {src, title, artist} = playlist[id];
  music.element.src = src;
  songElement.textContent = title;
  artistElement.textContent = artist;
  nowPlaying = id;
  if (music.audioOn) music.element.play();
};

class Track {
  constructor(title, quality, heavy) {
    this.src = `audio/music/${
      title.toLowerCase().replaceAll(' ', '-')
    }.mp3`;
    this.title = title;
    this.freqWeight = Math.exp(-0.5 * quality);
    this.heavy = heavy;
    this.artist = 'Kevin MacLeod';
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

const songElement = qd('song');
const artistElement = qd('artist');

music.element.addEventListener('ended', () => {
  music.next();
});
