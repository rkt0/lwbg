import {qjs, closestData} from './utility.js';
import {atClick} from './mouse-events.js';
import {template} from './template.js';
import {music} from './music.js';
import {sfx} from './sfx.js';

export const audioPanel = {
  show() {
    if (!music.allowed) return;
    section.style.display = '';
    section.inert = false;
    return new Promise((resolve) => {
      finish = resolve;
    });
  },
};

// Must be in this scope
let finish;

// Element references
const section = qjs('audio-panel');
const musicPanel = qjs('music-panel');
const playlistPanel = qjs('playlist-panel');
const sfxPanel = qjs('sfx-panel');

// Create playlist
const tracks = [];
for (const [i, track] of music.playlist.entries()) {
  const element = template('track');
  element.dataset.trackIndex = i;
  element.textContent = track.title;
  tracks.push(element);
}
qjs('playlist').append(...tracks);

// Create T-rex sound effect list
const trexSoundElements = [];
for (const {key} of sfx.trexSounds) {
  const element = template('sound');
  element.dataset.soundKey = key;
  element.textContent = key.split('-').at(-1);
  trexSoundElements.push(element);
}
qjs('trex-sounds').append(...trexSoundElements);

// Create raptor sound effect list
const raptorSoundElements = [];
const sorted = sfx.raptorSounds.toSorted((a, b) => {
  return b.freqWeight - a.freqWeight;
});
for (const {key} of sorted) {
  const element = template('sound');
  element.dataset.soundKey = key;
  raptorSoundElements.push(element);
}
qjs('raptor-sounds').append(...raptorSoundElements);

// Needed for click handler
function hide() {
  section.inert = true;
  section.style.display = 'none';
  finish();
}
function showMusicPanel() {
  musicPanel.style.display = '';
  musicPanel.inert = false;
}
function hideMusicPanel() {
  musicPanel.inert = true;
  musicPanel.style.display = 'none';
}
function showPlaylist() {
  hideMusicPanel();
  playlistPanel.style.display = '';
  playlistPanel.inert = false;
}
function hidePlaylist() {
  playlistPanel.inert = true;
  playlistPanel.style.display = 'none';
  showMusicPanel();
}
function playChosenTrack(index) {
  music.next(music.playlist[index]);
  hidePlaylist();
}
function showSfxPanel() {
  hideMusicPanel();
  sfxPanel.style.display = '';
  sfxPanel.inert = false;
}
function hideSfxPanel() {
  sfxPanel.inert = true;
  sfxPanel.style.display = 'none';
  showMusicPanel();
}

// Dispatch table for click handler
const dispatch = {
  'next-track': () => music.next(),
  'choose-track': showPlaylist,
  'hide-audio': hide,
  'hide-playlist': hidePlaylist,
  'show-sfx': showSfxPanel,
  'hide-sfx': hideSfxPanel,
};

// Click handler
atClick(section, (e) => {
  const trackIndex = closestData(e, 'track-index');
  if (trackIndex) return playChosenTrack(trackIndex);
  const soundKey = closestData(e, 'sound-key');
  if (soundKey) return sfx.play(soundKey);
  dispatch[closestData(e)]?.();;
});
