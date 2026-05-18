import {qs, click} from './utility.js';
import {bd} from './board-topology.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv} from './game-objects.js';
import {gp} from './functions-gameplay.js';
import {ui} from './functions-ui.js';
import {edit} from './edit-mode.js';

export function clickHumanPiece(piece) {
  const space = gs.humans[piece];
  if (edit.on) {
    clickHumanPieceEditMode(piece, space)
    return;
  }
  if (gs.turn !== 'human') return;
  if (ai.control.human) return;
  if (gs.phase === 'move') {
    click(`#human-space-${space}`);
    return;
  }
  if (gs.phase === 'select') {
    if (checkNoLeaveEnd(space)) return;
    if (checkNoSelectDead(space)) return;
    if (gs.je) {
      if (checkNotJumpPosition(space)) return;
    }
    ui.hideMessage();
    selectAppropriate(piece);
    mv.selected = piece;
    mv.plan = [space];
    mv.toGo = gs.je ? 1 : gs.rollN;
    ui.replaceButton(
      'decline-button', 'cancel-button'
    );
    gs.phase = 'move';
  }
}

export function clickRaptorPiece(piece) {
  const space = gs.raptors[piece];
  if (edit.on) {
    clickRaptorPieceEditMode(piece, space);
    return;
  }
  if (gs.turn !== 'raptor') return;
  if (ai.control.raptor) return;
  if (gs.phase === 'move') {
    click(`#raptor-space-${space}`);
    return;
  }
  if (gs.phase === 'select') {
    if (gs.je) {
      if (checkNotEnterPosition(space)) return;
    }
    ui.hideMessage();
    const element = qs(`#raptor-piece-${piece}`);
    element.classList.add('selected');
    mv.selected = piece;
    mv.plan = [space];
    mv.toGo = gs.je ? 1 : gs.rollN;
    ui.replaceButton(
      'decline-button', 'cancel-button'
    );
    gs.phase = 'move';
  }
}

export function clickEditKill(piece) {
  gp.moveHuman(piece, bd.humanDead, false);
  const time = anim.time.editControlFade;
  anim.fade(`#human-piece-${piece} .kill`, 0, time);
  qs('.selected').classList.remove('selected');
  ui.raptorItemsClickable(true);
  edit.selected.species = null;
  edit.selected.piece = null;
}

export function clickEditTrex(change) {
  if (!edit.on) return;
  const {absolute, relative} = change;
  let space = gs.trex;
  if (relative) space += relative;
  if (absolute) space = absolute;
  space = Math.max(space, 0);
  space = Math.min(space, bd.trexStart);
  if (space === gs.trex) return;
  gp.moveTrex(space, false, true);
}

// Needed for human piece click handler
function checkNoLeaveEnd(space) {
  const result = space === bd.humanGoal;
  if (result) ui.showMessage('no-leave-end');
  return result;
}
function checkNoSelectDead(space) {
  const result = space === bd.humanDead;
  if (result) ui.showMessage('no-select-dead');
  return result;
}
function checkNotJumpPosition(space) {
  const okSpaces = bd.humanJumps.map(s => s[0]);
  const result = !okSpaces.includes(space);
  if (result) ui.showMessage('not-jump-position');
  return result;
}
function selectAppropriate(piece) {
  const space = gs.humans[piece];
  let id = `human-space-${space}`;
  const isBldg = bd.bldgHumanSpaces.includes(space);
  if (isBldg || space === bd.humanDead) {
    id = `human-piece-${piece}`;
  }
  qs(`#${id}`).classList.add('selected');
}
function clickHumanPieceEditMode(piece, space) {
  if (edit.selected.species === 'raptor') return;
  if (edit.selected.species === 'human') {
    click(`#human-space-${space}`);
    return;
  }
  selectAppropriate(piece);
  if (space !== bd.humanDead) {
    const time = anim.time.editControlFade;
    anim.fade(`#human-piece-${piece} .kill`, 1, time);
  }
  ui.raptorItemsClickable(false);
  edit.selected.species = 'human';
  edit.selected.piece = piece;
}

// Needed for raptor piece click handler
function checkNotEnterPosition(space) {
  const ep = bd.raptorEntrances.map(s => s[0]);
  const result = !ep.includes(space);
  if (result) ui.showMessage('not-enter-position');
  return result;
}
function clickRaptorPieceEditMode(piece, space) {
  if (edit.selected.species === 'human') return;
  if (edit.selected.species === 'raptor') {
    click(`#raptor-space-${space}`);
    return;
  }
  const element = qs(`#raptor-piece-${piece}`);
  element.classList.add('selected');
  ui.humanItemsClickable(false);
  edit.selected.species = 'raptor';
  edit.selected.piece = piece;
}
