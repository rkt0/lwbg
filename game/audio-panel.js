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
  },
  hide() {
    section.inert = true;
    section.style.display = 'none';
  },
};

// Element references
const section = qjs('audio-panel');
const musicPanel = qjs('music-panel');
const playlistPanel = qjs('playlist-panel');
const sfxPanel = qjs('sfx-panel');

// Create playlist
const tracks = [];
for (const [id, track] of music.playlist.entries()) {
  const element = template('track');
  element.dataset.track = id;
  element.textContent = track.title;
  tracks.push(element);
}
qjs('playlist').append(...tracks);

// Create T-rex sound effect list
const trexEntries = Object.entries(sfx.trexSounds);
const trexSoundElements = [];
for (const [name, {title}] of trexEntries) {
  const element = template('sound');
  element.dataset.sound = title;
  element.textContent = name;
  trexSoundElements.push(element);
}
qjs('trex-sounds').append(...trexSoundElements);

// Create raptor sound effect list
const raptorSoundElements = [];
const sorted = sfx.raptorSounds.toSorted((a, b) => {
  return b.freqWeight - a.freqWeight;
});
for (const {title} of sorted) {
  const element = template('sound');
  element.dataset.sound = title;
  raptorSoundElements.push(element);
}
qjs('raptor-sounds').append(...raptorSoundElements);

// Needed for click handler
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
function playChosenTrack(id) {
  music.next(music.playlist[id]);
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
function playChosenSound(id) {
  console.log(id);
}

// Dispatch table for click handler
const dispatch = {
  'next-track': () => music.next(),
  'choose-track': showPlaylist,
  'hide-audio': () => audioPanel.hide(),
  'hide-playlist': hidePlaylist,
  'show-sfx': showSfxPanel,
  'hide-sfx': hideSfxPanel,
};

// Click handler
atClick(section, (e) => {
  const trackId = closestData(e, 'track');
  if (trackId) return playChosenTrack(trackId);
  const soundId = closestData(e, 'sound');
  if (soundId) return playChosenSound(soundId);
  dispatch[closestData(e)]?.();;
});
