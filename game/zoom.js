import {
  qjs, qda, windowWH, cssFloat,
} from './utility.js';
import {dom} from './dom.js';

export const zoom = {
  factor: {current: null, in: 2, outMax: 0.125},
  center: {},
  highlightBlinkIds: [],
  zoomOut() {
    const [bw, bh] = this.boardSize;
    const [ww, wh] = windowWH();
    const matte = displayMatte();
    const wwMatted = ww - matte.left - matte.right;
    const whMatted = wh - matte.top - matte.bottom;
    let factor = Math.min(
      wwMatted / bw, whMatted / bh,
    );
    factor = Math.max(factor, this.factor.outMax);
    zoomGeneral(factor);
    const bwZoomed = bw * factor;
    const bhZoomed = bh * factor;
    const fw = Math.max((wwMatted - bwZoomed) / 2, 0);
    const fh = Math.max((whMatted - bhZoomed) / 2, 0);
    const rawLeft = fw + matte.left;
    const rawTop = fh + matte.top;
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
    const [ww, wh] = windowWH();
    const dm = displayMatte();
    const shiftX = (ww + dm.left - dm.right) / 2;
    const shiftY = (wh + dm.top - dm.bottom) / 2;
    zoom.center = {
      left: (scrollX + shiftX) / this.factor.current,
      top: (scrollY + shiftY) / this.factor.current,
    };
  },
  applyCenter() {
    const {left: cl, top: ct} = this.center;
    const fc = this.factor.current;
    const [ww, wh] = windowWH();
    const dm = displayMatte();
    const shiftX = (ww + dm.left - dm.right) / 2;
    const shiftY = (wh + dm.top - dm.bottom) / 2;
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
function displayMatte() {
  const matte = {};
  const sides = ['top', 'right', 'bottom', 'left'];
  for (const side of sides) {
    matte[side] = cssFloat(`--matte-${side}`, 'body');
  }
  return matte;
}
function zoomGeneral(factor) {
  if (!zoom.factor.current) {
    zoom.factor.current = 1;
    zoom.applyCenter();
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
