import {qjs, click} from './utility.js';
import {bd} from './board-topology.js';
import {geom} from './board-geometry.js';
import {gs, mv, pl} from './game-objects.js';
import {dom} from './dom.js';
import {zoom} from './zoom.js';
import {anim} from './animation.js';
import {ai} from './ai.js';
import {message} from './message.js';
import {sfx} from './sfx.js';
import {sb} from './sidebar.js';

export const gp = {
  nHumansOn(space) {
    return gs.humans.filter(x => x === space).length;
  },
  nRaptorsOn(space) {
    return gs.raptors.filter(x => x === space).length;
  },
  async checkGameOver(immediate) {
    const nSaved = this.nHumansOn(bd.humanGoal);
    const nDead = this.nHumansOn(bd.humanDead);
    const nTotal = gs.humans.length;
    if (nSaved + nDead < nTotal) return;
    gs.turn = 'over';
    // Treat 'over' state as if nothing rolled
    this.clearRoll();
    await this.save();
    setTimeout(() => {
      qjs('humans-saved').textContent = nSaved;
      qjs('humans-total').textContent = nTotal;
      message.hide();
      sb.hideButton('roll-display');
      sb.hideButton('turn-display');
      if (zoom.factorCurrent < 1) return;
      anim.fade(dom.gameOver, 1, anim.time.menuFade, {
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
        const location = {left: `${l}px`};
        const aTime = anim.time.adjustHuman;
        anim.move(dom.humanPiece[p], location, aTime);
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
  },
  isTrexActive() {
    return this.nHumansOn(bd.humanStart) > 0;
  },
  nextTurnSpecies(forceStop) {
    if (!gs.turn) return bd.firstTurn;
    if (gs.turn === 'trex') return 'raptor';
    const stop = forceStop ?? !gs.rollGo;
    const firstDino = this.isTrexActive() ?
      'trex' : 'raptor';
    if (gs.turn === 'human') {
      return stop ? firstDino : 'human';
    }
    return stop ? 'human' : firstDino;
  },
  async endTurn() {
    this.clearMoveObject();
    if (gs.turn === 'human') {
      this.adjustHumanPositions();
    }
    await this.checkGameOver();
    await startNextTurn();
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
      sb.showButton('decline');
    } else {
      message.show(`no-${which}-available`);
      mv.toGo = -1;
      sb.showButton('ok-no-move');
    }
  },
  async moveHuman(piece, space, isLast) {
    if (gs.humans[piece] === space) return;
    const element = dom.humanPiece[piece];
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
      delay: isNowDead ? anim.time.killHumanDelay : 0,
    });
    this.adjustHumanPositions();
    // Only relevant in edit mode
    this.checkEatenByAnyRaptor();
    if (isLast) await this.endTurn();
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
    const element = dom.raptorPiece[piece];
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
    if (isLast) await this.endTurn();
  },
  async moveTrex(space, isLast, skipFx) {
    const [l, t] = pl.trex[space];
    if (!skipFx) {
      if (gs.trex === 1) sfx.trexRoar();
      else sfx.trexStomp();
    }
    const location = {top: `${t}px`, left: `${l}px`};
    const aTime = anim.time.moveTrex;
    await anim.move(dom.trexPiece, location, aTime);
    if (!skipFx) {
      const settings = anim.trexScreenBounce;
      anim.bounce(dom.gameplay, settings);
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
    if (isLast) await this.endTurn();
  },
  async relocatePiece(species, piece, space) {
    let element;
    if (species === 'trex') {
      if (gs.trex === space) return;
      gs.trex = space;
      element = dom.trexPiece;
    } else {
      if (gs[`${species}s`][piece] === space) return;
      gs[`${species}s`][piece] = space;
      element = dom[`${species}Piece`][piece];
    }
    if (species === 'human') {
      const isNowDead = space === bd.humanDead;
      element.classList.toggle('dead', isNowDead);
    }
    const [l, t] = pl[species][space];
    const location = {top: `${t}px`, left: `${l}px`};
    await anim.move(element, location, 0);
  },
  checkEatenByAnyRaptor() {
    for (let r = 0; r < gs.raptors.length; r++) {
      checkEatenByRaptor(r);
    }
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
    zoom.zoomDefault();
    zoom.center.left = geom.initialViewCenter[0];
    zoom.center.top = geom.initialViewCenter[1];
    zoom.factorCurrent = null;
    // Call again to apply zoom center
    zoom.zoomDefault();
  },
  interrupt(time = anim.time.menuFade) {
    document.body.style.overflow = 'hidden';
    anim.fade(scrim, 1, time);
  },
  resume(time = anim.time.menuFade) {
    anim.fade(scrim, 0, time);
    document.body.style.overflow = 'visible';
  },
  isActive() {
    const {display} = dom.gameplay.style;
    if (display !== 'block') return false;
    return scrim.style.display !== 'block';
  },
  async handleControlChange() {
    if (!ai.control.changed) return;
    await this.save();
    if (ai.control[gs.turn] && gs.phase !== 'roll') {
      click(qjs('cancel'));
      sb.hideButton('ok-no-move');
      sb.hideButton('decline');
      sb.showButton('ok-ai-move');
    } else {
      sb.hideButton('ok-ai-move');
      if (gs.je) this.startJumpEnter();
    }
  },
  select(element = null, elementOn = null) {
    dom.selected?.classList.remove('selected');
    dom.onSelected?.classList.remove('on-selected');
    dom.selected = element;
    dom.onSelected = elementOn;
    dom.selected?.classList.add('selected');
    dom.onSelected?.classList.add('on-selected');
  },
  humanItemsClickable(clickable) {
    const value = clickable ? 'auto' : 'none';
    humanClickableItems ??= [
      ...dom.humanSpace, ...dom.humanPiece,
    ];
    for (const item of humanClickableItems) {
      if (!item.classList.contains('building')) {
        item.style.pointerEvents = value;
      }
    }
  },
  raptorItemsClickable(clickable) {
    dom.board.style.pointerEvents =
      clickable ? 'visibleFill' : 'none';
    const valuePieces = clickable ? 'auto' : 'none';
    for (const element of dom.raptorPiece) {
      element.style.pointerEvents = valuePieces;
    }
  },
  // async save() injected by auto-save.js
};

// Initialize on first use; elements do not exist yet
let humanClickableItems;

// Element references
const scrim = qjs('scrim');

// Helper functions
function hPiecesOn(space) {
  return gs.humans.flatMap(
    (s, p) => s === space ? p : []
  );
}
function checkEatenByRaptor(rPiece) {
  if (gs.turn === 'human' || gs.turn === 'over') {
    return;
  }
  const rLoc = gs.raptors[rPiece];
  const hsIn = bd.humanSpacesInRaptorSpace[rLoc];
  for (const [hp, hs] of gs.humans.entries()) {
    if (!hsIn.includes(hs)) continue;
    gp.moveHuman(hp, bd.humanDead, false);
    message.show('eaten-raptor', true);
  }
}
async function startNextTurn() {
  const species = gp.nextTurnSpecies();
  gs.turn = species;
  gp.checkEatenByAnyRaptor();
  await gp.checkGameOver();
  if (gs.turn === 'over') return;
  gp.clearRoll();
  sb.replaceButton('roll-display', 'roll-dice');
  sb.displayTurn(species);
  gp.humanItemsClickable(species === 'human');
  gp.raptorItemsClickable(species === 'raptor');
  await gp.save();
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
