import {qjs, closestData} from './utility.js';
import {atClick} from './mouse-events.js';
import {music} from './music.js';

export const audioPanel = {
  show() {
    if (!music.allowed) return;
    section.style.display = 'grid';
    section.inert = false;
  },
  hide() {
    section.inert = true;
    section.style.display = 'none';
  },
};

// Element references
const section = qjs('audio-panel');

// Dispatch table for click handler
const dispatch = {
  'next-track': () => music.next(),
  'hide-music': () => audioPanel.hide(),
};

// Click handler
atClick(section, (e) => {
  dispatch[closestData(e)]?.();;
});
