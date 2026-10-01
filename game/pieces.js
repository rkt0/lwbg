import {
  qd, sequence, shuffle, sizeFromStyle, cssValue,
} from './utility.js';
import {template} from './template.js';
import {prng} from './prngs.js';
import {pl} from './game-objects.js';
import {bd} from './board-topology.js';
import {dom} from './dom.js';
import {debug} from './debug.js';

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
    for (const element of dom.variableImages) {
      element.remove();
    }
    dom.variableImages = [];
    addHumanImgs();
    addRaptorImgs();
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
    adjustPieceLocationCoordinates();
  },
};

const hatShadow = [
  'bc', 'bc', 'bc', 'bc', 'bc', 'bc',
  'cb', 'cb', 'cb', 'cb', 'cb', 'cb',
];

function addHumanImgs() {
  const {feature} = pieces.human;
  for (const [f, ids] of Object.entries(feature)) {
    for (const [piece, id] of ids.entries()) {
      const imgB = document.createElement('img');
      imgB.src = `img/human/${f}/${f}-${id}.png`;
      const imgS = document.createElement('img');
      imgS.src = `img/human/shadow/shadow-${f}${
        f === 'hat' ? `_${hatShadow[id]}` : ''
      }.png`;
      imgS.classList.add('shadow');
      dom.humanPiece[piece].append(imgB, imgS);
      dom.variableImages.push(imgB, imgS);
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
    const imgB = document.createElement('img');
    imgB.src = `img/raptor/raptor-${idS}-${idC}.png`;
    const imgS = document.createElement('img');
    imgS.src = `img/raptor/shadow-raptor-${idS}.png`;
    imgS.classList.add('shadow');
    dom.raptorPiece[piece].append(imgB, imgS);
    dom.variableImages.push(imgB, imgS);
  }
}

function makeHumanPiece(p) {
  const element = template('human-piece');
  element.dataset.humanPiece = p;
  dom.gameplay.append(element);
  dom.humanPiece.push(element);
  const killButton = qd('kill', element);
  killButton.dataset.kill = p;
  dom.editKill.push(killButton);
}
function makeRaptorPiece(p) {
  const element = template('raptor-piece');
  element.dataset.raptorPiece = p;
  dom.gameplay.append(element);
  dom.raptorPiece.push(element);
}

function adjustPieceLocationCoordinates() {
  for (const species of Object.keys(pl)) {
    const [element] = [dom[`${species}Piece`]].flat();
    const size = sizeFromStyle(element);
    for (const [i, point] of pl[species].entries()) {
      point[1] -= size[1] / 2;
      if (species === 'trex' && i) continue;
      point[0] -= size[0] / 2;
    }
    pl[species].ps = size;
  }
  pl.human.margin = cssValue('--board-border-width');
}
