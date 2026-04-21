import {bd} from './logic.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv} from './game-objects.js';
import {ui} from './functions-ui.js';
import {edit} from './edit-mode.js';

export function clickHumanPiece(e) {
  const piece = +e.data.piece;
  const space = gs.humans[piece];
  if (edit.on) {
    clickHumanPieceEditMode(piece, space)
    return;
  }
  if (gs.turn !== 'human') return;
  if (ai.control.human) return;
  if (gs.phase === 'move') {
    $(`#human-space-${space}`).click();
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

export function clickRaptorPiece(e) {
  const piece = +e.data.piece;
  const space = gs.raptors[piece];
  if (edit.on) {
    clickRaptorPieceEditMode(piece, space);
    return;
  }
  if (gs.turn !== 'raptor') return;
  if (ai.control.raptor) return;
  if (gs.phase === 'move') {
    $(`#raptor-space-${space}`).click();
    return;
  }
  if (gs.phase === 'select') {
    if (gs.je) {
      if (checkNotEnterPosition(space)) return;
    }
    ui.hideMessage();
    $(`#raptor-piece-${piece}`).addClass('selected');
    mv.selected = piece;
    mv.plan = [space];
    mv.toGo = gs.je ? 1 : gs.rollN;
    ui.replaceButton(
      'decline-button', 'cancel-button'
    );
    gs.phase = 'move';
  }
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
  $(`#${id}`).addClass('selected');
}
function clickHumanPieceEditMode(piece, space) {
  if (edit.selected.species === 'raptor') return;
  if (edit.selected.species === 'human') {
    $(`#human-space-${space}`).click();
    return;
  }
  selectAppropriate(piece);
  if (space !== bd.humanDead) {
    $(`#human-piece-${piece} .edit-kill-human`)
      .fadeIn(anim.time.editControlFade);
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
    $(`#raptor-space-${space}`).click();
    return;
  }
  $(`#raptor-piece-${piece}`).addClass('selected');
  ui.humanItemsClickable(false);
  edit.selected.species = 'raptor';
  edit.selected.piece = piece;
}
