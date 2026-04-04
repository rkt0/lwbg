'use strict';

// Container object for everything animation-related
const anim = {};

// Base time in milliseconds
anim.baseTime = 309 / (debug.animationSpeed || 1);

// Animation times in multiples of baseTime
anim.multiplier = {
  menuFade:         1,
  buttonSlide:      0.5,
  turnFade:         1,
  messageSlide:     1,
  gameOverDelay:    6,
  editControlFade:  0.5,
  dieRollDelay:     1,
  dieRoll:          3,
  dieResultDelay:   1.5,
  moveHuman:        1,
  moveRaptor:       1.5,
  moveTrex:         1,
  adjustHuman:      1,
  jumpHuman:        2,
  killHuman:        6,
  autoScroll:       2,
  autoScrollDelay:  1,
  trexScreenBounce: 1,
  highlightBlink:   1,
}
anim.time = Object.fromEntries(
  Object.entries(anim.multiplier).map(
    x => [x[0], x[1] * anim.baseTime]
  )
);

// Create CSS variables for settings related to dice
{
  const dieSpinCount = 2;
  const timeInS = x => `${anim.time[x] / 1000}s`;
  $(':root').css({
    '--die-spin-count': `${dieSpinCount}turn`,
    '--die-roll-time': timeInS('dieRoll'),
    '--die-roll-delay': timeInS('dieResultDelay'),
  });
}
