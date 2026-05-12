import {qs, qsa, click, isNull} from './utility.js';
import {bd} from './logic.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {sfx} from './sfx.js';
import {ui} from './functions-ui.js';
import {gs, mv, zd, pl} from './game-objects.js';

export const gp = {
  nHumansOn(space) {
    return gs.humans.filter(x => x === space).length;
  },
  nRaptorsOn(space) {
    return gs.raptors.filter(x => x === space).length;
  },
  checkGameOver(immediate) {
    const nSaved = gp.nHumansOn(bd.humanGoal);
    const nDead = gp.nHumansOn(bd.humanDead);
    const nTotal = gs.humans.length;
    if (nSaved + nDead < nTotal) return;
    gs.turn = 'over';
    // Set gs.phase to 'roll' so that 'over' state
    // is treated as state with nothing rolled
    gs.phase = 'roll';
    gp.save();
    setTimeout(
      () => {ui.showGameOver(nSaved, nTotal);},
      immediate ? 0 : anim.time.gameOverDelay
    );
  },
  adjustHumanPositions() {
    const bldgs = [...bd.bldgHumanSpaces];
    for (const space of [...bldgs, bd.humanDead]) {
      const occupants = hPiecesOn(space);
      if (!occupants.length) continue;
      const sep = pl.human.ps[0] + (
        space === bd.humanDead ? 0 : pl.human.margin
      );
      const offset = (occupants.length - 1) * sep / 2;
      for (const [i, p] of occupants.entries()) {
        const adj = sep * i - offset;
        const l = pl.human[space][0] + adj;
        const element = qs(`#human-piece-${p}`);
        const location = {left: `${l}px`};
        const aTime = anim.time.adjustHuman;
        anim.move(element, location, aTime);
      }
    }
  },
  clearMoveObject() {
    mv.selected = null;
    mv.plan = [];
    mv.toGo = gs.rollN;
  },
  clearRoll() {
    gs.rollN = null;
    gs.rollGo = 0;
    gs.phase = 'roll';
    gs.je = false;
    for (const face of qsa('.face')) {
      face.style.display = 'none';
    }
  },
  endTurn() {
    gp.clearMoveObject();
    if (gs.turn === 'human') {
      gp.adjustHumanPositions();
      if (!gs.rollGo) {
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
      gp.nHumansOn(bd.humanStart) ? 'trex' : 'raptor';
    gp.checkGameOver();
    startTurn(nextSpecies);
  },
  startJumpEnter() {
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
  },
  async moveHuman(piece, space, isLast) {
    if (gs.humans[piece] === space) return;
    const element = qs(`#human-piece-${piece}`);
    const isNowDead = space === bd.humanDead;
    element.classList.toggle('dead', isNowDead);
    // Piece location update needs to occur
    // here for checkGameOver() to work right
    gs.humans[piece] = space;
    const [l, t] = pl.human[space];
    const location = {top: `${t}px`, left: `${l}px`};
    let aTime = anim.time.moveHuman;
    if (isNowDead) aTime = anim.time.killHuman;
    else if (gs.je) aTime = anim.time.jumpHuman;
    await anim.move(element, location, aTime, {
      endDelay: isLast ? 0 : anim.time.pauseMidMove,
    });
    gp.adjustHumanPositions();
    if (isLast) gp.endTurn();
  },
  async moveRaptor(piece, space, isLast, silent) {
    const [l, t] = pl.raptor[space];
    if (!sfx.raptorAlreadyPlayed && !silent) {
      // Sound effect should play only if raptor is
      // eating a human on this move or is moving
      // close enough to do so on its next move
      const maxN = ai.maxN.raptor;
      const {move, enter} = ai.raptorHumanDistance({
        raptors: [space], humans: gs.humans,
      });
      const dm = Math.min(...move[0]);
      const de = Math.min(...enter[0]);
      if (dm <= maxN || de === 1) sfx.raptor();
    }
    const element = qs(`#raptor-piece-${piece}`);
    const location = {top: `${t}px`, left: `${l}px`};
    const aTime = anim.time.moveRaptor;
    await anim.move(element, location, aTime, {
      endDelay: isLast ? 0 : anim.time.pauseMidMove,
    });
    // Piece location update needs to occur
    // here for checkEatenByRaptor(piece)
    // to work right
    gs.raptors[piece] = space;
    checkEatenByRaptor(piece);
    if (isLast || silent) {
      sfx.raptorAlreadyPlayed = false;
    }
    if (isLast) gp.endTurn();
  },
  async moveTrex(space, isLast, skipFx) {
    const [l, t] = pl.trex[space];
    if (! skipFx) {
      const sound = gs.trex === 1 ? 'Roar' : 'Stomp';
      sfx[`trex${sound}`]();
    }
    const element = qs('#trex-piece');
    const location = {top: `${t}px`, left: `${l}px`};
    const aTime = anim.time.moveTrex;
    await anim.move(element, location, aTime);
    if (!skipFx) {
      const settings = anim.trexScreenBounce;
      anim.bounce('#gameplay-container', settings);
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
  },
  async relocatePiece(species, piece, space) {
    let element;
    if (species === 'trex') {
      if (gs.trex === space) return;
      gs.trex = space;
      element = qs('#trex-piece');
    } else {
      if (gs[`${species}s`][piece] === space) return;
      gs[`${species}s`][piece] = space;
      element = qs(`#${species}-piece-${piece}`);
    }
    if (species === 'human') {
      const isNowDead = space === bd.humanDead;
      element.classList.toggle('dead', isNowDead);
    }
    const [l, t] = pl[species][space];
    const location = {top: `${t}px`, left: `${l}px`};
    await anim.move(element, location, 0);
  },
  setSaveFunction(fn) {
    gp.save = fn;
  },
  async initializeObjects() {
    gp.clearMoveObject();
    gs.turn = null;
    gs.phase = 'roll';
    gs.je = false;
    gs.rollN = null;
    gs.rollGo = 0;
    const {
      humanStart, trexStart, raptorStart,
      nHumanPieces: nHumans,
    } = bd;
    if (!gs.humans) {
      gs.humans = new Array(nHumans).fill(humanStart);
      gs.trex = trexStart;
      gs.raptors = [...raptorStart];
      return;
    }
    // If playing again, relocate pieces instead
    for (let h = 0; h < nHumans; h++) {
      await gp.relocatePiece('human', h, humanStart);
    }
    gp.adjustHumanPositions();
    await gp.relocatePiece('trex', null, trexStart);
    for (const [r, s] of raptorStart.entries()) {
      await gp.relocatePiece('raptor', r, s);
    }
  },
  initializeView(resetZoom = true) {
    if (resetZoom) click('#zoom-default');
    zd.center.left = zd.initialViewCenter[0];
    zd.center.top = zd.initialViewCenter[1];
    zd.factor.current = null;
    // Click again to apply zoom center
    if (resetZoom) click('#zoom-default');
  },
};

function hPiecesOn(space) {
  return gs.humans.flatMap(
    (s, p) => s === space ? p : []
  );
}
function checkEatenByRaptor(rPiece) {
  const rLoc = gs.raptors[rPiece];
  const hsIn = bd.humanSpacesInRaptorSpace[rLoc];
  for (const [hp, hs] of gs.humans.entries()) {
    if (!hsIn.includes(hs)) continue;
    gp.moveHuman(hp, bd.humanDead, false);
    ui.showMessage('eaten-raptor', true);
  }
}
function startTurn(species) {
  if (gs.turn === 'over') return;
  gs.turn = species;
  gp.clearRoll();
  ui.replaceButton('roll-display', 'roll-button');
  ui.displayTurn(species);
  ui.humanItemsClickable(species === 'human');
  ui.raptorItemsClickable(species === 'raptor');
  gp.save();
}
