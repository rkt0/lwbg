import {ael, camelFromKebab} from './utility.js';
import {dom} from './dom.js';
import {bd} from './board-topology.js';
import {pieces} from './pieces.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';
import {
  clickHumanSpace, clickRaptorSpace,
} from './click-board.js';
import {
  clickHumanPiece, clickRaptorPiece,
  clickEditKill, clickEditTrex,
} from './click-pieces.js';
import {moreMenu} from './more-menu.js';
import './initialize-board.js';

// Make pieces
pieces.makeAll();
gp.adjustHumanPositions();

// Initialize objects
await gp.initializeObjects();
autoSave.clear();
edit.clear();

// Helper function to get item index for click target
function targetItem(event, className) {
  const item = event.target.closest(`.${className}`);
  if (!item) return -1;
  return dom[camelFromKebab(className)].indexOf(item);
}

// Add gameplay click handlers
ael(dom.sectionGameplay, 'mousedown', (e) => {
  if (e.target.closest('#more-menu')) {
    return moreMenu.handleClick(e);
  }
  const rPiece = targetItem(e, 'raptor-piece');
  if (rPiece > -1) return clickRaptorPiece(rPiece);
  const hPiece = targetItem(e, 'human-piece');
  if (hPiece > -1) {
    if (e.target.closest('.kill')) {
      return clickEditKill(hPiece);
    } else return clickHumanPiece(hPiece);
  }
  const tSpace = targetItem(e, 'trex-space');
  if (tSpace > -1) {
    return clickEditTrex({absolute: tSpace});
  }
  const trexButton = e.target.closest('.trex-edit');
  if (trexButton) {
    const relative = +trexButton.dataset.change;
    return clickEditTrex({relative});
  }
  const hSpace = targetItem(e, 'human-space');
  let rSpace;
  if (hSpace > -1) {
    clickHumanSpace(hSpace);
    const bldg = bd.bldgHumanSpaces.indexOf(hSpace);
    rSpace = bd.bldgRaptorSpaces[bldg];
  }
  rSpace ??= targetItem(e, 'raptor-space');
  if (rSpace > -1) clickRaptorSpace(rSpace);
});
