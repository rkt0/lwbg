import {qs, click} from './utility.js';
import {ai} from './ai.js';
import {music} from './music.js';
import {gs, mv} from './game-objects.js';
import {zoom} from './zoom.js';
import {edit} from './edit-mode.js';
import {moreMenu} from './more-menu.js';
import {gp} from './functions-gameplay.js';

function clickIfOk(buttonId) {
  const button = qs(`#${buttonId}`);
  if (button.disabled) return;
  if (button.closest('[inert]')) return;
  click(button);
}

function toggleFullscreen() {
  const element = document.documentElement;
  if (!document.fullscreenElement) {
    element?.requestFullscreen();
  } else document.exitFullscreen();
}

function quitOptionsActive() {
  return !qs('#quit-options').style.display;
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
      let id;
      if (gs.phase === 'select') {
        if (ai.control[gs.turn]) id = 'ok-ai-move';
        else if (gs.je && mv.toGo === -1) {
          id = 'ok-no-move';
        }
      } else if (gs.phase === 'roll') {
        id = 'roll-button';
      } else if (gs.phase === 'move') {
        id = gs.turn === 'trex' ?
          (gs.rollN ? 'ok-trex-move' : 'ok-no-move') :
          (mv.toGo ? '' : 'confirm-button');
      }
      if (id) clickIfOk(id);
      break;
    }
    case 'Escape':
    case 'x':
    case 'z':
      if (quitOptionsActive()) {
        e.preventDefault();
        clickIfOk('abort-quit');
      } else if (moreMenu.isActive()) {
        e.preventDefault();
        clickIfOk('hide-more');
      } else if (gp.isActive()) {
        e.preventDefault();
        if (edit.on) return;
        if (gs.phase === 'move') {
          clickIfOk('cancel-button');
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
      document.body.classList.toggle('tv-mode');
      break;
    case '-':
    case '=':
    case '0': {
      if (!gp.isActive()) return;
      e.preventDefault();
      let which = 'default';
      if (zoom.factor.current === 1) {
        if (e.key === '-') which = 'out';
        if (e.key === '=') which = 'in';
      }
      click(`#zoom-${which}`);
      break;
    }
  }
});
