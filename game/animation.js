import {debug} from "./debug.js";

export const anim = {
  time: {},
  trexScreenBounce: {
    maxDistance: 64,
    decayRate: 0.5,
    timePerBounce: 4 * 1000 / 60,
  },
  async fade(element, to, duration, options) {
    const {
      display = 'block', easing = 'linear',
    } = options ?? {};
    if (to) element.style.display = display;
    await element.animate({
      opacity: [1 - to, to], easing,
    }, {duration, fill: 'forwards'}).finished;
    if (!to) element.style.display = 'none';
  },
  async move(element, location, duration, options) {
    const {
      delay = 0, endDelay = 0, easing = 'ease-in-out',
    } = options ?? {};
    await element.animate({...location, easing}, {
      duration, delay, endDelay, fill: 'forwards',
    }).finished;
  },
  async slide(element, to, duration, options) {
    const {
      display = '', easing = 'linear',
    } = options ?? {};
    const xf = ['translateY(-100%)', 'translateY(0)'];
    if (to) element.style.display = display;
    else xf.reverse();
    await element.animate({
      transform: xf, easing,
    }, {duration, fill: 'forwards'}).finished;
    if (!to) element.style.display = 'none';
  },
  isAnimated(element) {
    const animations = element.getAnimations();
    return animations.some((animation) => {
      return animation.playState === 'running';
    });
  },
  async bounce(element, settings) {
    const {
      maxDistance, decayRate, timePerBounce,
    } = settings;
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
};

const baseTime = 300 / (debug.animationSpeed || 1);
const multiplier = {
  menuFade: 1,
  buttonSlide: 0.5,
  turnFade: 1,
  messageSlide: 1,
  gameOverDelay: 6,
  editControlFade: 0.5,
  dieRollDelay: 1,
  dieRoll: 3,
  dieResultDelay: 1.5,
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

const html = document.documentElement;
const toCss = {
  dieRoll: '--die-roll-time',
  dieResultDelay: '--die-roll-delay',
  highlightBlink: '--highlight-blink-time',
};
for (const [key, cssProp] of Object.entries(toCss)) {
  const seconds = anim.time[key] / 1000;
  html.style.setProperty(cssProp, `${seconds}s`);
}
