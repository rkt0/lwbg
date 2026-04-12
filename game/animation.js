'use strict';

let anim;
anim = await loadConfig('animation.json');
anim.baseTime /= (debug.animationSpeed || 1);
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
