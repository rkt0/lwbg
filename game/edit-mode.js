import {
  qjs, qd, qda, closestData, fromTemplate, click,
  sleep, deepCopy,
} from './utility.js';
import {gs} from './game-objects.js';
import {dom} from './dom.js';
import {dice} from './dice.js';
import {anim} from './animation.js';
import {ai} from './ai.js';
import {message} from './message.js';
import {sb} from './sidebar.js';
import {gp} from './gameplay.js';

export const edit = {
  bannerElement: qjs('edit-banner'),
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
    message.suppress = true;
    const hidden = [
      'roll-dice', 'decline',
      'ok-trex-move', 'ok-no-move', 'ok-ai-move',
    ];
    for (const x of hidden) await sb.hideButton(x);
    for (const element of trexButtons) {
      anim.fade(element, 1, eTime);
    }
    if (gs.turn === 'over') {
      anim.fade(dom.gameOver, 0, eTime);
    } else this.showEditTurnButton();
    if (gs.phase !== 'roll') enableDiceEdit();
    gp.humanItemsClickable(true);
    gp.raptorItemsClickable(true);
    await anim.slide(this.bannerElement, 1, eTime);
    this.bannerElement.inert = false;
    dom.showMore.style.visibility = 'hidden';
  },
  async cancelSelection() {
    gp.select();
    gp.humanItemsClickable(true);
    gp.raptorItemsClickable(true);
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
      sb.hideButton('cancel'),
      sleep(anim.time.moveHuman / 6),
    ]);
    this.selected = {species: null, piece: null};
    await sb.hideButton('cancel');
  },
  showEditTurnButton() {
    anim.fade(changeTurnButton, 1, eTime);
  },
  unrollDice() {
    gp.clearRoll();
    const buttonsToHide = [
      'decline', 'ok-no-move', 'ok-trex-move',
      'roll-display', 'unroll-dice', 'cancel',
    ];
    this.cancelSelection();
    for (const b of buttonsToHide) sb.hideButton(b);
    enableDiceEdit(false);
  },
  handleBannerClick(e) {
    const js = closestData(e);
    if (js === 'edit-revert') revertEdits();
    else if (js === 'edit-confirm') confirmEdits();
  },
  handleChange(change) {
    if (change === 'turn') return changeTurn();
    const [, species, type] = change.split('-');
    changeDie(species, type);
  },
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
  // Fix inappropriate T-rex turn state
  if (gs.turn === 'trex' && !gp.isTrexActive()) {
    gs.turn = 'raptor';
    gp.clearRoll();
    sb.replaceButton('roll-display', 'roll-dice');
  }
  sb.displayTurn(gs.turn);
  if (gs.phase === 'roll') {
    sb.replaceButton('roll-display', 'roll-dice');
  } else if (rollResultChanged) {
    sb.displayRollResult(gs, true);
  }
  if (ai.control[gs.turn] && gs.phase !== 'roll') {
    sb.showButton('ok-ai-move');
  } else {
    sb.hideButton('ok-ai-move');
    if (gs.je) gp.startJumpEnter();
  }
  if (gs.turn === 'trex' && gs.phase === 'move') {
    if (gs.rollN) sb.showButton('ok-trex-move');
    else sb.showButton('ok-no-move');
  }
  gp.humanItemsClickable(gs.turn === 'human');
  gp.raptorItemsClickable(gs.turn === 'raptor');
}
async function endEditMode() {
  edit.bannerElement.inert = true;
  anim.slide(edit.bannerElement, 0, eTime);
  for (const element of toFade) {
    anim.fade(element, 0, eTime);
  }
  sb.hideButton('unroll-dice');
  edit.clear();
  dom.showMore.style.visibility = 'visible';
  message.suppress = false;
  await sleep(eTime);
}
async function revertEdits() {
  const {gsPrevious} = edit;
  await endEditMode();
  await editGame(gsPrevious);
}
async function confirmEdits() {
  await endEditMode();
  await editGame(gs);
  await gp.save(true);
}

// Used for changing both turn and dice
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

// Change turn
function changeTurn() {
  const species = gp.nextTurnSpecies(true);
  gs.turn = species;
  sb.displayTurn(species, true);
  if (species !== 'human') gp.checkEatenByAnyRaptor();
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
}

// Change dice
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
function dieCode(value, die) {
  if (value === null || !die) return 0;
  // Max to return 0 instead of -1 if not found
  return Math.max(die.lastIndexOf(value), 0);
}
function enableDiceEdit(enable = true) {
  for (const element of changeButtons) {
    if (element === changeTurnButton) continue;
    anim.fade(element, +enable, eTime);
  }
  if (!enable) return;
  sb.showButton('unroll-dice');
  edit.dieCodes.movement =
    dieCode(gs.rollN, dice[gs.turn].movement);
  edit.dieCodes.continue =
    dieCode(gs.rollGo, dice[gs.turn].continue);
};

// Initialize buttons
const trexEdit = qjs('trex-edit');
const trexButtons = [];
for (const item of trexEdit.children) {
  const button = fromTemplate('trex-button', true);
  button.dataset.trexDelta = item.value;
  button.textContent = item.textContent;
  trexEdit.replaceChild(button, item);
  trexButtons.push(button);
}

// Animation time for edit control fade
const eTime = anim.time.editControlFade;

// Other element references
const changeButtons = qda('change');
const changeTurnButton = qd('change="turn"');
const toFade = [...trexButtons, ...changeButtons];
