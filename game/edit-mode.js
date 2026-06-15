import {
  qjs, qs, qsa, ael, click, deepCopy,
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
    this.selected = {species: null, piece: null};
    this.dieCodes = {movement: 0, continue: 0};
  },
  begin() {
    if (gs.turn !== 'trex' && gs.turn !== 'over') {
      click(qjs('cancel'));
    }
    this.on = true;
    this.gsPrevious = deepCopy(gs);
    message.hide();
    dom.showMore.style.visibility = 'hidden';
    const hidden = [
      'roll-button', 'decline',
      'ok-trex-move', 'ok-no-move', 'ok-ai-move',
    ];
    for (const x of hidden) ui.hideButton(x);
    const universalControls =
      '.edit-only:not(.edit-dice):not(.edit-turn)';
    for (const element of qsa(universalControls)) {
      anim.fade(element, 1, eTime);
    }
    if (gs.turn === 'over') {
      anim.fade(dom.gameOver, 0, eTime);
    } else anim.fade('.edit-turn', 1, eTime);
    if (gs.phase !== 'roll') enableDiceEdit();
    ui.humanItemsClickable(true);
    ui.raptorItemsClickable(true);
    qs('#cancel-edits').disabled = false;
    qs('#confirm-edits').disabled = false;
  },
};

// Animation time for edit control fade
const eTime = anim.time.editControlFade;

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
  // Must assign object after piece moves since
  // otherwise piece moves are skipped due to
  // guard clause in functions above
  Object.assign(gs, gsNew);
  gp.checkGameOver(true);
  if (gs.turn === 'over') return;
  ui.displayTurn(gs.turn);
  if (gs.phase === 'roll') {
    ui.replaceButton('roll-display', 'roll-button');
  } else ui.displayRollResult(gs, true);
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
function endEditMode() {
  qs('#cancel-edits').disabled = true;
  qs('#confirm-edits').disabled = true;
  edit.clear();
  qs('.selected')?.classList.remove('selected');
  for (const element of qsa('.edit-only, .kill')) {
    anim.fade(element, 0, anim.time.editControlFade);
  }
  dom.showMore.style.visibility = 'visible';
}
ael('#cancel-edits', 'mousedown', async () => {
  await editGame(edit.gsPrevious);
  endEditMode();
});
ael('#confirm-edits', 'mousedown', async () => {
  await editGame(gs);
  endEditMode();
  if (gs.turn !== 'human') gp.checkEatenByAnyRaptor();
  await autoSave.update(true);
});

// Used for editing both turn and dice
function replaceDieValue(species, type, value) {
  const die = qs(`.die-${species}.die-${type}`);
  for (const face of qsa('.face', die)) {
    face.style.display = 'none';
  }
  if (type === 'movement') gs.rollN = value;
  else gs.rollGo = value;
  const face = qs(`[data-roll="${value}"]`, die);
  face.style.display = 'block';
  if (type === 'movement') {
    gs.je = value === 'Jump' || value === 'Enter';
  }
}

// Turn
ael('#change-turn', 'mousedown', () => {
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
  for (const die of qsa('.die')) {
    die.style.display = 'none';
    die.classList.remove('rolled', 'no-animation');
  }
  for (const die of qsa(`.die-${species}`)) {
    die.style.display = 'inline';
    die.classList.add('rolled', 'no-animation');
  }
  for (const wrapper of qsa('.wrapper')) {
    wrapper.style.display = 'none';
  }
  for (const wrapper of qsa(`.wrapper-${species}`)) {
    wrapper.style.display = 'block';
  }
});

// Dice
ael('#unroll-dice', 'mousedown', () => {
  gp.clearRoll();
  const buttonsToHide = [
    'decline', 'ok-no-move', 'ok-trex-move',
    'roll-display',
  ];
  for (const b of buttonsToHide) ui.hideButton(b);
  for (const element of qsa('.edit-dice')) {
    anim.fade(element, 0, anim.time.editControlFade);
  }
});
const changeDie = (species, type) => {
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
};
for (const s of Object.keys(dice)) {
  for (const t of Object.keys(dice[s])) {
    ael(`#die-button-${s}-${t}`, 'mousedown', () => {
      changeDie(s, t);
    });
  }
}
function dieCode(value, die) {
  if (value === null || !die) return 0;
  // Max to return 0 instead of -1 if not found
  return Math.max(die.lastIndexOf(value), 0);
}
function enableDiceEdit() {
  for (const element of qsa('.edit-dice')) {
    anim.fade(element, 1, eTime);
  }
  const onClass = `wrapper-${gs.turn}`;
  for (const wrapper of qsa('.wrapper')) {
    const isOn = wrapper.classList.contains(onClass);
    wrapper.style.display = isOn ? 'block' : 'none';
  }
  edit.dieCodes.movement =
    dieCode(gs.rollN, dice[gs.turn].movement);
  edit.dieCodes.continue =
    dieCode(gs.rollGo, dice[gs.turn].continue);
};
