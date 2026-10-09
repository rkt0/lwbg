import {dom} from './dom.js';
import {debug} from './debug.js';

export const anim = {
  time: {},
  async fade(element, to, duration) {
    if (to) element.style.display = '';
    const keyframes = {opacity: [1 - to, to]};
    const options = {duration, easing: 'linear'};
    const final = {opacity: to};
    await persist(element, keyframes, options, final);
    if (!to) element.style.display = 'none';
  },
  async move(element, where, duration) {
    const options = {duration, easing: 'ease-in-out'};
    await persist(element, where, options, where);
  },
  async slide(element, side, to, duration) {
    const off = {
      left: '-100% 0', right: '100% 0',
      top: '0 -100%', bottom: '0 100%',
    }[side];
    const xf = [off, '0 0'];
    if (to) element.style.display = '';
    else xf.reverse();
    const keyframes = {translate: xf};
    const options = {duration, easing: 'linear'};
    const final = {translate: xf.at(-1)};
    await persist(element, keyframes, options, final);
    if (!to) element.style.display = 'none';
  },
  isAnimated(element) {
    const animations = element.getAnimations();
    return animations.some((animation) => {
      return animation.playState === 'running';
    });
  },
  cancelAll(element) {
    const animations = element.getAnimations();
    for (const a of animations) a.cancel();
  },
  async bounce(element = dom.gameplay, {
    maxDistance = 64,
    decayRate = 0.5,
    timePerBounce = 4 * 1000 / 60,
  } = {}) {
    const distances = [0];
    let d = maxDistance;
    let duration = 0;
    while (d >= 1) {
      const halfway = d * Math.SQRT1_2;
      distances.push(halfway, d, halfway, 0);
      d *= decayRate;
      duration += timePerBounce;
    }
    const top = distances.map((d) => `-${d}px`);
    await element.animate({top}, {duration}).finished;
  },
  async roll(element, duration, {
    turns = 2, easing = 'ease',
  } = {}) {
    await element.animate({
      rotate: `${turns}turn`,
    }, {duration, easing, fill: 'forwards'}).finished;
  },
  blinkPieces(on) {
    blinkPieceElements ??= [
      ...dom.humanPiece,
      ...dom.raptorPiece,
      dom.trexPiece,
    ];
    for (const element of blinkPieceElements) {
      setBlinkAnimation(element, on);
    }
  },
};

// Animation times
const baseTime = 300 / (debug.animationSpeed || 1);
const multiplier = {
  menuFade: 1,
  buttonSlide: 0.5,
  turnFade: 1,
  messageSlide: 1,
  gameOverDelay: 6,
  editControlFade: 0.5,
  dieDelay: 1,
  dieSpin: 3,
  faceDelay: 1.5,
  moveHuman: 1,
  moveRaptor: 1.5,
  moveTrex: 1,
  adjustHuman: 1,
  jumpHuman: 2,
  killHuman: 6,
  killHumanDelay: 3,
  pauseMidMove: 0.25,
  autoScroll: 2,
  autoScrollDelay: 1,
  highlightBlink: 2,
};
for (const [key, m] of Object.entries(multiplier)) {
  anim.time[key] = m * baseTime;
}

// Helper function to animate, persist, and cancel
async function persist(
  element, keyframes, options, final = {},
) {
  const opts = {...options, fill: 'forwards'};
  const animation = element.animate(keyframes, opts);
  await animation.finished;
  try {
    animation.commitStyles();
  } catch {
    const entries = Object.entries(final);
    for (const [property, value] of entries) {
      element.style[property] = value;
    }
  } finally {
    animation.cancel();
  }
}

// Blink animation references
const blinks = new Map();
let blinkPieceElements;

// Blink animation for single element
function makeBlinkAnimation(element) {
  const keyframes = {backgroundColor: [
    'var(--color-highlight)', 'transparent',
  ]};
  const options = {
    duration: anim.time.highlightBlink,
    iterations: Infinity,
    easing: 'steps(2, jump-none)',
  };
  return element.animate(keyframes, options);
}
function setBlinkAnimation(element, on) {
  if (!on) return blinks.get(element)?.cancel();
  const animation = blinks.getOrInsertComputed(
    element, makeBlinkAnimation,
  );
  animation.play();
}
