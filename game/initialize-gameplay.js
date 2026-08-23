import {closestData} from './utility.js';
import {atClick} from './mouse-events.js';
import {dom} from './dom.js';
import './initialize-board.js';
import {pieces} from './pieces.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';
import {autoSave} from './auto-save.js';
import {
  clickHumanSpace, clickRaptorSpace, clickBuilding,
} from './click-board.js';
import {
  clickHumanPiece, clickRaptorPiece,
  clickEditKill, clickEditTrex,
} from './click-pieces.js';

// Make pieces
pieces.makeAll();
gp.adjustHumanPositions();

// Initialize objects
await gp.initializeObjects();
autoSave.clear();
edit.clear();

// Add gameplay click handlers
atClick(dom.gameplay, (e) => {
  const killData = closestData(e, 'kill');
  if (killData) return clickEditKill(+killData);
  const rpData = closestData(e, 'raptor-piece');
  if (rpData) return clickRaptorPiece(+rpData);
  const hpData = closestData(e, 'human-piece');
  if (hpData) return clickHumanPiece(+hpData);
  const tsData = closestData(e, 'trex-space');
  if (tsData) return clickEditTrex(+tsData, true);
  const tdData = closestData(e, 'trex-delta');
  if (tdData) return clickEditTrex(+tdData);
  const bldgData = closestData(e, 'building');
  if (bldgData) return clickBuilding(+bldgData);
  const hsData = closestData(e, 'human-space');
  if (hsData) return clickHumanSpace(+hsData);
  const rsData = closestData(e, 'raptor-space');
  if (rsData) return clickRaptorSpace(+rsData);
});
