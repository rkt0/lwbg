import {qs, qsa, click} from './utility.js';
import {bd} from './board-topology.js';
import {geom} from './board-geometry.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {sfx} from './sfx.js';
import {ui} from './functions-ui.js';
import {gs, mv, zd, pl} from './game-objects.js';
import {message} from './message.js';

export const gp = {
  nHumansOn(space) {
    return gs.humans.filter(x => x === space).length;
  },
  nRaptorsOn(space) {
    return gs.raptors.filter(x => x === space).length;
  },
  checkGameOver(immediate) {
    const nSaved = this.nHumansOn(bd.humanGoal);
    const nDead = this.nHumansOn(bd.humanDead);
    const nTotal = gs.humans.length;
    if (nSaved + nDead < nTotal) return;
    gs.turn = 'over';
    // Set gs.phase to 'roll' so that 'over' state
    // is treated as state with nothing rolled
    gs.phase = 'roll';
    this.save();
    setTimeout(() => {
      qs('#humans-saved').innerHTML = nSaved;
      qs('#humans-total').innerHTML = nTotal;
      message.hide();
      ui.hideButton('roll-display');
      ui.hideButton('turn-display');
      if (zd.factor.current < 1) return;
      anim.fade('#game-over', 1, anim.time.menuFade, {
        display: '',
      });
    }, immediate ? 0 : anim.time.gameOverDelay);
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
  nextTurnSpecies(forceStop) {
    if (!gs.turn) return bd.firstTurn;
    if (gs.turn === 'trex') return 'raptor';
    const stop = forceStop ?? !gs.rollGo;
    const nOnStart = this.nHumansOn(bd.humanStart);
    if (gs.turn === 'human') {
      if (stop) return nOnStart ? 'trex' : 'raptor';
      return 'human';
    }
    if (stop) return 'human';
    return nOnStart ? 'trex' : 'raptor';
  },
  endTurn() {
    this.clearMoveObject();
    if (gs.turn === 'human') {
      this.adjustHumanPositions();
      if (!gs.rollGo) {
        for (let r = 0; r < gs.raptors.length; r++) {
          checkEatenByRaptor(r);
        }
      }
    }
    this.checkGameOver();
    startNextTurn();
  },
  startJumpEnter() {
    let nChoices = 0;
    let which = 'jump';
    if (gs.turn === 'human') {
      for (const jump of bd.humanJumps) {
        nChoices += this.nHumansOn(jump[0]);
      }
    } else {
      for (const entrance of bd.raptorEntrances) {
        nChoices += this.nRaptorsOn(entrance[0]);
      }
      which = 'enter';
    }
    if (nChoices) {
      mv.toGo = 1;
      ui.showButton('decline-button');
    } else {
      message.show(`no-${which}-available`, true);
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
    this.adjustHumanPositions();
    if (isLast) this.endTurn();
  },
  async moveRaptor(piece, space, isLast, silent) {
    const [l, t] = pl.raptor[space];
    if (!silent) {
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
    if (isLast) this.endTurn();
  },
  async moveTrex(space, isLast, skipFx) {
    const [l, t] = pl.trex[space];
    if (!skipFx) {
      if (gs.trex === 1) sfx.trexRoar();
      else sfx.trexStomp();
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
        this.moveHuman(h, bd.humanDead, false);
        message.show('eaten-trex', true);
      }
    }
    // Using isLast here too enables reuse of this
    // function for edit/load purposes
    if (isLast) this.endTurn();
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
  async initializeObjects() {
    this.clearMoveObject();
    gs.turn = null;
    gs.phase = 'roll';
    gs.je = false;
    gs.rollN = null;
    gs.rollGo = 0;
    await resetPieces();
  },
  initializeView() {
    click('#zoom-default');
    zd.center.left = geom.initialViewCenter[0];
    zd.center.top = geom.initialViewCenter[1];
    zd.factor.current = null;
    // Click again to apply zoom center
    click('#zoom-default');
  },
  interrupt(time = anim.time.menuFade) {
    document.body.style.overflow = 'hidden';
    anim.fade(scrim, 1, time);
  },
  resume(time = anim.time.menuFade) {
    anim.fade(scrim, 0, time);
    document.body.style.overflow = 'visible';
  },
  // save() injected by auto-save.js
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
    message.show('eaten-raptor', true);
  }
}
function startNextTurn() {
  const species = gp.nextTurnSpecies();
  if (gs.turn === 'over') return;
  gs.turn = species;
  gp.clearRoll();
  ui.replaceButton('roll-display', 'roll-button');
  ui.displayTurn(species);
  ui.humanItemsClickable(species === 'human');
  ui.raptorItemsClickable(species === 'raptor');
  gp.save();
}
async function resetPieces() {
  for (let h = 0; h < bd.nHumanPieces; h++) {
    gs.humans[h] = null;
    await gp.relocatePiece('human', h, bd.humanStart);
  }
  gp.adjustHumanPositions();
  gs.trex = null;
  await gp.relocatePiece('trex', null, bd.trexStart);
  for (const [r, s] of bd.raptorStart.entries()) {
    gs.raptors[r] = null;
    await gp.relocatePiece('raptor', r, s);
  }
}
const scrim = qs('#gameplay-container .scrim');
