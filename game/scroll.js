import {smoothStep, lerp} from './utility.js';

export function scrollBetter(
  location, duration, options,
) {
  const start = [scrollX, scrollY];
  const final = [location.left, location.top];
  const {easing = smoothStep} = options ?? {};
  let initialTime;
  return new Promise((resolve) => {
    function step(timestamp) {
      initialTime ??= timestamp;
      const elapsedTime = timestamp - initialTime;
      const progress = duration > 0 ?
        easing(elapsedTime / duration) : 1;
      scroll(...lerp(start, final, progress));
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}
