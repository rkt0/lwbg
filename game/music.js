import {qjs, qd, arrayCumSum} from './utility.js';
import {prng} from './prngs.js';
import {debug} from './debug.js';

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

export const music = {
  element: qjs('music-player'),
  audioOn: false,
  allowed: false,
  next() {
    updateRecent();
    play(nextTrack());
    // const {cycle, startAt} = debug.music;
    // if (cycle) {
    //   if (isNull(nowPlaying)) play(startAt);
    //   else play((nowPlaying + 1) % nTracks);
    //   return;
    // }
    // if (!isNull(nowPlaying)) {
    //   if (recentIds.length === tooRecent) {
    //     recentIds.shift();
    //   }
    //   recentIds.push(nowPlaying);
    // }
    // let nextId, okNext;
    // while (!okNext) {
    //   const rand = prng.music();
    //   nextId = 0;
    //   while (cdf[nextId] < rand) nextId++;
    //   if (recentIds.includes(nextId)) continue;
    //   const half = Math.floor(tooRecent / 2);
    //   const l = recentIds.length;
    //   const nHeavy = recentIds.filter((e) => {
    //     return this.playlist[e].heavy
    //   }).length;
    //   const nextIsHeavy = this.playlist[nextId].heavy;
    //   if (l >= half * 2) okNext = true;
    //   else if (l) {
    //     okNext = nHeavy === half ? !nextIsHeavy :
    //       l - nHeavy === half ? nextIsHeavy : true;
    //   } else okNext = !nextIsHeavy;
    // }
    // play(nextId);
  },
  reconcilePlayPauseState() {
    if (!this.allowed) return;
    const {element} = this;
    if (this.audioOn) {
      if (element.src) element.play();
      else this.next();
    } else element.pause();
  },
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
};

// Configuration settings
const nRecent = 6;
// const heavyStartScript = [false, true, true, false];
// const heavyRunMax = 2;

// State
const recent = [];
let nowPlaying;

// Helper functions
function updateRecent() {
  if (nowPlaying == null) return;
  recent.push(nowPlaying);
  if (recent.length > nRecent) recent.shift();
}
function nextTrackRequiredHeavy() {
  const l = recent.length;
  if (!l) return false;
  const half = Math.floor(nRecent / 2);
  if (l >= half * 2) return;
  const nHeavy = recent.filter(t => t.heavy).length;
  if (nHeavy === half) return false;
  if (l - nHeavy === half) return true;
  // if (recentIds.length in heavyStartScript) {
  //   return heavyStartScript[recentIds.length];
  // }
  // if (recentIds.length < heavyRunMax) return;
  // const lastFew = recentIds.slice(-heavyRunMax);
  // const lastFewHeavyStatus = lastFew.map(id => {
  //   return music.playlist[id].heavy;
  // });
  // const lastHeavyStatus = lastFewHeavyStatus.pop();
  // if (lastFewHeavyStatus.every(x => x === lastHeavyStatus)) return !lastHeavyStatus;
}
function drawTrack(tracks) {
  const weights = tracks.map(t => t.freqWeight);
  const cumulative = arrayCumSum(weights);
  const total = cumulative.at(-1);
  if (!total) return;
  const rand = prng.music() * total;
  let id = 0;
  while (cumulative[id] < rand) id++;
  return tracks[id];
}
function nextTrack() {
  if (debug.music.cycle) {
    // This is wrong
    if (nowPlaying == null) id = debug.music.start;
    else id = (nowPlaying + 1) % nTracks;
  }
  const requiredHeavy = nextTrackRequiredHeavy();
  const tracks = music.playlist.filter(track => {
    if (recent.includes(track)) return false;
    const {heavy} = track;
    return (heavy === (requiredHeavy ?? heavy));
  });
  return drawTrack(tracks) ?? nowPlaying;
  // let track;
  // while (true) {
  //   const rand = prng.music();
  //   let id = 0;
  //   while (cdf[id] < rand) id++;
  //   track = music.playlist[id];
  //   if (recent.includes(track)) continue;
  //   const {heavy} = track;
  //   if (heavy === (requiredHeavy ?? heavy)) break;
  // }
  // return track;
}
function play(track) {
  const {src, title, artist} = track;
  music.element.src = src;
  songElement.textContent = title;
  artistElement.textContent = artist;
  nowPlaying = track;
  if (music.audioOn) music.element.play();
};

const nTracks = music.playlist.length;
const cdf = Array(nTracks).fill(0);
cdf[0] = music.playlist[0].freqWeight;
for (let i = 1; i < nTracks; i++) {
  cdf[i] = cdf[i - 1] + music.playlist[i].freqWeight;
}
const total = cdf[nTracks - 1];
for (let i = 0; i < nTracks; i++) cdf[i] /= total;

const songElement = qd('song');
const artistElement = qd('artist');

music.element.addEventListener('ended', () => {
  music.next();
});
