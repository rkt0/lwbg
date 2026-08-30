import {debug} from "./debug.js";

export const anim = {
  time: {},
  trexScreenBounce: {
    maxDistance: 64,
    decayRate: 0.5,
    timePerBounce: 4 * 1000 / 60,
  },
  dieSpinCount: 2,
  async fade(element, to, duration, {
    display = 'block', easing = 'linear',
  } = {}) {
    if (to) element.style.display = display;
    const keyframes = {opacity: [1 - to, to], easing};
    const options = {duration};
    const final = {opacity: to};
    await persist(element, keyframes, options, final);
    if (!to) element.style.display = 'none';
  },
  async move(element, location, duration, {
    delay = 0, endDelay = 0, easing = 'ease-in-out',
  } = {}) {
    const keyframes = {...location, easing};
    const options = {duration, delay, endDelay};
    const final = {...location};
    await persist(element, keyframes, options, final);
  },
  async slide(element, to, duration, {
    display = '', easing = 'linear',
  } = {}) {
    const xf = ['translateY(-100%)', 'translateY(0)'];
    if (to) element.style.display = display;
    else xf.reverse();
    const keyframes = {transform: xf, easing};
    const options = {duration};
    const final = {transform: xf.at(-1)};
    await persist(element, keyframes, options, final);
    if (!to) element.style.display = 'none';
  },
  isAnimated(element, options = {}) {
    const animations = element.getAnimations(options);
    return animations.some((animation) => {
      return animation.playState === 'running';
    });
  },
  cancelAll(element, options = {}) {
    const animations = element.getAnimations(options);
    for (const a of animations) a.cancel();
  },
  async bounce(element, {
    maxDistance, decayRate, timePerBounce,
  }) {
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
  async roll(element, turns, duration, {
    easing = 'ease',
  } = {}) {
    await element.animate({
      transform: `rotate(${turns}turn)`,
    }, {duration, easing, fill: "forwards"}).finished;
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

// Add style properties
const html = document.documentElement;
const toCss = {
  highlightBlink: '--highlight-blink-time',
};
for (const [key, cssProp] of Object.entries(toCss)) {
  const seconds = anim.time[key] / 1000;
  html.style.setProperty(cssProp, `${seconds}s`);
}
