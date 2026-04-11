'use strict';

const gp = {
  nHumansOn(space) {
    return gs.humans.filter(x => x === space).length;
  },
  nRaptorsOn(space) {
    return gs.raptors.filter(x => x === space).length;
  },
  checkGameOver() {
    const g = bd.humanGoal;
    const d = bd.humanDead;
    if (gs.humans.every(x => x === g || x === d)) {
      gs.turn = 'over';
      // Set gs.phase to 'roll' so that 'over' state
      // is treated as state with nothing rolled
      gs.phase = 'roll';
      autoSave.update();
      setTimeout(
        ui.showGameOver, anim.time.gameOverDelay
      );
    }
  },
  hPiecesOn(space) {
    return gs.humans.flatMap(
      (s, p) => s === space ? p : []
    );
  },
  adjustHumanPositions() {
    const bldgs = [...bd.bldgHumanSpaces];
    for (const space of [...bldgs, bd.humanDead]) {
      const occupants = this.hPiecesOn(space);
      if (!occupants.length) continue;
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
  },
  checkEatenByRaptor(rPiece) {
    const rLoc = gs.raptors[rPiece];
    const hsIn = bd.humanSpacesInRaptorSpace[rLoc];
    for (const [hp, hs] of gs.humans.entries()) {
      if (!hsIn.includes(hs)) continue;
      this.moveHuman(hp, bd.humanDead, false);
      const m = "Human eaten by raptor!";
      ui.showMessage(m, true);
    }
  },
  startTurn(species) {
    if (gs.turn === 'over') return;
    gs.turn = species;
    this.clearRoll();
    ui.replaceButton('roll-display', 'roll-button');
    ui.displayTurn(species);
    ui.humanItemsClickable(species === 'human');
    ui.raptorItemsClickable(species === 'raptor');
    autoSave.update();
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
    $('.face').css('display', 'none');
  },
  endTurn() {
    this.clearMoveObject();
    if (gs.turn === 'human') {
      this.adjustHumanPositions();
      if (!gs.rollGo) {
        for (let r = 0; r < gs.raptors.length; r++) {
          this.checkEatenByRaptor(r);
        }
      }
    }
    const isHumanNextish = gs.turn === 'human' ?
      gs.rollGo : ! gs.rollGo;
    const nextSpecies =
      isNull(gs.turn) ? bd.firstTurn :
      gs.turn === 'trex' ? 'raptor' :
      isHumanNextish ? 'human' :
      this.nHumansOn(bd.humanStart) ? 'trex' :
      'raptor';
    this.checkGameOver();
    this.startTurn(nextSpecies);
  },
  startJumpEnter() {
    const [jeArr, nOnFn] = gs.turn === 'human' ?
      [bd.humanJumps, this.nHumansOn] :
      [bd.raptorEntrances, this.nRaptorsOn];
    let nChoices = 0;
    for (const s of jeArr) nChoices += nOnFn(s[0]);
    if (nChoices) {
      mv.toGo = 1;
      ui.showButton('decline-button');
    } else {
      let m = `No ${gs.turn} is in position to `;
      m += gs.turn === 'human' ?
        'jump' : 'enter a building';
      m += ".<br>Click 'OK' to continue.";
      ui.showMessage(m, true);
      mv.toGo = -1;
      ui.showButton('ok-no-move');
    }
  },
  moveHuman(piece, space, isLast) {
    if (gs.humans[piece] === space) return;
    const $p = $(`#human-piece-${piece}`);
    $p.removeClass('dead');
    if (space === bd.humanDead) $p.addClass('dead');
    // Piece location update needs to occur
    // here for checkGameOver() to work right
    gs.humans[piece] = space;
    const [l, t] = pl.human[space];
    const at = anim.time;
    const actionAfter = () => {
      this.adjustHumanPositions();
      if (isLast) this.endTurn();
    };
    $p.animate(
      {top: `${t}px`, left: `${l}px`},
      space === bd.humanDead ? at.killHuman :
        gs.je ? at.jumpHuman : at.moveHuman,
      actionAfter
    );
  },
  moveRaptor(piece, space, isLast) {
    const [l, t] = pl.raptor[space];
    if (!sfx.raptorAlreadyPlayed) {
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
    $(`#raptor-piece-${piece}`).animate(
      {top: `${t}px`, left: `${l}px`},
      anim.time.moveRaptor,
      () =>  {
        // Piece location update needs to occur here
        // for checkEatenByRaptor to work right
        gs.raptors[piece] = space;
        this.checkEatenByRaptor(piece);
        if (isLast) {
          sfx.raptorAlreadyPlayed = false;
          this.endTurn();
        }
      }
    );
  },
  moveTrex(space, isLast, skipFx) {
    const [l, t] = pl.trex[space];
    if (!skipFx) {
      const sound = gs.trex === 1 ? 'Roar' : 'Stomp';
      sfx[`trex${sound}`]();
    }
    $('#trex-piece').animate(
      {top: `${t}px`, left: `${l}px`},
      anim.time.moveTrex,
      () => {
        if (!skipFx) {
          $('#gameplay-container').effect('bounce', {
            duration: anim.time.trexScreenBounce,
            distance: 36,
            times: 6,
          });
        }
        gs.trex = space;
        if (gs.trex === 0) {
          const kill = this.hPiecesOn(bd.humanStart);
          for (const h of kill) {
            this.moveHuman(h, bd.humanDead, false);
            const m = "Human eaten by T-rex!";
            ui.showMessage(m, true);
          }
        }
        // Using isLast here too enables reuse of this
        // function for edit/load purposes
        if (isLast) this.endTurn();
      }
    );
  },
};
