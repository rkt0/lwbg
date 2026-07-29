import {qda, closestData, ael} from './utility.js';
import {music} from './music.js';
import {zoom} from './zoom.js';

export const toggle = {
  fullscreen() {
    if (!zoom.isZoomedOut()) zoom.setCenter();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else document.exitFullscreen();
    // Also see fullscreenchange event listener
  },
  tvMode() {
    const isOutNow = zoom.isZoomedOut();
    if (!isOutNow) zoom.setCenter();
    if (document.body.classList.contains('tv-mode')) {
      // Adjust center before removing matte
      zoom.adjustCenterForMatte(-1);
      document.body.classList.remove('tv-mode');
    } else {
      // Adjust center after adding matte
      document.body.classList.add('tv-mode');
      zoom.adjustCenterForMatte(1);
    }
    if (isOutNow) zoom.zoomOut();
    else zoom.applyCenter();
    for (const icon of icons.tvMode) {
      icon.classList.toggle('inactive');
    }
  },
  handleClick(e) {
    const what = closestData(e, 'toggle');
    if (what === 'audio') music.toggle();
    else if (what === 'fullscreen') this.fullscreen();
    else if (what === 'tv-mode') this.tvMode();
  },
};

// Element references
const icons = {
  fullscreen: qda('icon-fullscreen'),
  tvMode: qda('icon-tv-mode'),
};

// Gameplay toggle button area click handler
ael(qjs('toggle-button-area'), 'mousedown', (e) => {
  toggle.handleClick(e);
});

// Required since user can leave fullscreen via Escape
ael(document, 'fullscreenchange', () => {
  if (zoom.isZoomedOut()) zoom.zoomOut();
  else zoom.applyCenter();
  for (const icon of icons.fullscreen) {
    icon.classList.toggle('inactive');
  }
  if (document.fullscreenElement) {
    navigator.keyboard.lock(['Escape']);
  } else navigator.keyboard.unlock();
});
