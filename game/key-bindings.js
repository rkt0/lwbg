import {qs} from './utility.js';
import {ai} from './ai.js';
import {music} from './music.js';
import {gs, mv, zd} from './game-objects.js';
import {ui} from './functions-ui.js';
import {edit} from './edit-mode.js';

const clickIfOk = buttonId => {
  const $button = $(`#${buttonId}`);
  if (!$button.prop('disabled')) $button.click();
};

function moreMenuActive() {
  return !qs('#more-menu').style.display;
}
function quitOptionsActive() {
  return !qs('#quit-options').style.display;
}
function gameplayActive() {
  const gc = qs('#gameplay-container').style.display;
  if (gc !== 'block') return false;
  return !moreMenuActive();
}

// Do not use the ael utility function here;
// ael always calls .preventDefault()
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'Enter':
    case ' ': {
      if (!gameplayActive()) return;
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
      } else if (moreMenuActive()) {
        e.preventDefault();
        clickIfOk('hide-more');
      } else if (gameplayActive()) {
        e.preventDefault();
        if (edit.on) return;
        if (gs.phase === 'move') {
          clickIfOk('cancel-button');
        }
      }
      break;
    case 'm':
      e.preventDefault();
      $('#toggle-audio').click();
      break;
    case 'K':
      e.preventDefault();
      music.next(true, !e.altKey);
      break;
    case 'f':
      e.preventDefault();
      ui.toggleFullscreen();
      break;
    case 't':
      e.preventDefault();
      ui.cycleDisplayMode();
      break;
    case '-':
    case '=':
    case '0': {
      if (!gameplayActive()) return;
      e.preventDefault();
      let which = 'default';
      if (zd.factor.current === 1) {
        if (e.key === '-') which = 'out';
        if (e.key === '=') which = 'in';
      }
      $(`#zoom-${which}`).click();
      break;
    }
  }
});
