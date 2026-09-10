import {qjs, closestData} from './utility.js';
import {atClick} from './mouse-events.js';
import {template} from './template.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {sfx} from './sfx.js';

export async function audioPanel(waitForFadeOut) {
  if (!music.allowed) return;
  await anim.fade(section, 1, aTime);
  section.inert = false;
  wait = waitForFadeOut;
  return new Promise((resolve) => {
    finish = resolve;
  });
}

// Must be in this scope
let finish, wait;

// Element references
const section = qjs('audio-panel');
const musicPanel = qjs('music-panel');
const playlistPanel = qjs('playlist-panel');
const sfxPanel = qjs('sfx-panel');

// Animation time for menu fade
const aTime = anim.time.menuFade;

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
async function hide() {
  section.inert = true;
  const fade = anim.fade(section, 0, aTime);
  if (wait) await fade;
  finish();
}
async function showMusicPanel() {
  await anim.fade(musicPanel, 1, aTime);
  musicPanel.inert = false;
}
async function hideMusicPanel() {
  musicPanel.inert = true;
  await anim.fade(musicPanel, 0, aTime);
}
async function showPlaylist() {
  await hideMusicPanel();
  await anim.fade(playlistPanel, 1, aTime);
  playlistPanel.inert = false;
}
async function hidePlaylist() {
  playlistPanel.inert = true;
  await anim.fade(playlistPanel, 0, aTime);
  showMusicPanel();
}
function playChosenTrack(index) {
  music.next(music.playlist[index]);
  hidePlaylist();
}
async function showSfxPanel() {
  await hideMusicPanel();
  await anim.fade(sfxPanel, 1, aTime);
  sfxPanel.inert = false;
}
async function hideSfxPanel() {
  sfxPanel.inert = true;
  await anim.fade(sfxPanel, 0, aTime);
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
