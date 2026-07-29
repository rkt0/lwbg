import {click} from './utility.js';
import {bd} from './board-topology.js';
import {gs, mv} from './game-objects.js';
import {dom} from './dom.js';
import {ai} from './ai.js';
import {sb} from './sidebar.js';
import {message} from './message.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';

export function clickHumanSpace(space) {
  const isBldg = bd.bldgHumanSpaces.includes(space);
  if (edit.on) {
    return clickHumanSpaceEditMode(space, isBldg);
  }
  if (gs.turn !== 'human') return;
  if (ai.control.human) return;
  if (gs.phase === 'select') {
    return clickHumanPieceOnClickedSpace(space);
  }
  if (gs.phase === 'move') {
    const from = mv.plan[mv.plan.length - 1];
    if (space === from) return;
    if (!mv.toGo) return checkBuildingEndsMove(from);
    if (gs.je) {
      if (checkJump(from, space)) return;
    } else {
      if (checkMustRollJump(from, space)) return;
      if (checkNotAdjacent(from, space)) return;
      if (checkNoDoubleBack(space)) return;
      if (checkNoReturnStart(space)) return;
    }
    if (checkHumanOccupied(space, isBldg)) return;
    message.hide();
    if (dom.move) {
      dom.path.push(dom.move);
      dom.move.classList.add('path');
      dom.move.classList.remove('move');
    }
    dom.move = dom.humanSpace[space];
    dom.move.classList.add('move');
    mv.plan.push(space);
    if (!gs.je) {
      const edge = dom.humanEdge[`${from}-${space}`];
      dom.path.push(edge);
      edge.classList.add('path');
    }
    if (isBldg) mv.toGo = 0; else mv.toGo--;
    if (!mv.toGo) sb.showButton('confirm');
  }
}

export function clickRaptorSpace(space) {
  const isBldg = bd.bldgRaptorSpaces.includes(space);
  if (edit.on) return clickRaptorSpaceEditMode(space);
  if (gs.turn !== 'raptor') return;
  if (ai.control.raptor) return;
  if (gs.phase === 'select') {
    return clickRaptorPieceOnClickedSpace(space);
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
    message.hide();
    if (dom.move) {
      dom.path.push(dom.move);
      dom.move.classList.add('path');
      dom.move.classList.remove('move');
    }
    const moveElement = dom.raptorSpace[space];
    // Pull space from current location in DOM and
    // append it to end to ensure it is 'on top'
    dom.raptorSpaceGroup.append(moveElement);
    if (isBldg) {
      const {bldgRaptorSpaces, bldgHumanSpaces} = bd;
      const rIndex = bldgRaptorSpaces.indexOf(space);
      const hSpace = bldgHumanSpaces[rIndex];
      dom.move = dom.humanSpace[hSpace];
    } else dom.move = moveElement;
    dom.move.classList.add('move');
    mv.plan.push(space);
    mv.toGo--;
    if (!mv.toGo) sb.showButton('confirm');
  }
}

export function clickBuilding(building) {
  const hSpace = bd.bldgHumanSpaces[building];
  const rSpace = bd.bldgRaptorSpaces[building];
  clickHumanSpace(hSpace);
  clickRaptorSpace(rSpace);
}

// Needed for human/raptor space click handlers
function checkNotAdjacent(from, space) {
  const moveChoices = gs.turn === 'human' ?
    bd.humanChoices.move : bd.raptorChoices.move;
  const result = !moveChoices[from].has(space);
  if (result) message.show('not-adjacent');
  return result;
}
function checkNoDoubleBack(space) {
  const result = mv.plan.includes(space);
  if (result) message.show('no-double-back');
  return result;
}

// Needed for human space click handler
function checkBuildingEndsMove(from) {
  const result =
    bd.bldgHumanSpaces.includes(from) && !gs.je;
  if (result) message.show('building-ends-move');
  return result;
}
function checkJump(from, space) {
  const result =
    !bd.humanChoices.jump[from].has(space);
  if (result) {
    const id = bd.bldgHumanSpaces.includes(space) ?
      'wrong-landing' : 'jump-only-jump';
    message.show(id);
  }
  return result;
}
function checkMustRollJump(from, space) {
  const result =
    bd.humanChoices.jump[from].has(space);
  if (result) message.show('must-roll-jump');
  return result;
}
function checkNoReturnStart(space) {
  const result = space === bd.humanStart;
  if (result) message.show('no-return-start');
  return result;
}
function checkHumanOccupied(space, isBldg) {
  const result = mv.toGo === 1 &&
    gp.nHumansOn(space) && !isBldg;
  if (result) message.show('human-occupied');
  return result;
}
function clickHumanPieceOnClickedSpace(space) {
  if (gp.nHumansOn(space) === 1) {
    click(dom.humanPiece[gs.humans.indexOf(space)]);
  }
}
async function clickHumanSpaceEditMode(
  space, isBldg,
) {
  if (edit.selected.species === 'raptor') return;
  if (!edit.selected.species) {
    return clickHumanPieceOnClickedSpace(space);
  }
  const piece = edit.selected.piece;
  if (gs.humans[piece] === space) return;
  if (gp.nHumansOn(space) && !isBldg) return;
  if (space === bd.humanStart && !gs.trex) return;
  gp.moveHuman(piece, space, false);
  await edit.cancelSelection();
  const gameNoLongerOver = gs.turn === 'over' &&
    ![bd.humanGoal, bd.humanDead].includes(space)
  if (gameNoLongerOver) {
    gs.turn = 'human';
    sb.displayTurn('human', true);
    await sb.showButton('turn-display');
    edit.showEditTurnButton();
  }
}

// Needed for raptor space click handler
function checkEnter(from, space) {
  const result =
    !bd.raptorChoices.enter[from].has(space);
  if (result) {
    const id = bd.bldgRaptorSpaces.includes(space) ?
      'wrong-entry' : 'enter-only-enter';
    message.show(id);
  }
  return result;
}
function checkMustRollEnter(from, space) {
  const result =
    bd.raptorChoices.enter[from].has(space);
  if (result) message.show('must-roll-enter');
  return result;
}
function checkRaptorOccupied(space) {
  const result = gp.nRaptorsOn(space) > 0;
  if (result) message.show('raptor-occupied');
  return result;
}
function clickRaptorPieceOnClickedSpace(space) {
  if (gp.nRaptorsOn(space) === 1) {
    click(dom.raptorPiece[gs.raptors.indexOf(space)]);
  }
}
function clickRaptorSpaceEditMode(space) {
  if (edit.selected.species === 'human') return;
  if (!edit.selected.species) {
    return clickRaptorPieceOnClickedSpace(space);
  }
  const piece = edit.selected.piece;
  if (gs.raptors[piece] === space) return;
  if (gp.nRaptorsOn(space)) return;
  bd.humanStartRaptorSpace ??= bd.bldgRaptorSpaces[
    bd.bldgHumanSpaces.indexOf(bd.humanStart)
  ];
  bd.humanGoalRaptorSpace ??= bd.bldgRaptorSpaces[
    bd.bldgHumanSpaces.indexOf(bd.humanGoal)
  ];
  if (space === bd.humanStartRaptorSpace) return;
  if (space === bd.humanGoalRaptorSpace) return;
  gp.moveRaptor(piece, space, false, true);
  edit.cancelSelection();
}
