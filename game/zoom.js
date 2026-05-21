import {qs, qsa, windowWH} from './utility.js';
import {anim} from './animation.js';
import {zd} from './game-objects.js';

export const zoom = {
  zoomOut() {
    const w = windowWH();
    const factor = Math.max(
      w[0] / zd.boardSize[0], w[1] / zd.boardSize[1],
      zd.factor.outMax
    );
    zoomGeneral(factor);
    buttonZoomOut.classList.add('current');
    for (const element of obstructiveElements) {
      element.classList.add('slim');
    }
    gameOverElement.classList.add('inactive');
  },
  zoomDefault() {
    zoomGeneral(1);
    buttonZoomDefault.classList.add('current');
  },
  zoomIn() {
    zoomGeneral(zd.factor.in);
    buttonZoomIn.classList.add('current');
  },
};

// Element references
const buttonZoomOut = qs('#zoom-out');
const buttonZoomDefault = qs('#zoom-default');
const buttonZoomIn = qs('#zoom-in');
const allPieces = qsa(
  '.raptor-piece, .human-piece, .trex-piece'
);
const container = qs('#gameplay-container');
const nonZoomElements = qsa('.non-zoom');
const humanBoard = qsa('.human-space, .human-edge');
const obstructiveElements = qsa('.obstructive');
const gameOverElement = qs('#game-over');

// Needed for zoom button click handlers
function highlightPieces(setting) {
  const ids = zd.highlightBlinkIds;
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
  const {left: cl, top: ct} = zd.center;
  const fc = zd.factor.current;
  const [ww, wh] = windowWH();
  scroll(cl * fc - ww / 2, ct * fc - wh / 2);
}
function zoomGeneral(factor) {
  if (!zd.factor.current) {
    zd.factor.current = 1;
    applyZoomCenter();
    return;
  }
  if (zd.factor.current === factor) return;
  if (zd.factor.current >= 1) {
    const [ww, wh] = windowWH();
    const left = scrollX + ww / 2;
    const top = scrollY + wh / 2;
    zd.center.left = left / zd.factor.current;
    zd.center.top = top / zd.factor.current;
  }
  container.style.zoom = factor;
  zd.factor.current = factor;
  applyZoomCenter();
  for (const element of nonZoomElements) {
    element.style.zoom = 1 / zd.factor.current;
  }
  const isOut = factor < 1;
  highlightPieces(isOut);
  for (const element of humanBoard) {
    element.classList.toggle('more-visible', isOut);
  }
  const currentButton = qs('.zoom-button.current');
  currentButton.classList.remove('current')
  for (const element of obstructiveElements) {
    element.classList.remove('slim');
  }
  gameOverElement.classList.remove('inactive');
};
