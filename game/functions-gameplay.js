import {isNull} from './utility.js';
import {bd} from './logic.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {sfx} from './sfx.js';
import {ui} from './functions-ui.js';
import {gs, mv, pl} from './game-objects.js';

// gp - Container object for gameplay functions
export const gp = {};

// gp - Number of pieces on a space
{
  gp.nHumansOn = space => {
    return gs.humans.filter(x => x === space).length;
  };
  gp.nRaptorsOn = space => {
    return gs.raptors.filter(x => x === space).length;
  };
}

// gp - Move pieces, start/end turns/phases
{
  gp.checkGameOver = (immediate) => {
    const nSaved = gp.nHumansOn(bd.humanGoal);
    const nDead = gp.nHumansOn(bd.humanDead);
    const nTotal = gs.humans.length;
    if (nSaved + nDead < nTotal) return;
    gs.turn = 'over';
    // Set gs.phase to 'roll' so that 'over' state
    //   is treated as state with nothing rolled
    gs.phase = 'roll';
    gp.save();
    setTimeout(
      () => ui.showGameOver(nSaved, nTotal),
      immediate ? 0 : anim.time.gameOverDelay
    );
  };
  const hPiecesOn = space => {
    return gs.humans.flatMap(
      (s, p) => s === space ? p : []
    );
  };
  gp.adjustHumanPositions = () => {
    const bldgs = [...bd.bldgHumanSpaces];
    for (const space of [...bldgs, bd.humanDead]) {
      const occupants = hPiecesOn(space);
      if (! occupants.length) continue;
      const sep = pl.human.ps[0] + (
        space === bd.humanDead ? 0 : pl.human.margin
      );
      const offset = (occupants.length - 1) * sep / 2;
      for (const [i, p] of occupants.entries()) {
        const adj = sep * i - offset;
        const l = pl.human[space][0] + adj;
        $(`#human-piece-${p}`).animate(
          {left: `${l}px`}, anim.time.adjustHuman
        );
      }
    }
  };
  const checkEatenByRaptor = rPiece => {
    const rLoc = gs.raptors[rPiece];
    const hsIn = bd.humanSpacesInRaptorSpace[rLoc];
    for (const [hp, hs] of gs.humans.entries()) {
      if (! hsIn.includes(hs)) continue;
      gp.moveHuman(hp, bd.humanDead, false);
      ui.showMessage('eaten-raptor', true);
    }
  };
  const startTurn = species => {
    if (gs.turn === 'over') return;
    gs.turn = species;
    gp.clearRoll();
    ui.replaceButton('roll-display', 'roll-button');
    ui.displayTurn(species);
    ui.humanItemsClickable(species === 'human');
    ui.raptorItemsClickable(species === 'raptor');
    gp.save();
  };
  gp.clearMoveObject = () => {
    mv.selected = null;
    mv.plan = [];
    mv.toGo = gs.rollN;
  };
  gp.clearRoll = () => {
    gs.rollN = null;
    gs.rollGo = 0;
    gs.phase = 'roll';
    gs.je = false;
    $('.face').css('display', 'none');
  };
  gp.endTurn = () => {
    gp.clearMoveObject();
    if (gs.turn === 'human') {
      gp.adjustHumanPositions();
      if (! gs.rollGo) {
        for (let r = 0; r < gs.raptors.length; r++) {
          checkEatenByRaptor(r);
        }
      }
    }
    const isHumanNextish = gs.turn === 'human' ?
        gs.rollGo : ! gs.rollGo;
    const nextSpecies =
        isNull(gs.turn) ? bd.firstTurn :
        gs.turn === 'trex' ? 'raptor' :
        isHumanNextish ? 'human' :
        gp.nHumansOn(bd.humanStart) ? 'trex' :
            'raptor';
    gp.checkGameOver();
    startTurn(nextSpecies);
  };
  gp.startJumpEnter = () => {
    const [jeArr, nOnFn] = gs.turn === 'human' ?
        [bd.humanJumps, gp.nHumansOn] :
        [bd.raptorEntrances, gp.nRaptorsOn];
    let nChoices = 0;
    for (const s of jeArr) nChoices += nOnFn(s[0]);
    if (nChoices) {
      mv.toGo = 1;
      ui.showButton('decline-button');
    } else {
      ui.showMessage(`no-${
        gs.turn === 'human' ? 'jump' : 'enter'
      }-available`, true);
      mv.toGo = -1;
      ui.showButton('ok-no-move');
    }
  };
  gp.moveHuman = (piece, space, isLast) => {
    if (gs.humans[piece] === space) return;
    const $p = $(`#human-piece-${piece}`);
    $p.removeClass('dead');
    if (space === bd.humanDead) $p.addClass('dead');
    // Piece location update needs to occur
    //   here for checkGameOver() to work right
    gs.humans[piece] = space;
    const [l, t] = pl.human[space];
    const at = anim.time;
    $p.animate(
      {top: `${t}px`, left: `${l}px`},
      space === bd.humanDead ? at.killHuman :
          gs.je ? at.jumpHuman : at.moveHuman,
      () => {
        gp.adjustHumanPositions();
        if (isLast) gp.endTurn();
      }
    );
  };
  gp.moveRaptor = (piece, space, isLast, silent) => {
    const [l, t] = pl.raptor[space];
    if (!sfx.raptorAlreadyPlayed && !silent) {
      // Sound effect should play only if raptor is
      //   eating a human on this move or is moving
      //   close enough to do so on its next move
      const maxN = ai.maxN.raptor;
      const {move, enter} = ai.raptorHumanDistance({
        raptors: [space], humans: gs.humans,
      });
      const dm = Math.min(...move[0]);
      const de = Math.min(...enter[0]);
      if (dm <= maxN || de === 1) sfx.raptor();
    }
    $(`#raptor-piece-${piece}`).animate(
      {top: `${t}px`, left: `${l}px`},
      anim.time.moveRaptor,
      () =>  {
        // Piece location update needs to occur
        //   here for checkEatenByRaptor(piece)
        //   to work right
        gs.raptors[piece] = space;
        checkEatenByRaptor(piece);
        if (isLast || silent) {
          sfx.raptorAlreadyPlayed = false;
        }
        if (isLast) gp.endTurn();
      }
    );
  };
  gp.moveTrex = (space, isLast, skipFx) => {
    const [l, t] = pl.trex[space];
    if (! skipFx) {
      const sound = gs.trex === 1 ? 'Roar' : 'Stomp';
      sfx[`trex${sound}`]();
    }
    $('#trex-piece').animate(
      {top: `${t}px`, left: `${l}px`},
      anim.time.moveTrex,
      () => {
        if (! skipFx) {
          $('#gameplay-container').effect('bounce', {
            duration: anim.time.trexScreenBounce,
            distance: 36,
            times: 6,
          });
        }
        gs.trex = space;
        if (gs.trex === 0) {
          for (const h of hPiecesOn(bd.humanStart)) {
            gp.moveHuman(h, bd.humanDead, false);
            ui.showMessage('eaten-trex', true);
          }
        }
        // Using isLast here too enables reuse of this
        // function for edit/load purposes
        if (isLast) gp.endTurn();
      }
    );
  };
}

// Relocate pieces (used for edit/load, not gameplay)
{
  gp.relocatePiece = (species, piece, space) => {
    let $p;
    if (species === 'trex') {
      if (gs.trex === space) return;
      gs.trex = space;
      $p = $('#trex-piece');
    } else {
      if (gs[`${species}s`][piece] === space) return;
      gs[`${species}s`][piece] = space;
      $p = $(`#${species}-piece-${piece}`);
    }
    if (species === 'human') {
      $p.toggleClass('dead', space === bd.humanDead);
    }
    const [l, t] = pl[species][space];
    $p.css({top: `${t}px`, left: `${l}px`});
  };
}

// Set function for auto-save update
// (done this way to eliminate circular dependency)
{
  gp.setSaveFunction = (fn) => {gp.save = fn;};
}
