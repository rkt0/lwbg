import {qs} from "./utility.js";
import {debug} from "./debug.js";

export const anim = {
  // Base time in milliseconds
  baseTime: 300 / (debug.animationSpeed || 1),
  // Animation times in multiples of baseTime
  multiplier: {
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
    pauseMidMove: 0.25,
    autoScroll: 2,
    autoScrollDelay: 1,
    highlightBlink: 1,
  },
  trexScreenBounce: {
    maxDistance: 64,
    decayRate: 0.5,
    timePerBounce: 4 * 1000 / 60,
  },
  async fade(x, to, duration, options) {
    const element = typeof x === 'object' ? x : qs(x);
    const {
      display = 'block', easing = 'linear',
    } = options ?? {};
    if (to) element.style.display = display;
    await element.animate({
      opacity: [1 - to, to], easing,
    }, {duration, fill: 'forwards'}).finished;
    if (!to) element.style.display = 'none';
  },
  async move(x, location, duration, options) {
    const element = typeof x === 'object' ? x : qs(x);
    const {
      endDelay = 0, easing = 'ease-in-out',
    } = options ?? {};
    await element.animate({...location, easing}, {
      duration, endDelay, fill: 'forwards',
    }).finished;
  },
  async slide(x, to, duration, options) {
    const element = typeof x === 'object' ? x : qs(x);
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
  isAnimated(x) {
    const element = typeof x === 'object' ? x : qs(x);
    const animations = element.getAnimations();
    return animations.some((animation) => {
      return animation.playState === 'running';
    });
  },
  async bounce(x, settings) {
    const element = typeof x === 'object' ? x : qs(x);
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
anim.time = Object.fromEntries(
  Object.entries(anim.multiplier).map(
    (x) => [x[0], x[1] * anim.baseTime],
  ),
);

const html = document.documentElement;
const toCss = {
  dieRoll: '--die-roll-time',
  dieResultDelay: '--die-roll-delay',
};
for (const [key, cssProp] of Object.entries(toCss)) {
  const seconds = anim.time[key] / 1000;
  html.style.setProperty(cssProp, `${seconds}s`);
}
