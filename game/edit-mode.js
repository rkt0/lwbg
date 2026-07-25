import {
  qjs, qda, closestData, ael, click, sleep, deepCopy,
} from './utility.js';
import {dom} from './dom.js';
import {dice} from './dice.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {message} from './message.js';

export const edit = {
  clear() {
    this.on = false;
    this.gsPrevious = {};
    this.cancelSelection();
    this.dieCodes = {movement: 0, continue: 0};
  },
  async begin() {
    if (gs.turn !== 'trex' && gs.turn !== 'over') {
      click(qjs('cancel'));
    }
    this.on = true;
    this.gsPrevious = deepCopy(gs);
    message.hide();
    const hidden = [
      'roll-button', 'decline',
      'ok-trex-move', 'ok-no-move', 'ok-ai-move',
    ];
    for (const x of hidden) await ui.hideButton(x);
    for (const element of elements.trexButtons) {
      anim.fade(element, 1, eTime);
    }
    if (gs.turn === 'over') {
      anim.fade(dom.gameOver, 0, eTime);
    } else anim.fade(qjs('edit-turn'), 1, eTime);
    if (gs.phase !== 'roll') enableDiceEdit();
    ui.humanItemsClickable(true);
    ui.raptorItemsClickable(true);
    await anim.slide(elements.banner, 1, eTime);
    elements.banner.inert = false;
    dom.showMore.style.visibility = 'hidden';
  },
  async cancelSelection() {
    dom.selected?.classList.remove('selected');
    dom.selected = null;
    ui.humanItemsClickable(true);
    ui.raptorItemsClickable(true);
    if (this.selected?.species === 'human') {
      const piece = this.selected.piece;
      const button = dom.editKill[piece];
      button.disabled = true;
      anim.fade(button, 0, eTime);
    }
    // If edit.selected were always reset immediately,
    // then moving a human to a building (by edit)
    // that is occupied by a raptor would also then
    // select that raptor, so instead we need
    // a slight delay when a human has been selected
    //
    // The time taken by hiding the cancel button
    // should be enough of a delay, but we also call
    // a short sleep in parallel just to be safe
    await Promise.all([
      ui.hideButton('cancel'),
      sleep(anim.time.moveHuman / 6),
    ]);
    this.selected = {species: null, piece: null};
    await ui.hideButton('cancel');
  },
};

// Animation time for edit control fade
const eTime = anim.time.editControlFade;

// Element references
const elements = {
  all: qda('edit'),
  banner: qjs('edit-banner'),
  trexButtons: qda('trex-change'),
  editTurnDie: [qjs('edit-turn'), ...qda('edit-die')],
};

// Banner
async function editGame(gsNew) {
  gp.clearMoveObject();
  for (const [p, s] of gsNew.humans.entries()) {
    await gp.relocatePiece('human', p, s);
  }
  gp.adjustHumanPositions();
  for (const [p, s] of gsNew.raptors.entries()) {
    await gp.relocatePiece('raptor', p, s);
  }
  await gp.relocatePiece('trex', null, gsNew.trex);
  // Check whether roll result needs to be changed;
  // if ui.displayRollResult were called with 
  // unchanged roll result, dice would flicker
  const rollResultChanged = gs.turn !== gsNew.turn ||
    gs.rollN !== gsNew.rollN ||
    gs.rollGo !== gsNew.rollGo;
  // Must assign object after piece moves since
  // otherwise piece moves are skipped due to
  // guard clause in functions above
  Object.assign(gs, gsNew);
  gp.checkGameOver(true);
  if (gs.turn === 'over') return;
  ui.displayTurn(gs.turn);
  if (gs.phase === 'roll') {
    ui.replaceButton('roll-display', 'roll-button');
  } else if (rollResultChanged) {
    ui.displayRollResult(gs, true);
  }
  if (ai.control[gs.turn] && gs.phase !== 'roll') {
    ui.showButton('ok-ai-move');
  } else {
    ui.hideButton('ok-ai-move');
    if (gs.je) gp.startJumpEnter();
  }
  if (gs.turn === 'trex' && gs.phase === 'move') {
    if (gs.rollN) ui.showButton('ok-trex-move');
    else ui.showButton('ok-no-move');
  }
  ui.humanItemsClickable(gs.turn === 'human');
  ui.raptorItemsClickable(gs.turn === 'raptor');
}
async function endEditMode() {
  elements.banner.inert = true;
  anim.slide(elements.banner, 0, eTime);
  for (const element of elements.all) {
    if (element === elements.banner) continue;
    anim.fade(element, 0, eTime);
  }
  ui.hideButton('unroll-dice');
  edit.clear();
  dom.showMore.style.visibility = 'visible';
  await sleep(eTime);
}
ael(qjs('edit-revert'), 'mousedown', async () => {
  const {gsPrevious} = edit;
  await endEditMode();
  await editGame(gsPrevious);
});
ael(qjs('edit-confirm'), 'mousedown', async () => {
  await endEditMode();
  await editGame(gs);
  if (gs.turn !== 'human') gp.checkEatenByAnyRaptor();
  await autoSave.update(true);
});

