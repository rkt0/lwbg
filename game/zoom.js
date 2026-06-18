import {qjs, qda, windowWH} from './utility.js';
import {dom} from './dom.js';

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
    buttons.zoomOut.classList.add('current');
    for (const element of obstructiveElements) {
      element.classList.add('slim');
    }
    dom.gameOver.classList.add('inactive');
  },
  zoomDefault() {
    zoomGeneral(1);
    buttons.zoomDefault.classList.add('current');
  },
  zoomIn() {
    zoomGeneral(this.factor.in);
    buttons.zoomIn.classList.add('current');
  },
};

// Element references
const buttons = {
  zoomOut: qjs('zoom-out'),
  zoomDefault: qjs('zoom-default'),
  zoomIn: qjs('zoom-in'),
};
const nonZoomElements = qda('non-zoom');
const obstructiveElements = qda('obstructive');

// Needed for zoom button click handlers
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
  dom.gameplay.classList.toggle('zoomed-out', isOut);
  for (const button of Object.values(buttons)) {
    button.classList.remove('current');
  }
  for (const element of obstructiveElements) {
    element.classList.remove('slim');
  }
  dom.gameOver.classList.remove('inactive');
};
