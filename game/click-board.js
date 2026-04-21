import {bd} from './logic.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {edit} from './edit-mode.js';

export function clickHumanSpace(e) {
  const space = +e.data.space;
  const isBldg = !!e.data.isBldg;
  if (edit.on) {
    clickHumanSpaceEditMode(space, isBldg);
    return;
  }
  if (gs.turn !== 'human') return;
  if (ai.control.human) return;
  if (gs.phase === 'select') {
    clickHumanPieceOnClickedSpace(space);
    return;
  }
  if (gs.phase === 'move') {
    const from = mv.plan[mv.plan.length - 1];
    if (space === from) return;
    if (!mv.toGo) {
      checkBuildingEndsMove(from);
      return;
    }
    if (gs.je) {
      if (checkJump(from, space)) return;
    } else {
      if (checkMustRollJump(from, space)) return;
      if (checkNotAdjacent(from, space)) return;
      if (checkNoDoubleBack(space)) return;
      if (checkNoReturnStart(space)) return;
    }
    if (checkHumanOccupied(space, isBldg)) return;
    ui.hideMessage();
    $('.human-space.move')
      .removeClass('move').addClass('path');
    $(`#human-space-${space}`).addClass('move');
    mv.plan.push(space);
    if (!gs.je) {
      const s0 = Math.min(from, space);
      const s1 = Math.max(from, space);
      $(`#human-edge-${s0}_${s1}`).addClass('path');
    }
    if (isBldg) mv.toGo = 0; else mv.toGo--;
    if (!mv.toGo) ui.showButton('confirm-button');
  }
}

export function clickRaptorSpace(e) {
  const space =  +e.data.space;
  const isBldg = !!e.data.isBldg;
  if (edit.on) {
    clickRaptorSpaceEditMode(space);
    return;
  }
  if (gs.turn !== 'raptor') return;
  if (ai.control.raptor) return;
  if (gs.phase === 'select') {
    clickRaptorPieceOnClickedSpace(space);
    return;
  }
  if (gs.phase === 'move') {
    const from = mv.plan[mv.plan.length - 1];
    if (space === from) return;
    if (!mv.toGo) return;
    if (gs.je) {
      if (checkEnter(from, space)) return;
    } else {
      if (checkMustRollEnter(from, space)) return;
      if (checkNotAdjacent(from, space)) return;
      if (checkNoDoubleBack(space)) return;
    }
    if (checkRaptorOccupied(space)) return;
    ui.hideMessage();
    $('.move').removeClass('move').addClass('path');
    // Pull space from current location in DOM and
    // append it to end to ensure it is 'on top'
    $(`#raptor-space-${space}`).addClass('move')
      .appendTo('#raptor-map svg');
    if (isBldg) {
      const hSpace = bd.bldgHumanSpaces[
        bd.bldgRaptorSpaces.indexOf(space)
      ];
      $(`#human-space-${hSpace}`).addClass('move');
    }
    mv.plan.push(space);
    mv.toGo--;
    if (!mv.toGo) ui.showButton('confirm-button');
  }
}

export function clickBuilding(e) {
  const hSpace = +e.data.hSpace;
  const rSpace = +e.data.rSpace;
  clickHumanSpace({
    data: {space: hSpace, isBldg: true},
  });
  clickRaptorSpace({
    data: {space: rSpace, isBldg: true},
  });
}

// Needed for human/raptor space click handlers
function checkNotAdjacent(from, space) {
  const moveChoices = gs.turn === 'human' ?
    bd.humanChoices.move : bd.raptorChoices.move;
  const result = !moveChoices[from].has(space);
  if (result) ui.showMessage('not-adjacent');
  return result;
}
function checkNoDoubleBack(space) {
  const result = mv.plan.includes(space);
  if (result) ui.showMessage('no-double-back');
  return result;
}