// Used for editing both turn and dice
function replaceDieValue(species, type, value) {
  const name = `${species}-${type}`;
  const faces = Object.values(dom.faces[name]);
  for (const face of faces) {
    face.style.display = 'none';
  }
  if (type === 'movement') gs.rollN = value;
  else gs.rollGo = value;
  dom.faces[name][value].style.display = 'block';
  if (type === 'movement') {
    gs.je = value === 'Jump' || value === 'Enter';
  }
}

// Turn
ael(qjs('edit-turn'), 'mousedown', () => {
  const species = gp.nextTurnSpecies(true);
  gs.turn = species;
  ui.displayTurn(species, true);
  if (gs.phase === 'roll') return;
  if (species === 'trex') gs.phase = 'move';
  if (species === 'raptor') gs.phase = 'select';
  const d = dice[species];
  gs.rollN = d.movement[edit.dieCodes.movement];
  gs.rollGo = species === 'trex' ? 0 :
    d.continue[edit.dieCodes.continue];
  replaceDieValue(species, 'movement', gs.rollN);
  if (species !== 'trex') {
    replaceDieValue(species, 'continue', gs.rollGo);
  }
  for (const [key, die] of Object.entries(dom.dice)) {
    const [dieSpecies, ] = key.split('-');
    if (dieSpecies === species) {
      die.style.display = 'inline';
      die.classList.add('rolled', 'no-animation');
    } else {
      die.style.display = 'none';
      die.classList.remove('rolled', 'no-animation');
    }
  }
});

// Dice
function changeDie(species, type) {
  const die = dice[species][type];
  const current = die[edit.dieCodes[type]];
  while(die[edit.dieCodes[type]] === current) {
    edit.dieCodes[type]++;
  }
  if (die[edit.dieCodes[type]] === undefined) {
    edit.dieCodes[type] = 0;
  }
  const changed = die[edit.dieCodes[type]];
  replaceDieValue(species, type, changed);
}
for (const element of qda('edit-die')) {
  ael(element, 'mousedown', (e) => {
    const dieData = closestData(e);
    const [, species, type] = dieData.split('-');
    changeDie(species, type);
  });
}
ael(qjs('unroll-dice'), 'mousedown', () => {
  gp.clearRoll();
  const buttonsToHide = [
    'decline', 'ok-no-move', 'ok-trex-move',
    'roll-display', 'unroll-dice', 'cancel',
  ];
  edit.cancelSelection();
  for (const b of buttonsToHide) ui.hideButton(b);
  enableDiceEdit(false);
});
function dieCode(value, die) {
  if (value === null || !die) return 0;
  // Max to return 0 instead of -1 if not found
  return Math.max(die.lastIndexOf(value), 0);
}
function enableDiceEdit(enable = true) {
  for (const element of qda('edit-die')) {
    anim.fade(element, +enable, eTime);
  }
  if (!enable) return;
  ui.showButton('unroll-dice');
  edit.dieCodes.movement =
    dieCode(gs.rollN, dice[gs.turn].movement);
  edit.dieCodes.continue =
    dieCode(gs.rollGo, dice[gs.turn].continue);
};

// Hide edit controls
for (const element of elements.all) {
  element.style.display = 'none';
}
