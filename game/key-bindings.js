import {qjs} from './utility.js';
import {click} from './mouse-events.js';
import {gs, mv} from './game-objects.js';
import {zoom} from './zoom.js';
import {music} from './music.js';
import {ai} from './ai.js';
import {toggle} from './toggle.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';
import {moreMenu} from './more-menu.js';

// Helper function
function clickIfOk(button) {
  if (button.disabled) return;
  if (button.closest('[inert]')) return;
  click(button);
}

// Key handlers
function handleConfirmKey() {
  if (!gp.isActive()) return;
  let js;
  if (edit.on) js = 'edit-confirm';
  else switch (gs.phase) {
    case 'select':
      if (ai.control[gs.turn]) js = 'ok-ai-move';
      else if (gs.je && mv.toGo === -1) {
        js = 'ok-no-move';
      }
      break;
    case 'roll':
      js = 'roll-dice';
      break;
    case 'move':
      if (gs.turn === 'trex') {
        js = gs.rollN ? 'ok-trex-move' : 'ok-no-move';
      } else if (!mv.toGo) js = 'confirm';
      break;
  }
  if (js) clickIfOk(qjs(js));
}
function handleCancelKey() {
  if (moreMenu.isActive()) moreMenu.hide();
  if (!gp.isActive()) return;
  else if (edit.on || gs.phase === 'move') {
    clickIfOk(qjs('cancel'));
  }
}
function handleEscapeKey() {
  // In case user holds Escape to leave fullscreen
  if (!zoom.isZoomedOut()) zoom.setCenter();
  handleCancelKey();
}
function handleZoomKey(e) {
  if (!gp.isActive()) return;
  if (zoom.factorCurrent !== 1) zoom.zoomDefault();
  else dispatchZoomKey[e.key]?.();
}

// Dispatch table for zoom handler
const dispatchZoomKey = {
  '-': () => zoom.zoomOut(),
  '_': () => zoom.zoomOut(),
  '=': () => zoom.zoomIn(),
  '+': () => zoom.zoomIn(),
};

// Dispatch table for key handler
const dispatch = {
  'Enter': handleConfirmKey,
  ' ': handleConfirmKey,
  'Escape': handleEscapeKey,
  'Backspace': handleCancelKey,
  'm': () => toggle.audio(),
  'f': () => toggle.fullscreen(),
  't': () => toggle.tvMode(),
  '>': () => music.next(true, false),
  '?': () => music.next(true, true),
  '0': handleZoomKey,
  ')': handleZoomKey,
  '-': handleZoomKey,
  '_': handleZoomKey,
  '=': handleZoomKey,
  '+': handleZoomKey,
};

// Do not use the ael utility function here;
// ael always calls .preventDefault()
document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key in dispatch) {
    e.preventDefault();
    dispatch[e.key](e);
  }
});
