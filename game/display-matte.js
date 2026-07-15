import {windowWH, cssFloat} from './utility.js';

export function displayMatte() {
  const matte = {};
  const sides = ['top', 'right', 'bottom', 'left'];
  for (const side of sides) {
    matte[side] = cssFloat(`--matte-${side}`, 'body');
  }
  return matte;
}
export function windowWHMatted() {
  const [ww, wh] = windowWH();
  const dm = displayMatte();
  return [
    ww - dm.left - dm.right, wh - dm.top - dm.bottom,
  ];
}
