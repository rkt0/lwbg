import {
  qs, qsa, ce, fromTemplate, sequence, shuffle,
} from './utility.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';
import {bd} from './board-topology.js';

const {nHumanPieces, raptorStart} = bd;
const nRaptorPieces = raptorStart.length;

export const pieces = {
  human: {
    feature: {
      shoes: sequence(nHumanPieces),
      pants: sequence(nHumanPieces),
      skin: sequence(nHumanPieces),
      shirt: sequence(nHumanPieces),
      hat: sequence(nHumanPieces),
      under: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
    },
  },
  raptor: {
    feature: {
      shape: sequence(nRaptorPieces),
      color: sequence(nRaptorPieces),
    },
  },
  shuffleFeatures() {
    const hf = this.human.feature;
    for (const a of Object.keys(hf)) {
      hf[a] = shuffle(hf[a], prng.pieces);
    }
    const rf = this.raptor.feature;
    for (const a of Object.keys(rf)) {
      rf[a] = shuffle(rf[a], prng.pieces);
    }
  },
  addImgs() {
    const toRemove = [
      '.human-component:not(.dead-marker)',
      '.raptor-component', '.trex-component',
    ];
    for (const element of qsa(toRemove.join(', '))) {
      element.remove();
    }
    addHumanImgs();
    addRaptorImgs();
    addTrexImgs();
  },
  makeAll() {
    for (let p = 0; p < nHumanPieces; p++) {
      makeHumanPiece(p);
    }
    for (let p = 0; p < nRaptorPieces; p++) {
      makeRaptorPiece(p);
    }
    this.shuffleFeatures();
    this.addImgs();
  },
};

const hatShadow = [
  'bc', 'bc', 'bc', 'bc', 'bc', 'bc',
  'cb', 'cb', 'cb', 'cb', 'cb', 'cb',
];
const gameplayContainer = qs('#gameplay-container');

function addHumanImgs() {
  const {feature} = pieces.human;
  for (const [f, ids] of Object.entries(feature)) {
    for (const [piece, id] of ids.entries()) {
      const imgB = ce('img');
      imgB.src = `img/human/${f}/${f}-${id}.png`;
      imgB.classList.add('human-component', f);
      const imgS = ce('img');
      imgS.src = `img/human/shadow/shadow-${f}${
        f === 'hat' ? `_${hatShadow[id]}` : ''
      }.png`;
      imgS.classList.add('human-component', 'shadow');
      qs(`#human-piece-${piece}`).append(imgB, imgS);
    }
  }
}
function addRaptorImgs() {
  const {shape, color} = pieces.raptor.feature;
  for (let [piece, idS] of shape.entries()) {
    let idC = color[piece];
    if (debug.raptorPlacement.on) {
      idS = debug.raptorPlacement.shape;
      idC = debug.raptorPlacement.color;
    }
    const imgB = ce('img');
    imgB.src = `img/raptor/raptor-${idS}-${idC}.png`;
    imgB.classList.add('raptor-component', 'base');
    const imgS = ce('img');
    imgS.src = `img/raptor/shadow-raptor-${idS}.png`;
    imgS.classList.add('raptor-component', 'shadow');
    qs(`#raptor-piece-${piece}`).append(imgB, imgS);
  }
}
function addTrexImgs() {
  const imgB = ce('img');
  imgB.src = 'img/trex/trex.png';
  imgB.classList.add('trex-component', 'base');
  const imgS = ce('img');
  imgS.src = 'img/trex/shadow-trex.png';
  imgS.classList.add('trex-component', 'shadow');
  qs('#trex-piece').append(imgB, imgS);
}

function makeHumanPiece(piece) {
  const element = fromTemplate('human-piece', true);
  element.id = `human-piece-${piece}`;
  gameplayContainer.append(element);
}
function makeRaptorPiece(piece) {
  const element = fromTemplate('raptor-piece', true);
  element.id = `raptor-piece-${piece}`;
  gameplayContainer.append(element);
}
