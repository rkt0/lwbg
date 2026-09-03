import {dom} from './dom.js';
import {music} from './music.js';

export const audioPanel = {
  show() {
    if (!music.allowed) return;
    dom.audioPanel.style.display = 'grid';
    dom.audioPanel.inert = false;
  },
  hide() {
    dom.audioPanel.inert = true;
    dom.audioPanel.style.display = 'none';
  },
};
