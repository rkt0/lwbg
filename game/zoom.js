import {qs, qsa, windowWH} from './utility.js';
import {dom} from './dom.js';
import {anim} from './animation.js';

export const zoom = {
  factor: {current: null, in: 2, outMax: 0.125},
  center: {},
  highlightBlinkIds: [],
  zoomOut() {
    const windowSize = windowWH();
    const factor = Math.max(
      windowSize[0] / this.boardSize[0],
      windowSize[1] / this.boardSize[1],
      this.factor.outMax
    );
    zoomGeneral(factor);
    buttonZoomOut.classList.add('current');
    for (const element of obstructiveElements) {
      element.classList.add('slim');
    }
    dom.gameOver.classList.add('inactive');
  },
  zoomDefault() {
    zoomGeneral(1);
    buttonZoomDefault.classList.add('current');
  },
  zoomIn() {
    zoomGeneral(this.factor.in);
    buttonZoomIn.classList.add('current');
  },
};

// Element references
const buttonZoomOut = qs('#zoom-out');
const buttonZoomDefault = qs('#zoom-default');
const buttonZoomIn = qs('#zoom-in');
const nonZoomElements = qsa('.non-zoom');
const obstructiveElements = qsa('.obstructive');
let allPieces, humanBoard;

// Needed for zoom button click handlers
function highlightPieces(setting) {
  const ids = zoom.highlightBlinkIds;
  allPieces ??= [
    ...dom.humanPiece,
    ...dom.raptorPiece,
    dom.trexPiece,
  ];
  if (setting) {
    for (const piece of allPieces) {
      piece.classList.add('highlighted');
    }
    const id = setInterval(() => {
      for (const element of qsa('.highlighted')) {
        element.classList.toggle('on');
      }
    }, anim.time.highlightBlink);
    ids.push(id);
  } else {
    for (const piece of allPieces) {
      piece.classList.remove('highlighted');
    }
    while (ids.length) clearInterval(ids.pop());
  }
}
function applyZoomCenter() {
  const {left: cl, top: ct} = zoom.center;
  const fc = zoom.factor.current;
  const [ww, wh] = windowWH();
  scroll(cl * fc - ww / 2, ct * fc - wh / 2);
}
function zoomGeneral(factor) {
  if (!zoom.factor.current) {
    zoom.factor.current = 1;
    applyZoomCenter();
    return;
  }
  if (zoom.factor.current === factor) return;
  if (zoom.factor.current >= 1) {
    const [ww, wh] = windowWH();
    const left = scrollX + ww / 2;
    const top = scrollY + wh / 2;
    zoom.center.left = left / zoom.factor.current;
    zoom.center.top = top / zoom.factor.current;
  }
  dom.gameplay.style.zoom = factor;
  zoom.factor.current = factor;
  applyZoomCenter();
  for (const element of nonZoomElements) {
    element.style.zoom = 1 / zoom.factor.current;
  }
  const isOut = factor < 1;
  highlightPieces(isOut);
  humanBoard ??= qsa('.human-space, .human-edge');
  for (const element of humanBoard) {
    element.classList.toggle('more-visible', isOut);
  }
  const currentButton = qs('.zoom-button.current');
  currentButton.classList.remove('current')
  for (const element of obstructiveElements) {
    element.classList.remove('slim');
  }
  dom.gameOver.classList.remove('inactive');
};
