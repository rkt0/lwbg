import {bd, dice} from './logic.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';

export const edit = {};

edit.clear = () => {
  edit.on = false;
  edit.gsPrevious = {};
  edit.selected = {species: null, piece: null};
  edit.dieCodes = {movement: 0, continue: 0};
};

// Banner
const editGame = gsNew => {
  gp.clearMoveObject();
  for (const [p, s] of gsNew.humans.entries()) {
    gp.relocatePiece('human', p, s);
  }
  gp.adjustHumanPositions();
  for (const [p, s] of gsNew.raptors.entries()) {
    gp.relocatePiece('raptor', p, s);
  }
  gp.relocatePiece('trex', null, gsNew.trex);
  // Must assign object after piece moves since
  // otherwise piece moves are skipped due to
  // guard clause in functions above
  Object.assign(gs, gsNew);
  gp.checkGameOver();
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
};
const endEditMode = () => {
  $('#cancel-edits, #confirm-edits')
    .prop('disabled', true);
  edit.clear();
  $('.selected').removeClass('selected');
  $('.edit-control, .wrapper, .edit-kill-human')
    .fadeOut(anim.time.editControlFade);
  ui.showButton('show-more');
  gp.checkGameOver(true);
};
$('#cancel-edits').click(() => {
  editGame(edit.gsPrevious);
  endEditMode();
});
$('#confirm-edits').click(() => {
  editGame(gs);
  endEditMode();
  autoSave.update(true);
});

// Used for editing both turn and dice
const replaceDieValue = (species, type, value) => {
  const cSel = `.face-${species}.face-${type}`;
  $(cSel).css('display', 'none');
  const x = type === 'movement' ? 'N' : 'Go';
  gs[`roll${x}`] = value;
  const aSel = `[data-roll="${value}"]`;
  $(`${cSel}${aSel}`).css('display', 'block');
  if (type === 'movement') {
    gs.je = value === 'Jump' || value === 'Enter';
  }
};

// Turn
$('#change-turn').click(() => {
  const species = gs.turn === 'trex' ? 'raptor' :
    gs.turn === 'raptor' ? 'human' :
    gp.nHumansOn(bd.humanStart) ? 'trex' :
    'raptor';
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
  $('.die').css('display', 'none')
    .removeClass('rolled no-animation');
  $(`.die-${species}`)
    .addClass('rolled no-animation')
    .css('display', 'inline');
  $('.wrapper').css('display', 'none');
  $(`.wrapper-${species}`).css('display', 'block');
});

// Dice
$('#unroll-dice').click(() => {
  gp.clearRoll();
  const idsToHide = [
    'decline-button', 'ok-no-move', 'ok-trex-move',
    'roll-display',
  ];
  for (const id of idsToHide) ui.hideButton(id);
  $('.edit-dice').fadeOut(anim.time.editControlFade);
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
    $(`#die-button-${s}-${t}`).click(() => {
      changeDie(s, t);
    });
  }
}

// T-rex
function makeTrexButtons() {
  const editTrexAdvance = () => {
    if (gs.trex === 0) return;
    gp.moveTrex(gs.trex - 1, false, true);
  };
  const editTrexRetreat = () => {
    if (gs.trex === bd.trexStart) return;
    gp.moveTrex(gs.trex + 1, false, true);
  };
  $('<button></button>').attr('type', 'button')
      .attr('id', 'edit-trex-advance')
      .addClass('edit-control small-button')
      .click(editTrexAdvance).appendTo('#trex-piece');
  $('<button></button>').attr('type', 'button')
      .attr('id', 'edit-trex-retreat')
      .addClass('edit-control small-button')
      .click(editTrexRetreat).appendTo('#trex-piece');
}

// Kill
function makeKillButtons() {
  const editKillHuman = () => {
    const piece = edit.selected.piece;
    gp.moveHuman(piece, bd.humanDead, false);
    $(`#human-piece-${piece} .edit-kill-human`)
        .fadeOut(anim.time.editControlFade);
    $('.selected').removeClass('selected');
    ui.raptorItemsClickable(true);
    edit.selected.species = null;
    edit.selected.piece = null;
  };
  $('<button></button>').attr('type', 'button')
      .addClass('edit-kill-human small-button')
      .click(e => {
        e.stopPropagation();
        editKillHuman();
      }).appendTo('.human-piece');
}

edit.makePieceControls = () => {
  makeTrexButtons();
  makeKillButtons();
};
