import {ael} from './utility.js';
import {bd} from './board-topology.js';
import {pieces} from './pieces.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';
import {
  clickHumanSpace, clickRaptorSpace, clickBuilding,
} from './click-board.js';
import './initialize-board.js';

// Make pieces
pieces.makeAll();
gp.adjustHumanPositions();

// Initialize objects
await gp.initializeObjects();
gp.setSaveFunction(() => {autoSave.update();});
autoSave.clear();
edit.clear();

// Add human space click handlers
for (let i = 0; i < bd.nHumanSpaces; i++) {
  if (bd.bldgHumanSpaces.includes(i)) continue;
  ael(`#human-space-${i}`, 'mousedown', (e) => {
    e.data = {space: i};
    clickHumanSpace(e);
  });
}

// Add raptor space click handlers
for (let i = 0; i < bd.nRaptorSpaces; i++) {
  const id = `raptor-space-${i}`;
  ael(`#${id}`, 'mousedown', (e) => {
    e.data = {space: i};
    clickRaptorSpace(e);
  });
}

// Add building click handlers
for (let i = 0; i < bd.bldgHumanSpaces.length; i++) {
  const hSpace = bd.bldgHumanSpaces[i];
  const rSpace = bd.bldgRaptorSpaces[i];
  ael(`#human-space-${hSpace}`, 'mousedown', (e) => {
    e.data = {hSpace, rSpace};
    clickBuilding(e);
  });
}
