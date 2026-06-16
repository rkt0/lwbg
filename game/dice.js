import {qjs, qda, ce, cssInt} from './utility.js';
import {dom} from './dom.js';

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

// Add existing element references to dom object
for (const [species, sObj] of Object.entries(dice)) {
  for (const type of Object.keys(sObj)) {
    const name = `${species}-${type}`;
    dom.dice[name] = qjs(`die-${name}`);
    dom.faces[name] = {};
    for (const face of qda('roll', dom.dice[name])) {
      dom.faces[name][face.dataset.roll] = face;
    }
  }
}

// Make faces for human and raptor movement dice
for (const species of Object.keys(dice)) {
  if (species === 'trex') continue;
  const name = `${species}-movement`;
  const dieElement = dom.dice[name];
  const values = [...new Set(dice[species].movement)];
  for (const value of values) {
    const face = ce('div');
    face.classList.add('face');
    face.dataset.roll = value;
    face.append(value);
    dieElement.append(face);
    dom.faces[name][value] = face;
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
for (const face of qda('roll')) initializeFace(face);
