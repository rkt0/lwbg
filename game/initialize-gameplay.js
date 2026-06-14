import {closestData, ael} from './utility.js';
import {dom} from './dom.js';
import {pieces} from './pieces.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';
import {
  clickHumanSpace, clickRaptorSpace, clickBuilding,
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

// Add gameplay click handlers
ael(dom.gameplay, 'mousedown', (e) => {
  if (moreMenu.element.contains(e.target)) {
    return moreMenu.handleClick(e);
  }
  const rPieceData = closestData(e, 'raptor-piece');
  if (rPieceData) {
    return clickRaptorPiece(+rPieceData);
  }
  const hPieceData = closestData(e, 'human-piece');
  if (hPieceData) {
    if (closestData(e) === 'kill') {
      return clickEditKill(+hPieceData);
    } else return clickHumanPiece(+hPieceData);
  }
  const tSpaceData = closestData(e, 'trex-space');
  if (tSpaceData) {
    return clickEditTrex({absolute: +tSpaceData});
  }
  const tChangeData = closestData(e, 'trex-change');
  if (tChangeData) {
    return clickEditTrex({relative: +tChangeData});
  }
  const buildingData = closestData(e, 'building');
  if (buildingData) {
    return clickBuilding(+buildingData);
  }
  const hSpaceData = closestData(e, 'human-space');
  if (hSpaceData) return clickHumanSpace(+hSpaceData);
  const rSpaceData = closestData(e, 'raptor-space');
  if (rSpaceData) clickRaptorSpace(+rSpaceData);
});
