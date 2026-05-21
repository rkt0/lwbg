import {
  qs, qsa, ael, click, rollDie, windowWH,
} from './utility.js';
import {prng} from './prngs.js';
import {dice} from './dice.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv, zd} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {message} from './message.js';
import {bringMoveIntoView} from './view-region.js';

// Set display to none on dormant elements
for (const element of qsa('.dormant')) {
  element.style.display = 'none';
}

// Initialize dormant elements in gameplay menu
for (const button of qsa('#gameplay-menu .dormant')) {
  ui.hideButton(button.id);
}

// Disable menus that should be inactive at start
ui.disableMenu('player-control');
ui.disableMenu('more-options');
ui.disableMenu('quit-options');

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Simple gameplay menu click handlers
ael('#show-more', 'mousedown', async () => {
  gp.interrupt();
  anim.fade('#more-options', 1, 0, {display: ''});
  await anim.fade('#more-menu', 1, aTime);
  ui.disableMenu('more-options', false);
});
ael('#ok-no-move', 'mousedown', () => {
  if (gs.phase === 'roll') return;
  message.hide();
  ui.hideButton('ok-no-move');
  gp.endTurn();
});
ael('#ok-ai-move', 'mousedown', () => {
  if (gs.phase !== 'select') return;
  gs.phase = 'think';
  ui.hideButton('ok-ai-move');
  const decision = ai.control[gs.turn](gs, prng.ai);
  if (!decision.length) {
    gp.endTurn();
    return;
  }
  mv.selected = decision[0];
  mv.plan = decision[1];
  gs.phase = 'move';
  click('#confirm-button');
});
ael('#decline-button', 'mousedown', () => {
  if (gs.phase !== 'select' || !gs.je) return;
  message.hide();
  if (mv.toGo) {
    message.show(`confirm-decline-${
      gs.turn === 'human' ? 'jump' : 'enter'
    }`);
    mv.toGo--;
  } else {
    ui.hideButton('decline-button');
    gp.endTurn();
  }
});
ael('#roll-button', 'mousedown', () => {
  if (gs.phase !== 'roll') return;
  gs.phase = 'execute';
  message.hide();
  gs.rollN = rollDie(
    dice[gs.turn].movement, prng.dice[gs.turn]
  );
  gs.rollGo = gs.turn === 'trex' ? 0 : rollDie(
    dice[gs.turn].continue, prng.dice[gs.turn]
  );
  ui.displayRollResult(gs);
  gs.je = gs.rollN === 'Jump' || gs.rollN === 'Enter';
  autoSave.update();
  const delay = anim.time.buttonSlide * 2 +
    anim.time.dieRoll + anim.time.dieRollDelay;
  if (gs.turn === 'trex') {
    setTimeout(() => {
      gs.phase = 'move';
      if (gs.rollN) ui.showButton('ok-trex-move');
      else ui.showButton('ok-no-move');
    }, delay);
  } else {
    setTimeout(() => {
      gs.phase = 'select';
      if (ai.control[gs.turn]) {
        ui.showButton('ok-ai-move');
      } else if (gs.je) gp.startJumpEnter();
    }, delay);
  }
});

// Needed for multiple click handlers
function clearVisibleMove() {
  message.hide();
  ui.hideButton('cancel-button');
  ui.hideButton('confirm-button');
  for (const c of ['selected', 'move', 'path'] ) {
    for (const element of qsa(`.${c}`)) {
      element.classList.remove(c);
    }
  }
}

// Cancel button click handler
ael('#cancel-button', 'mousedown', () => {
  if (gs.phase !== 'move') return;
  gs.phase = 'select';
  clearVisibleMove();
  gp.clearMoveObject();
  if (gs.je) gp.startJumpEnter();
});

// Confirm button click handler
ael('#confirm-button', 'mousedown', async () => {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  clearVisibleMove();
  click('#zoom-default');
  const end = mv.plan[mv.plan.length - 1];
  await bringMoveIntoView();
  for (const s of mv.plan.slice(1)) {
    const isLast = s === end;
    if (gs.turn === 'human') {
      await gp.moveHuman(mv.selected, s, isLast);
    } else {
      await gp.moveRaptor(mv.selected, s, isLast);
    }
  }
});

// T-rex button click handler
ael('#ok-trex-move', 'mousedown', async () => {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  ui.hideButton('ok-trex-move');
  click('#zoom-default');
  await bringMoveIntoView();
  gp.moveTrex(gs.trex - 1, true);
});

// Needed for zoom button click handlers
function highlightPieces(setting) {
  const pieces = qsa(
    '.raptor-piece, .human-piece, .trex-piece'
  );
  const ids = zd.highlightBlinkIds;
  if (setting) {
    for (const piece of pieces) {
      piece.classList.add('highlighted');
    }
    const id = setInterval(() => {
      for (const element of qsa('.highlighted')) {
        element.classList.toggle('on');
      }
    }, anim.time.highlightBlink);
    ids.push(id);
  } else {
    for (const piece of pieces) {
      piece.classList.remove('highlighted');
    }
    while (ids.length) clearInterval(ids.pop());
  }
}
function applyZoomCenter() {
  const {left: cl, top: ct} = zd.center;
  const fc = zd.factor.current;
  const [ww, wh] = windowWH();
  scroll(cl * fc - ww / 2, ct * fc - wh / 2);
}
function zoomGeneral(factor) {
  if (!zd.factor.current) {
    zd.factor.current = 1;
    applyZoomCenter();
    return;
  }
  if (zd.factor.current === factor) return;
  if (zd.factor.current >= 1) {
    const [ww, wh] = windowWH();
    const left = scrollX + ww / 2;
    const top = scrollY + wh / 2;
    zd.center.left = left / zd.factor.current;
    zd.center.top = top / zd.factor.current;
  }
  qs('#gameplay-container').style.zoom = factor;
  zd.factor.current = factor;
  applyZoomCenter();
  for (const element of qsa('.non-zoom')) {
    element.style.zoom = 1 / zd.factor.current;
  }
  highlightPieces(factor < 1);
  const humanBoard = qsa('.human-space, .human-edge');
  for (const element of humanBoard) {
    const isOut = factor < 1;
    element.classList.toggle('more-visible', isOut);
  }
  const currentButton = qs('.zoom-button.current');
  currentButton.classList.remove('current')
  for (const element of qsa('.obstructive')) {
    element.classList.remove('slim');
  }
  qs('#game-over').classList.remove('inactive');
};

// Zoom button click handlers
ael('#zoom-out', 'mousedown', () => {
  const w = windowWH();
  const factor = Math.max(
    ...[0, 1].map(i => w[i] / zd.boardSize[i]),
    zd.factor.outMax,
  );
  zoomGeneral(factor);
  qs('#zoom-out').classList.add('current');
  for (const element of qsa('.obstructive')) {
    element.classList.add('slim');
  }
  qs('#game-over').classList.add('inactive');
});
ael('#zoom-default', 'mousedown', () => {
  zoomGeneral(1);
  qs('#zoom-default').classList.add('current');
});
ael('#zoom-in', 'mousedown', () => {
  zoomGeneral(zd.factor.in);
  qs('#zoom-in').classList.add('current');
});
