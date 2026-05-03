import {
  qs, qsa, ce, sequence, shuffle,
} from './utility.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';
import {bd} from './logic.js';

export const pieces = {
  human: {
    feature: {
      shoes: sequence(bd.nHumanPieces),
      pants: sequence(bd.nHumanPieces),
      skin: sequence(bd.nHumanPieces),
      shirt: sequence(bd.nHumanPieces),
      hat: sequence(bd.nHumanPieces),
      under: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
    },
    shadow: {
      hat: [
        'bc', 'bc', 'bc', 'bc', 'bc', 'bc',
        'cb', 'cb', 'cb', 'cb', 'cb', 'cb',
      ],
    },
  },
  raptor: {
    feature: {
      shape: sequence(bd.nRaptorPieces),
      color: sequence(bd.nRaptorPieces),
    },
  },
  removeImgs() {
    const toRemove = [
      '.human-component:not(.dead-marker)',
      '.raptor-component', '.trex-component',
    ];
    for (const element of qsa(toRemove.join(', '))) {
      element.remove();
    }
  },
  addHumanFeatureImg(piece, item, id) {
    const img = ce('img');
    img.src = `img/human/${item}/${item}-${id}.png`;
    img.classList.add('human-component', item);
    qs(`#human-piece-${piece}`).append(img);
  },
  addHumanShadowImg(piece, item) {
    const img = ce('img');
    img.src = `img/human/shadow/shadow-${item}.png`;
    img.classList.add('human-component', 'shadow');
    qs(`#human-piece-${piece}`).append(img);
  },
  addHumanImgs() {
    const {feature, shadow} = pieces.human;
    const entriesFeature = Object.entries(feature);
    for (const [item, idArray] of entriesFeature) {
      for (const [piece, id] of idArray.entries()) {
        pieces.addHumanFeatureImg(piece, item, id);
        let itemShadow = item;
        if (shadow[item]) {
          itemShadow += `_${shadow[item][id]}`;
        }
        pieces.addHumanShadowImg(piece, itemShadow);
      }
    }
  },
  addRaptorBaseImg(piece, id) {
    const img = ce('img');
    img.src = `img/raptor/raptor-${id}.png`;
    img.classList.add('raptor-component', 'base');
    qs(`#raptor-piece-${piece}`).append(img);
  },
  addRaptorShadowImg(piece, id) {
    const img = ce('img');
    img.src = `img/raptor/shadow-raptor-${id}.png`;
    img.classList.add('raptor-component', 'shadow');
    qs(`#raptor-piece-${piece}`).append(img);
  },
  addRaptorImgs() {
    const {shape, color} = pieces.raptor.feature;
    for (let [piece, idShape] of shape.entries()) {
      let idColor = color[piece];
      if (debug.raptorPlacement.on) {
        idShape = debug.raptorPlacement.shape;
        idColor = debug.raptorPlacement.color;
      }
      const id = `${idShape}-${idColor}`;
      pieces.addRaptorBaseImg(piece, id);
      pieces.addRaptorShadowImg(piece, idShape);
    }
  },
  addTrexBaseImg() {
    const img = ce('img');
    img.src = 'img/trex/trex.png';
    img.classList.add('trex-component', 'base');
    qs('#trex-piece').append(img);
  },
  addTrexShadowImg() {
    const img = ce('img');
    img.src = 'img/trex/shadow-trex.png';
    img.classList.add('trex-component', 'shadow');
    qs('#trex-piece').append(img);
  },
  addTrexImgs() {
    pieces.addTrexBaseImg();
    pieces.addTrexShadowImg();
  },
  addImgs() {
    pieces.addHumanImgs();
    pieces.addRaptorImgs();
    pieces.addTrexImgs();
  },
  shuffleFeatures() {
    const hf = pieces.human.feature;
    for (const a of Object.keys(hf)) {
      hf[a] = shuffle(hf[a], prng.pieces);
    }
    const rf = pieces.raptor.feature;
    for (const a of Object.keys(rf)) {
      rf[a] = shuffle(rf[a], prng.pieces);
    }
  },
};
