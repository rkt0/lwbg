import {windowWH, cssFloat} from './utility.js';

export const tvMatte = {
  current() {
    const matte = {};
    const sides = ['top', 'right', 'bottom', 'left'];
    for (const side of sides) {
      const prop = `--matte-${side}`;
      matte[side] = cssFloat(prop, 'body');
    }
    return matte;
  },
  windowWHMatted() {
    const [ww, wh] = windowWH();
    const matte = this.current();
    return [
      ww - matte.left - matte.right,
      wh - matte.top - matte.bottom,
    ];
  },
};
