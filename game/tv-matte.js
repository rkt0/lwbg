import {
  windowSize, numericStyles,
} from './utility.js';

export const tvMatte = {
  current() {
    const isTv = body.classList.contains('tv-mode');
    return isTv ? matte.nonzero : matte.zero;
  },
  windowSizeMatted() {
    const [ww, wh] = windowSize();
    const matte = this.current();
    return [
      ww - matte.left - matte.right,
      wh - matte.top - matte.bottom,
    ];
  },
};

const {body} = document;
const sides = ['top', 'right', 'bottom', 'left'];
const matte = {
  zero: Object.fromEntries(sides.map(s => [s, 0])),
  get nonzero() {
    delete this.nonzero;
    this.nonzero = {};
    const properties = sides.map(s => `--matte-${s}`);
    const styles = numericStyles(body, properties);
    for (const [i, side] of sides.entries()) {
      this.nonzero[side] = styles[properties[i]];
    }
    return this.nonzero;
  },
};
