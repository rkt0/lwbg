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

// Add human piece click handlers
for (let i = 0; i < bd.nHumanPieces; i++) {
  const id = `human-piece-${i}`;
  ael(`#${id} .edit-kill-human`, 'mousedown', (e) => {
    e.stopPropagation();
    e.data = {piece: i};
    clickEditKill(e);
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

function targetItem(event, selector) {
  const id = event.target.closest(selector)?.id;
  if (!id) return -1;
  return +id.slice(id.lastIndexOf('-') + 1);
}
ael('#gameplay-container', 'mousedown', (e) => {
  const rPiece = targetItem(e, '.raptor-piece');
  if (rPiece > -1) clickRaptorPiece(rPiece);
  const hPiece = targetItem(e, '.human-piece');
  if (hPiece > -1) clickHumanPiece(hPiece);
  const hSpace = targetItem(e, '.human-space');
  if (hSpace > -1) clickHumanSpace(hSpace);
  const bldg = bd.bldgHumanSpaces.indexOf(hSpace);
  let rSpace = bd.bldgRaptorSpaces[bldg];
  rSpace ??= targetItem(e, '.raptor-space');
  if (rSpace > -1) clickRaptorSpace(rSpace);
});
