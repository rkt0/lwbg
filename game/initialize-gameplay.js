import {
  closestData, ael, camelFromKebab,
} from './utility.js';
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
ael(dom.gameplay, 'mousedown', (e) => {
  if (moreMenu.element.contains(e.target)) {
    return moreMenu.handleClick(e);
  }
  const rPiece = closestData(e, 'raptor-piece');
  if (rPiece) return clickRaptorPiece(+rPiece);
  const hPiece = closestData(e, 'human-piece');
  if (hPiece) {
    if (closestData(e) === 'kill') {
      return clickEditKill(+hPiece);
    } else return clickHumanPiece(+hPiece);
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
