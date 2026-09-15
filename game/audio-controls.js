import {qd} from './utility.js';
import {template} from './template.js';
import {music} from './music.js';

// Initialize controls
const controls = template('audio-controls');
const audio = music.element;
controls.dataset.audioControls = audio.dataset.js;
audio.after(controls);

// Other element references
const current = qd('time="current"', controls);
const duration = qd('time="duration"', controls);
const restart = qd('restart-audio', controls);
const progress = qd('progress', controls);
const progressFill = progress.firstElementChild;

// Update current time and duration
function formatTime(seconds) {
  if (isNaN(seconds)) return '0 : 00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} : ${s.toString().padStart(2, '0')}`;
}
audio.addEventListener('loadedmetadata', () => {
  duration.textContent = formatTime(audio.duration);
});
audio.addEventListener('timeupdate', () => {
  const {currentTime, duration} = audio;
  current.textContent = formatTime(currentTime);
  const percent = 100 * currentTime / duration;
  progressFill.style.width = `${percent}%`;
});

// Needed for click handler
function seek(e) {
  let proportion = 0;
  if (e) {
    const rect = progress.getBoundingClientRect();
    proportion = (e.clientX - rect.left) / rect.width;
  }
  audio.currentTime = proportion * audio.duration;
}

// Click handler
export function handleAudioControlsClick(e) {
  if (restart.contains(e.target)) return seek();
  if (progress.contains(e.target)) seek(e);
  // Button to toggle audio handled in audio-panel.js
}
