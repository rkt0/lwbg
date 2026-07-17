import {qda, closestData} from './utility.js';
import {music} from './music.js';
import {zoom} from './zoom.js';

export const toggle = {
  async fullscreen() {
    const isOutNow = (zoom.factor.current ?? 1) < 1;
    if (!isOutNow) zoom.setCenter();
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      await element?.requestFullscreen();
    } else await document.exitFullscreen();
    if (isOutNow) zoom.zoomOut();
    else zoom.applyCenter();
    for (const icon of icons.fullscreen) {
      icon.classList.toggle('inactive');
    }
  },
  tvMode() {
    const isOutNow = (zoom.factor.current ?? 1) < 1;
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