// Needed for human space click handler
function checkBuildingEndsMove(from) {
  const result =
    bd.bldgHumanSpaces.includes(from) && !gs.je;
  if (result) ui.showMessage('building-ends-move');
  return result;
}
function checkJump(from, space) {
  const result =
    !bd.humanChoices.jump[from].has(space);
  if (result) {
    const id = bd.bldgHumanSpaces.includes(space) ?
      'wrong-landing' : 'jump-only-jump';
    ui.showMessage(id);
  }
  return result;
}
function checkMustRollJump(from, space) {
  const result =
    bd.humanChoices.jump[from].has(space);
  if (result) ui.showMessage('must-roll-jump');
  return result;
}
function checkNoReturnStart(space) {
  const result = space === bd.humanStart;
  if (result) ui.showMessage('no-return-start');
  return result;
}
function checkHumanOccupied(space, isBldg) {
  const result = mv.toGo === 1 &&
    gp.nHumansOn(space) && !isBldg;
  if (result) ui.showMessage('human-occupied');
  return result;
}
function clickHumanPieceOnClickedSpace(space) {
  if (gp.nHumansOn(space) === 1) {
    const piece = gs.humans.indexOf(space);
    $(`#human-piece-${piece}`).click();
  }
}
function clickHumanSpaceEditMode(space, isBldg) {
  if (edit.selected.species === 'raptor') return;
  if (!edit.selected.species) {
    clickHumanPieceOnClickedSpace(space);
    return;
  }
  const piece = edit.selected.piece;
  const aTime = anim.time.editControlFade;
  if (gs.humans[piece] !== space) {
    if (gp.nHumansOn(space) && !isBldg) return;
    gp.moveHuman(piece, space, false);
    const gameNoLongerOver = gs.turn === 'over' &&
      ![bd.humanGoal, bd.humanDead].includes(space)
    if (gameNoLongerOver) {
      gs.turn = 'human';
      gs.phase = 'roll';
      ui.showButton('turn-display');
      ui.displayTurn('human');
      $('.edit-turn').fadeIn(aTime);
    }
  }
  $(`#human-piece-${piece} .edit-kill-human`)
    .fadeOut(aTime);
  $('.selected').removeClass('selected');
  ui.raptorItemsClickable(true);
  // If edit.selected were reset immediately,
  // then moving a human to a building (by edit) that
  // is occupied by a raptor would also then select 
  // that raptor, so instead we insert a slight delay
  setTimeout(() => {
    edit.selected.species = null;
    edit.selected.piece = null;
  }, anim.time.moveHuman / 6);
}

// Needed for raptor space click handler
function checkEnter(from, space) {
  const result =
    !bd.raptorChoices.enter[from].has(space);
  if (result) {
    const id = bd.bldgRaptorSpaces.includes(space) ?
      'wrong-entry' : 'enter-only-enter';
    ui.showMessage(id);
  }
  return result;
}
function checkMustRollEnter(from, space) {
  const result =
    bd.raptorChoices.enter[from].has(space);
  if (result) ui.showMessage('must-roll-enter');
  return result;
}
function checkRaptorOccupied(space) {
  const result = gp.nRaptorsOn(space) > 0;
  if (result) ui.showMessage('raptor-occupied');
  return result;
}
function clickRaptorPieceOnClickedSpace(space) {
  if (gp.nRaptorsOn(space) === 1) {
    const piece = gs.raptors.indexOf(space);
    $(`#raptor-piece-${piece}`).click();
  }
}
function clickRaptorSpaceEditMode(space) {
  if (edit.selected.species === 'human') return;
  if (!edit.selected.species) {
    clickRaptorPieceOnClickedSpace(space);
    return;
  }
  const piece = edit.selected.piece;
  if (gs.raptors[piece] !== space) {
    if (gp.nRaptorsOn(space)) return;
    gp.moveRaptor(piece, space, false, true);
  }
  $('.selected').removeClass('selected');
  ui.humanItemsClickable(true);
  edit.selected.species = null;
  edit.selected.piece = null;
}
