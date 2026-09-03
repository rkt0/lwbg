import {
  qjs, closestData, camelFromKebab, cssValue,
} from './utility.js';
import {template} from './template.js';
import {dom} from './dom.js';
import {zoom} from './zoom.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {sfx} from './sfx.js';

export const toggle = {
  groupElement: qjs('toggle-button-group'),
  async showGroup() {
    this.groupElement.style.display = '';
    await anim.move(this.groupElement, {
      right: '0px',
    }, anim.time.buttonSlide, {easing: 'linear'});
    this.groupElement.inert = false;
  },
  async hideGroup() {
    this.groupElement.inert = true;
    await anim.move(this.groupElement, {
      right: `-${groupWidth}px`,
    }, anim.time.buttonSlide, {easing: 'linear'});
    this.groupElement.style.display = 'none';
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
    dispatch[closestData(e, 'toggle')]?.();
  },
};

// Dispatch table for click handler
const dispatch = {
  'audio': () => toggle.audio(),
  'fullscreen': () => toggle.fullscreen(),
  'tv-mode': () => toggle.tvMode(),
};

// Other values
const groupWidth = cssValue('--button-size', {
  element: toggle.groupElement,
});

// Required since user can change audio via controls
const audioElements = [music.element, sfx.element];
function handleVolumeChange() {
  for (const element of audioElements) {
    element.muted = this.muted;
    element.volume = this.volume;
    element.blur();
  }
  music.audioOn = !this.muted && this.volume > 0;
  music.reconcilePlayPauseState();
  for (const icon of icons.audio) {
    const isOnIcon = icon.dataset.stateIcon === 'on';
    const makeInactive = isOnIcon !== music.audioOn;
    icon.classList.toggle('inactive', makeInactive);
  }
}
for (const element of audioElements) {
  element.addEventListener(
    'volumechange', handleVolumeChange,
  );
}
music.element.addEventListener('play', function() {
  this.muted = false;
});
music.element.addEventListener('pause', function() {
  this.muted = true;
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
  const buttonClone = button.cloneNode(true);
  icons[camelFromKebab(value)] = [
    ...button.children, ...buttonClone.children,
  ];
  toggle.groupElement.append(button);
  dom.startOptions.append(buttonClone);
}

// Audio should be on by default
toggle.audio();

// Hide toggle button group
toggle.hideGroup();
