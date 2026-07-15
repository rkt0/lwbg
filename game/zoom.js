import {qjs, qda} from './utility.js';
import {
  displayMatte, windowWHMatted,
} from './display-matte.js';
import {dom} from './dom.js';

export const zoom = {
  factor: {current: null, in: 2, outMax: 0.125},
  center: {},
  highlightBlinkIds: [],
  zoomOut() {
    const [bw, bh] = this.boardSize;
    const [wwMatted, whMatted] = windowWHMatted();
    const dm = displayMatte();
    let factor = Math.min(
      wwMatted / bw, whMatted / bh,
    );
    factor = Math.max(factor, this.factor.outMax);
    zoomGeneral(factor);
    const bwZoomed = bw * factor;
    const bhZoomed = bh * factor;
    const fw = Math.max((wwMatted - bwZoomed) / 2, 0);
    const fh = Math.max((whMatted - bhZoomed) / 2, 0);
    const rawLeft = fw + dm.left;
    const rawTop = fh + dm.top;
    dom.gameplay.style.left = `${rawLeft / factor}px`;
    dom.gameplay.style.top = `${rawTop / factor}px`;
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
  setCenter() {
    const [wwMatted, whMatted] = windowWHMatted();
    const dm = displayMatte();
    const shiftX = wwMatted / 2 + dm.left;
    const shiftY = whMatted / 2 + dm.top;
    zoom.center = {
      left: (scrollX + shiftX) / this.factor.current,
      top: (scrollY + shiftY) / this.factor.current,
    };
  },
  applyCenter(adjustInitialView) {
    const dm = displayMatte();
    if (adjustInitialView) {
      this.center.left += dm.left;
      this.center.top += dm.top;
    }
    const {left: cl, top: ct} = this.center;
    const fc = this.factor.current;
    const [wwMatted, whMatted] = windowWHMatted();
    const shiftX = wwMatted / 2 + dm.left;
    const shiftY = whMatted / 2 + dm.top;
    scroll(cl * fc - shiftX, ct * fc - shiftY);
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
function zoomGeneral(factor) {
  if (!zoom.factor.current) {
    zoom.factor.current = 1;
    zoom.applyCenter(true);
    return;
  }
  if (zoom.factor.current === factor) return;
  if (zoom.factor.current >= 1) zoom.setCenter();
  dom.gameplay.style.zoom = factor;
  dom.gameplay.style.left = null;
  dom.gameplay.style.top = null;
  zoom.factor.current = factor;
  zoom.applyCenter();
  for (const element of nonZoomElements) {
    element.style.zoom = 1 / zoom.factor.current;
  }
  const isOut = factor < 1;
  document.body.classList.toggle('zoomed-out', isOut);
  document.body.style.setProperty(
    '--bg-scale', factor,
  );
  for (const button of Object.values(buttons)) {
    button.classList.remove('current');
  }
  for (const element of obstructiveElements) {
    element.classList.remove('slim');
  }
  dom.gameOver.classList.remove('inactive');
};
