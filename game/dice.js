import {qjs, qda, cssValue} from './utility.js';
import {template} from './template.js';
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

// Initialize dice
function makeFace(value, text) {
  const face = template('face');
  face.dataset.roll = value;
  face.append(text ?? value);
  return face;
}
for (const [species, sObj] of Object.entries(dice)) {
  for (const [type, values] of Object.entries(sObj)) {
    const name = `${species}-${type}`;
    const die = template('die');
    die.dataset.js = `die-${name}`;
    die.classList.add(`die-${species}`);
    const facesTemplate =
      template(`die-${species}-faces`) ??
      template(`die-${type}-faces`);
    if (facesTemplate) {
      const items = facesTemplate;
      die.append(...items.map(item => makeFace(
        item.value, item.textContent,
      )));
    } else {
      const unique = [...new Set(values)];
      die.append(...unique.map(u => makeFace(u)));
    }
    dom.dice[name] = die;
    dom.faces[name] = {};
    for (const face of die.children) {
      dom.faces[name][face.dataset.roll] = face;
    }
  }
}
const rollDisplay = qjs('roll-display');
rollDisplay.append(...Object.values(dom.dice));

// Squeeze all faces and set display to none
const dieWidth = cssValue('--die-content-width');
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
