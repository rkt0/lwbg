import {qs, click} from './utility.js';
import {dom} from './dom.js';
import {bd} from './board-topology.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv} from './game-objects.js';
import {gp} from './functions-gameplay.js';
import {ui} from './functions-ui.js';
import {message} from './message.js';
import {edit} from './edit-mode.js';

export function clickHumanPiece(piece) {
  const space = gs.humans[piece];
  if (edit.on) {
    return clickHumanPieceEditMode(piece, space);
  }
  if (gs.turn !== 'human') return;
  if (ai.control.human) return;
  if (gs.phase === 'move') {
    return click(`#human-space-${space}`);
  }
  if (gs.phase === 'select') {
    if (checkNoLeaveEnd(space)) return;
    if (checkNoSelectDead(space)) return;
    if (gs.je) {
      if (checkNotJumpPosition(space)) return;
    }
    message.hide();
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
    return clickRaptorPieceEditMode(piece, space);
  }
  if (gs.turn !== 'raptor') return;
  if (ai.control.raptor) return;
  if (gs.phase === 'move') {
    return click(dom.raptorSpace[space]);
  }
  if (gs.phase === 'select') {
    if (gs.je) {
      if (checkNotEnterPosition(space)) return;
    }
    message.hide();
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
  const aTime = anim.time.editControlFade;
  anim.fade(`#human-piece-${piece} .kill`, 0, aTime);
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
  if (result) message.show('no-leave-end');
  return result;
}
function checkNoSelectDead(space) {
  const result = space === bd.humanDead;
  if (result) message.show('no-select-dead');
  return result;
}
function checkNotJumpPosition(space) {
  const okSpaces = bd.humanJumps.map(s => s[0]);
  const result = !okSpaces.includes(space);
  if (result) message.show('not-jump-position');
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
    return click(`#human-space-${space}`);
  }
  selectAppropriate(piece);
  ui.raptorItemsClickable(false);
  edit.selected.species = 'human';
  edit.selected.piece = piece;
  if (space === bd.humanDead) return;
  const aTime = anim.time.editControlFade;
  anim.fade(`#human-piece-${piece} .kill`, 1, aTime);
}

// Needed for raptor piece click handler
function checkNotEnterPosition(space) {
  const ep = bd.raptorEntrances.map(s => s[0]);
  const result = !ep.includes(space);
  if (result) message.show('not-enter-position');
  return result;
}
function clickRaptorPieceEditMode(piece, space) {
  if (edit.selected.species === 'human') return;
  if (edit.selected.species === 'raptor') {
    return click(dom.raptorSpace[space]);
  }
  const element = qs(`#raptor-piece-${piece}`);
  element.classList.add('selected');
  ui.humanItemsClickable(false);
  edit.selected.species = 'raptor';
  edit.selected.piece = piece;
}
