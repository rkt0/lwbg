import {click} from './utility.js';
import {dom} from './dom.js';
import {bd} from './board-topology.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv} from './game-objects.js';
import {gp} from './gameplay.js';
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
    return click(dom.humanSpace[space]);
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
    ui.replaceButton('decline', 'cancel');
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
    gp.select(dom.raptorPiece[piece]);
    mv.selected = piece;
    mv.plan = [space];
    mv.toGo = gs.je ? 1 : gs.rollN;
    ui.replaceButton('decline', 'cancel');
    gs.phase = 'move';
  }
}

export function clickEditKill(piece) {
  gp.moveHuman(piece, bd.humanDead, false);
  const button = dom.editKill[piece];
  button.disabled = true;
  anim.fade(button, 0, anim.time.editControlFade);
  gp.select();
  gp.raptorItemsClickable(true);
  edit.selected.species = null;
  edit.selected.piece = null;
  ui.hideButton('cancel');
}

export function clickEditTrex(change, absolute) {
  if (!edit.on) return;
  let space = gs.trex;
  if (absolute) space = change; else space += change;
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
  let element = dom.humanSpace[space];
  let elementOn = dom.humanPiece[piece];
  const isBldg = bd.bldgHumanSpaces.includes(space);
  if (isBldg || space === bd.humanDead) {
    element = elementOn;
    elementOn = null;
  }
  gp.select(element, elementOn);
}
function clickHumanPieceEditMode(piece, space) {
  if (edit.selected.species === 'raptor') return;
  if (edit.selected.species === 'human') {
    return click(dom.humanSpace[space]);
  }
  selectAppropriate(piece);
  gp.raptorItemsClickable(false);
  edit.selected.species = 'human';
  edit.selected.piece = piece;
  ui.showButton('cancel');
  if (space === bd.humanDead) return;
  const button = dom.editKill[piece];
  button.disabled = false;
  anim.fade(button, 1, anim.time.editControlFade);
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
  gp.select(dom.raptorPiece[piece]);
  gp.humanItemsClickable(false);
  edit.selected.species = 'raptor';
  edit.selected.piece = piece;
  ui.showButton('cancel');
}
