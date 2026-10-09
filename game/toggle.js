import {
  qjs, qda, closestData, camelFromKebab,
} from './utility.js';
import {template} from './template.js';
import {dom} from './dom.js';
import {anim} from './animation.js';
import {music} from './music.js';
import './audio-controls.js';
import {zoom} from './zoom.js';
import {sfx} from './sfx.js';

export const toggle = {
  groupElement: qjs('toggle-button-group'),
  async showGroup() {
    const {groupElement} = this;
    await anim.slide(groupElement, 'right', 1, aTime);
    groupElement.inert = false;
  },
  async hideGroup() {
    const {groupElement} = this;
    groupElement.inert = true;
    await anim.slide(groupElement, 'right', 0, aTime);
  },
  audio() {
    music.element.muted = !music.element.muted;
    // Also see volumechange event listener
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
    document.body.classList.toggle('tv-mode')
    if (isOutNow) zoom.zoomOut();
    else zoom.applyCenter();
    for (const icon of icons.tvMode) {
      icon.classList.toggle('inactive');
    }
  },
  handleClick(e) {
    dispatch[closestData(e, 'toggle')]?.();
  },
};

// Dispatch table for click handler
const dispatch = {
  'audio': () => toggle.audio(),
  'fullscreen': () => toggle.fullscreen(),
  'tv-mode': () => toggle.tvMode(),
};

// Animation time for button slide
const aTime = anim.time.buttonSlide;

// Maintain audio status in consistent state
music.element.addEventListener('volumechange', () => {
  if (!sfx.temporary) {
    sfx.element.muted = music.element.muted;
  }
  music.audioOn = !music.element.muted;
  music.reconcilePlayPauseState();
  for (const icon of icons.audio) {
    const isOnIcon = icon.dataset.stateIcon === 'on';
    const makeInactive = isOnIcon !== music.audioOn;
    icon.classList.toggle('inactive', makeInactive);
  }
});
music.element.addEventListener('play', () => {
  music.element.muted = false;
});
music.element.addEventListener('pause', () => {
  music.element.muted = true;
});

// Required since user can leave fullscreen via Escape
document.addEventListener('fullscreenchange', () => {
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
const sites = [toggle.groupElement, dom.startOptions];
for (const item of template('toggle-button-group')) {
  const button = template('toggle-button');
  const {value} = item;
  button.dataset.toggle = value;
  button.title = `Toggle ${item.textContent}`;
  for (const svg of button.children) {
    const use = svg.firstElementChild;
    const urlPartial = use.getAttribute('href');
    const which = urlPartial.split('-').at(-1);
    const url = urlPartial.replace('#', `#${value}`);
    use.setAttribute('href', url);
    svg.dataset.stateIcon = which;
  }
  button.classList.add('small');
  const buttons = [button];
  const buttonIcons = [];
  const buttonSites = [...sites];
  if (value === 'audio') {
    buttonSites.push(...qda('audio-controls'));
  }
  for (const site of buttonSites) {
    const b = buttons.pop() ?? button.cloneNode(true);
    buttonIcons.push(...b.children);
    site.append(b);
  }
  icons[camelFromKebab(value)] = buttonIcons;
}

// Audio should be on by default
toggle.audio();

// Hide toggle button group
toggle.hideGroup();
