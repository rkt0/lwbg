import {ael} from './utility.js';
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
import './initialize-board.js';

// Make pieces
pieces.makeAll();
gp.adjustHumanPositions();

// Initialize objects
await gp.initializeObjects();
gp.setSaveFunction(() => {autoSave.update();});
autoSave.clear();
edit.clear();

// Helper function to get item index for click target
function targetItem(event, selector) {
  const id = event.target.closest(selector)?.id;
  if (!id) return -1;
  return +id.slice(id.lastIndexOf('-') + 1);
}

// Add piece and space click handlers
ael('#gameplay-container', 'mousedown', (e) => {
  const rPiece = targetItem(e, '.raptor-piece');
  if (rPiece > -1) return clickRaptorPiece(rPiece);
  const hPiece = targetItem(e, '.human-piece');
  if (hPiece > -1) {
    if (e.target.closest('.kill')) {
      return clickEditKill(hPiece);
    } else return clickHumanPiece(hPiece);
  }
  const tSpace = targetItem(e, '.trex-space');
  if (tSpace > -1) {
    return clickEditTrex({absolute: tSpace});
  }
  const hSpace = targetItem(e, '.human-space');
  let rSpace;
  if (hSpace > -1) {
    clickHumanSpace(hSpace);
    const bldg = bd.bldgHumanSpaces.indexOf(hSpace);
    rSpace = bd.bldgRaptorSpaces[bldg];
  }
  rSpace ??= targetItem(e, '.raptor-space');
  if (rSpace > -1) clickRaptorSpace(rSpace);
});

// Add edit button click handlers
ael('#edit-trex-advance', 'mousedown', () => {
  clickEditTrex({relative: -1});
});
ael('#edit-trex-retreat', 'mousedown', () => {
  clickEditTrex({relative: 1});
});
