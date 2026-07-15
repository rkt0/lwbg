import {cssFloat} from './utility.js';

export function displayMatte() {
  const matte = {};
  const sides = ['top', 'right', 'bottom', 'left'];
  for (const side of sides) {
    matte[side] = cssFloat(`--matte-${side}`, 'body');
  }
  return matte;
}
