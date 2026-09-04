import {qjs, closestData} from './utility.js';
import {atClick} from './mouse-events.js';
import {template} from './template.js';
import {music} from './music.js';

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
const playlist = qjs('playlist');

// Create song list
const tracks = [];
for (const [id, track] of music.playlist.entries()) {
  const element = template('track');
  element.dataset.track = id;
  element.textContent = track.title;
  tracks.push(element);
}
playlist.append(...tracks);

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
  showMusicPanel();
  playlistPanel.inert = true;
  playlistPanel.style.display = 'none';
}

// Dispatch table for click handler
const dispatch = {
  'next-track': () => music.next(),
  'choose-track': showPlaylist,
  'hide-audio': () => audioPanel.hide(),
  'hide-playlist': hidePlaylist,
};

// Click handler
atClick(section, (e) => {
  const track = closestData(e, 'track');
  if (track) return console.log(`play ${track}`);
  dispatch[closestData(e)]?.();;
});
