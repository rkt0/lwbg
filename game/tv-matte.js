import {windowWH, cssValueSides} from './utility.js';

export const tvMatte = {
  current() {
    return cssValueSides('--matte', {
      element: document.body, float: true,
    })
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
