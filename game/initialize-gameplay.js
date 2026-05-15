import {ael} from './utility.js';
import {bd} from './board-topology.js';
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

// Add human piece click handlers
for (let i = 0; i < bd.nHumanPieces; i++) {
  const id = `human-piece-${i}`;
  ael(`#${id}`, 'mousedown', (e) => {
    e.data = {piece: i};
    clickHumanPiece(e);
  });
  ael(`#${id} .edit-kill-human`, 'mousedown', (e) => {
    e.stopPropagation();
    e.data = {piece: i};
    clickEditKill(e);
  });
}

// Add raptor piece click handlers
for (let i = 0; i < bd.raptorStart.length; i++) {
  ael(`#raptor-piece-${i}`, 'mousedown', (e) => {
    e.data = {piece: i};
    clickRaptorPiece(e);
  });
}

// Add T-rex piece click handlers (for edit buttons)
ael('#edit-trex-advance', 'mousedown', (e) => {
  e.data = {change: 1};
  clickEditTrex(e);
});
ael('#edit-trex-retreat', 'mousedown', (e) => {
  e.data = {change: -1};
  clickEditTrex(e);
});
