import {
  qjs, closestData, ael, fromTemplate, camelFromKebab,
} from './utility.js';
import {dom} from './dom.js';
import {zoom} from './zoom.js';
import {music} from './music.js';

export const toggle = {
  areaElement: qjs('toggle-button-area'),
  audio() {
    music.toggle();
    for (const icon of icons.audio) {
      icon.classList.toggle('inactive');
    }
  },
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
    if (what === 'audio') this.audio();
    else if (what === 'fullscreen') this.fullscreen();
    else if (what === 'tv-mode') this.tvMode();
  },
};

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

// Initialize buttons
const icons = {};
const itemGroup = fromTemplate('toggle-button-group');
for (const item of itemGroup.children) {
  const button = fromTemplate('toggle-button', true);
  const {value} = item;
  button.dataset.toggle = value;
  button.title = `Toggle ${item.textContent}`;
  for (const svg of button.children) {
    svg.dataset[camelFromKebab(`icon-${value}`)] = '';
    const use = svg.firstElementChild;
    const urlPartial = use.getAttribute('href');
    const url = urlPartial.replace('#', `#${value}`);
    use.setAttribute('href', url);
  }
  button.classList.add('small');
  const buttonClone = button.cloneNode(true);
  icons[camelFromKebab(value)] = [
    ...button.children, ...buttonClone.children,
  ];
  toggle.areaElement.append(button);
  dom.startOptions.append(buttonClone);
}

// Audio should be on by default
toggle.audio();
