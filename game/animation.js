import {qs} from "./utility.js";
import {debug} from "./debug.js";

export const anim = {
  // Base time in milliseconds
  baseTime: 309 / (debug.animationSpeed || 1),
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
    trexScreenBounce: 1,
    highlightBlink: 1,
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
