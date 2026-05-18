import {qs, qsa, ce, cssInt} from './utility.js';

export const dice = {
  human: {
    movement: ['Jump', 2, 3, 3, 4, 4],
    continue: [0, 0, 0, 1, 1, 1],
  },
  raptor: {
    movement: ['Enter', 1, 1, 1, 1, 2],
    continue: [0, 0, 0, 1, 1, 1],
  },
  trex: {
    movement: [0, 0, 0, 1, 1, 1],
  },
};

// Make faces for human and raptor movement dice
for (const species of ['human', 'raptor']) {
  const die = qs(`.die-${species}.die-movement`);
  const values = [...new Set(dice[species].movement)];
  for (const value of values) {
    const face = ce('div');
    face.classList.add('face');
    face.dataset.roll = value;
    face.append(value);
    die.append(face);
  }
}

// Squeeze all faces and set display to none
const dieWidth = cssInt('--die-content-width');
async function initializeFace(face) {
  await document.fonts.ready;
  const copy = face.cloneNode(true);
  copy.classList.add('copy');
  document.body.append(copy);
  const {width} = copy.getBoundingClientRect();
  copy.remove();
  if (width <= dieWidth) return;
  const scale = dieWidth / width;
  const translate = dieWidth * (scale - 1) / 2;
  face.style.transform =
    `translateX(${translate}px) scaleX(${scale})`;
  face.style.display = 'none';
}
for (const face of qsa('.face')) initializeFace(face);
