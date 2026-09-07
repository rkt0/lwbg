import {qjs, qd, arrayCumSum} from './utility.js';
import {prng} from './prngs.js';

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
  offScript: false,
  next(chosenTrack) {
    if (chosenTrack) this.offScript = true;
    updateRecent();
    play(chosenTrack ?? nextTrack());
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
const heavyScript = [false, true, true, false];
const heavyRunMax = 2;

// State
const recent = [];
let nowPlaying;

// Element references
const songElement = qd('song');
const artistElement = qd('artist');

// Helper functions
function updateRecent() {
  if (nowPlaying) recent.push(nowPlaying);
  if (recent.length > nRecent) recent.shift();
}
function nextTrackRequiredHeavy() {
  const nRecent = recent.length;
  if (!music.offScript && (nRecent in heavyScript)) {
    return heavyScript[nRecent];
  }
  if (nRecent < heavyRunMax) return;
  const possibleHeavyRun =
    recent.slice(-heavyRunMax).map(t => t.heavy);
  const runEnd = possibleHeavyRun.pop();
  if (possibleHeavyRun.every(x => x === runEnd)) {
    return !runEnd;
  }
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
  const requiredHeavy = nextTrackRequiredHeavy();
  const tracks = music.playlist.filter(track => {
    if (recent.includes(track)) return false;
    const {heavy} = track;
    return (heavy === (requiredHeavy ?? heavy));
  });
  return drawTrack(tracks) ?? nowPlaying;
}
function play(track) {
  const {src, title, artist} = track;
  music.element.src = src;
  songElement.textContent = title;
  artistElement.textContent = artist;
  nowPlaying = track;
  if (music.audioOn) music.element.play();
};

// When track ends, advance to next track
music.element.addEventListener('ended', () => {
  music.next();
});
