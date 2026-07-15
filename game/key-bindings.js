import {qjs, click} from './utility.js';
import {ai} from './ai.js';
import {music} from './music.js';
import {gs, mv} from './game-objects.js';
import {zoom} from './zoom.js';
import {edit} from './edit-mode.js';
import {moreMenu} from './more-menu.js';
import {gp} from './functions-gameplay.js';

function clickIfOk(button) {
  if (button.disabled) return;
  if (button.closest('[inert]')) return;
  click(button);
}

async function toggleFullscreen() {
  const isZoomedOut = (zoom.factor.current ?? 1) < 1;
  if (!isZoomedOut) zoom.setCenter();
  const element = document.documentElement;
  if (!document.fullscreenElement) {
    await element?.requestFullscreen();
  } else await document.exitFullscreen();
  if (isZoomedOut) zoom.zoomOut();
  else zoom.applyCenter();
}

function toggleTvMode() {
  const isZoomedOut = (zoom.factor.current ?? 1) < 1;
  if (!isZoomedOut) zoom.setCenter();
  if (document.body.classList.contains('tv-mode')) {
    // Adjust center before removing matte
    zoom.adjustCenterForMatte(-1);
    document.body.classList.remove('tv-mode');
  } else {
    // Adjust center after adding matte
    document.body.classList.add('tv-mode');
    zoom.adjustCenterForMatte(1);
  }
  if (isZoomedOut) zoom.zoomOut();
  else zoom.applyCenter();
}

// Do not use the ael utility function here;
// ael always calls .preventDefault()
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'Enter':
    case ' ': {
      if (!gp.isActive()) return;
      e.preventDefault();
      if (edit.on) return;
      let identifier;
      if (gs.phase === 'select') {
        if (ai.control[gs.turn]) {
          identifier = 'ok-ai-move';
        }
        else if (gs.je && mv.toGo === -1) {
          identifier = 'ok-no-move';
        }
      } else if (gs.phase === 'roll') {
        identifier = 'roll-button';
      } else if (gs.phase === 'move') {
        if (gs.turn === 'trex') {
          identifier = gs.rollN ?
            'ok-trex-move' : 'ok-no-move';
        } else if (!mv.toGo) identifier = 'confirm';
      }
      if (identifier) clickIfOk(qjs(identifier));
      break;
    }
    case 'Escape':
    case 'x':
    case 'z':
      if (moreMenu.isActive()) {
        e.preventDefault();
        moreMenu.hide();
      } else if (gp.isActive()) {
        e.preventDefault();
        if (edit.on) return;
        if (gs.phase === 'move') {
          clickIfOk(qjs('cancel'));
        }
      }
      break;
    case 'm':
      e.preventDefault();
      music.toggle();
      break;
    case 'K':
      e.preventDefault();
      music.next(true, !e.altKey);
      break;
    case 'f':
      e.preventDefault();
      toggleFullscreen();
      break;
    case 't':
      e.preventDefault();
      toggleTvMode();
      break;
    case '-':
    case '=':
    case '0': {
      if (!gp.isActive()) return;
      e.preventDefault();
      const isNowOutOrIn = zoom.factor.current !== 1;
      if (isNowOutOrIn) zoom.zoomDefault();
      else if (e.key === '-') zoom.zoomOut();
      else if (e.key === '=') zoom.zoomIn();
      break;
    }
  }
});
