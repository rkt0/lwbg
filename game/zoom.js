import {qjs} from './utility.js';
import {template} from './template.js';
import {dom} from './dom.js';
import {tvMatte} from './tv-matte.js';

export const zoom = {
  factorCurrent: null,
  center: {},
  zoomOut() {
    const [bw, bh] = this.boardSize;
    const [wwm, whm] = tvMatte.windowWHMatted();
    const matte = tvMatte.current();
    let factor = Math.min(wwm / bw, whm / bh);
    factor = Math.max(factor, factorOutMax);
    zoomGeneral(factor);
    const bwZoomed = bw * factor;
    const bhZoomed = bh * factor;
    const fw = Math.max((wwm - bwZoomed) / 2, 0);
    const fh = Math.max((whm - bhZoomed) / 2, 0);
    const rawLeft = fw + matte.left;
    const rawTop = fh + matte.top;
    dom.gameplay.style.left = `${rawLeft / factor}px`;
    dom.gameplay.style.top = `${rawTop / factor}px`;
    buttons.out.classList.add('current');
    dom.gameOver.classList.add('inactive');
  },
  zoomDefault() {
    zoomGeneral(1);
    buttons.default.classList.add('current');
  },
  zoomIn() {
    zoomGeneral(factorIn);
    buttons.in.classList.add('current');
  },
  setCenter() {
    const [wwm, whm] = tvMatte.windowWHMatted();
    const matte = tvMatte.current();
    const shiftX = wwm / 2 + matte.left;
    const shiftY = whm / 2 + matte.top;
    zoom.center = {
      left: (scrollX + shiftX) / this.factorCurrent,
      top: (scrollY + shiftY) / this.factorCurrent,
    };
  },
  adjustCenterForMatte(direction) {
    const matte = tvMatte.current();
    this.center.left += matte.left * direction;
    this.center.top += matte.top * direction;
  },
  applyCenter() {
    const {left: cl, top: ct} = this.center;
    const fc = this.factorCurrent;
    const [wwm, whm] = tvMatte.windowWHMatted();
    const matte = tvMatte.current();
    const shiftX = wwm / 2 + matte.left;
    const shiftY = whm / 2 + matte.top;
    scroll(cl * fc - shiftX, ct * fc - shiftY);
  },
  isZoomedOut() {
    return (zoom.factorCurrent ?? 1) < 1;
  },
};

// Zoom factors
const factorIn = 2;
const factorOutMax = 0.125;

// Needed for zoom button click handlers
function zoomGeneral(factor) {
  if (!zoom.factorCurrent) {
    zoom.factorCurrent = 1;
    zoom.adjustCenterForMatte(1);
    zoom.applyCenter();
    return;
  }
  if (zoom.factorCurrent === factor) return;
  if (zoom.factorCurrent >= 1) zoom.setCenter();
  dom.gameplay.style.zoom = factor;
  dom.gameplay.style.left = null;
  dom.gameplay.style.top = null;
  zoom.factorCurrent = factor;
  zoom.applyCenter();
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

// Initialize buttons
const zoomButtonGroup = qjs('zoom-button-group');
const buttons = {};
for (const item of zoomButtonGroup.children) {
  const button = template('zoom-button');
  button.dataset.js = `zoom-${item.value}`;
  button.title = `Zoom ${
    item.value.replace(/^./, x => x.toUpperCase())
  }`;
  button.append(item.textContent);
  buttons[item.value] = button;
  zoomButtonGroup.replaceChild(button, item);
}
