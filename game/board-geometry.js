import {cssInt} from './utility.js';

export const geom = {

};

// Extra space at edges of board
const extraSpace = {
  left: null, top: null, bottom: null, right: null,
};
for (const side of Object.keys(extraSpace)) {
  extraSpace[side] = cssInt(`--extra-space-${side}`);
}
function addExtraSpace(arr, full) {
  for (const point of arr) {
    point[0] += extraSpace.left;
    point[1] += extraSpace.top;
    if (full) {
      point[0] += extraSpace.right;
      point[1] += extraSpace.bottom;
    }
  }
}
