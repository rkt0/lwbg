import {qjs, qda} from './utility.js';
import {dom} from './dom.js';
import {tvMatte} from './tv-matte.js';

export const zoom = {
  factor: {current: null, in: 2, outMax: 0.125},
  center: {},
  highlightBlinkIds: [],
  zoomOut() {
    const [bw, bh] = this.boardSize;
    const [wwm, whm] = tvMatte.windowWHMatted();
    const matte = tvMatte.current();
    let factor = Math.min(wwm / bw, whm / bh);
    factor = Math.max(factor, this.factor.outMax);
    zoomGeneral(factor);
    const bwZoomed = bw * factor;
    const bhZoomed = bh * factor;
    const fw = Math.max((wwm - bwZoomed) / 2, 0);
    const fh = Math.max((whm - bhZoomed) / 2, 0);
    const rawLeft = fw + matte.left;
    const rawTop = fh + matte.top;
    dom.gameplay.style.left = `${rawLeft / factor}px`;
    dom.gameplay.style.top = `${rawTop / factor}px`;
    buttons.zoomOut.classList.add('current');
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
    const [wwm, whm] = tvMatte.windowWHMatted();
    const matte = tvMatte.current();
    const shiftX = wwm / 2 + matte.left;
    const shiftY = whm / 2 + matte.top;
    zoom.center = {
      left: (scrollX + shiftX) / this.factor.current,
      top: (scrollY + shiftY) / this.factor.current,
    };
  },
  adjustCenterForMatte(direction) {
    const matte = tvMatte.current();
    this.center.left += matte.left * direction;
    this.center.top += matte.top * direction;
  },
  applyCenter() {
    const {left: cl, top: ct} = this.center;
    const fc = this.factor.current;
    const [wwm, whm] = tvMatte.windowWHMatted();
    const matte = tvMatte.current();
    const shiftX = wwm / 2 + matte.left;
    const shiftY = whm / 2 + matte.top;
    scroll(cl * fc - shiftX, ct * fc - shiftY);
  },
  isZoomedOut() {
    return (zoom.factor.current ?? 1) < 1;
  },
};

// Element references
const buttons = {
  zoomOut: qjs('zoom-out'),
  zoomDefault: qjs('zoom-default'),
  zoomIn: qjs('zoom-in'),
};
const nonZoomElements = qda('non-zoom');

// Needed for zoom button click handlers
function zoomGeneral(factor) {
  if (!zoom.factor.current) {
    zoom.factor.current = 1;
    zoom.adjustCenterForMatte(1);
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
  dom.gameOver.classList.remove('inactive');
};
