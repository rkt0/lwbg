import {qjs, click} from './utility.js';
import {ai} from './ai.js';
import {music} from './music.js';
import {gs, mv} from './game-objects.js';
import {zoom} from './zoom.js';
import {toggle} from './toggle.js';
import {edit} from './edit-mode.js';
import {moreMenu} from './more-menu.js';
import {gp} from './functions-gameplay.js';

function clickIfOk(button) {
  if (button.disabled) return;
  if (button.closest('[inert]')) return;
  click(button);
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
      toggle.fullscreen();
      break;
    case 't':
      e.preventDefault();
      toggle.tvMode();
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
