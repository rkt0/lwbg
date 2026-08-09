import {
  qjs, closestData, click, rollDie,
} from './utility.js';
import {prng} from './prngs.js';
import {gs, mv} from './game-objects.js';
import {dom} from './dom.js';
import {dice} from './dice.js';
import {zoom} from './zoom.js';
import {anim} from './animation.js';
import {ai} from './ai.js';
import {message} from './message.js';
import {sb} from './sidebar.js';
import {bringMoveIntoView} from './view-region.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';
import {moreMenu} from './more-menu.js';

// Hide non-active elements in sidebar
for (const element of sb.element.children) {
  if ('active' in element.dataset) continue;
  sb.hideButton(element.dataset.js);
}
async function okNoMove() {
  if (gs.phase === 'roll') return;
  message.hide();
  sb.hideButton('ok-no-move');
  await gp.endTurn();
}
async function okAiMove() {
  if (gs.phase !== 'select') return;
  gs.phase = 'think';
  sb.hideButton('ok-ai-move');
  const decision = ai.control[gs.turn](gs, prng.ai);
  if (!decision.length) {
    await gp.endTurn();
    return;
  }
  mv.selected = decision[0];
  mv.plan = decision[1];
  gs.phase = 'move';
  click(qjs('confirm'));
}
async function decline() {
  if (gs.phase !== 'select' || !gs.je) return;
  message.hide();
  if (mv.toGo) {
    message.show(`confirm-decline-${
      gs.turn === 'human' ? 'jump' : 'enter'
    }`);
    mv.toGo--;
  } else {
    sb.hideButton('decline');
    await gp.endTurn();
  }
}
async function rollDice() {
  if (gs.phase !== 'roll') return;
  gs.phase = 'execute';
  message.hide();
  gs.rollN = rollDie(
    dice[gs.turn].movement, prng.dice[gs.turn]
  );
  gs.rollGo = gs.turn === 'trex' ? 0 : rollDie(
    dice[gs.turn].continue, prng.dice[gs.turn]
  );
  sb.displayRollResult(gs);
  gs.je = gs.rollN === 'Jump' || gs.rollN === 'Enter';
  await gp.save();
  const delay = anim.time.buttonSlide * 2 +
    anim.time.dieRoll + anim.time.dieRollDelay;
  if (gs.turn === 'trex') {
    setTimeout(() => {
      gs.phase = 'move';
      if (gs.rollN) sb.showButton('ok-trex-move');
      else sb.showButton('ok-no-move');
    }, delay);
  } else {
    setTimeout(() => {
      gs.phase = 'select';
      if (ai.control[gs.turn]) {
        sb.showButton('ok-ai-move');
      } else if (gs.je) gp.startJumpEnter();
    }, delay);
  }
}
async function okTrexMove() {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  sb.hideButton('ok-trex-move');
  zoom.zoomDefault();
  await bringMoveIntoView();
  gp.moveTrex(gs.trex - 1, true);
}

// Needed for click handlers for cancel and confirm
async function clearVisibleMove() {
  gp.select();
  dom.move?.classList.remove('move');
  dom.move = null;
  for (const element of dom.path) {
    element.classList.remove('path');
  }
  dom.path = [];
  message.hide();
  sb.hideButton('confirm');
  await sb.hideButton('cancel');
}

// Click handlers for cancel and confirm
async function cancelMove() {
  if (edit.on) {
    edit.cancelSelection();
    return;
  }
  if (gs.phase !== 'move') return;
  gs.phase = 'select';
  gp.clearMoveObject();
  await clearVisibleMove();
  if (gs.je) gp.startJumpEnter();
}
async function confirmMove() {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  clearVisibleMove();
  zoom.zoomDefault();
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
}

// Dispatch table for click handler
const dispatch = {
  ['show-more']: () => moreMenu.show(),
  ['roll-dice']: rollDice,
  ['ok-trex-move']: okTrexMove,
  ['ok-no-move']: okNoMove,
  ['ok-ai-move']: okAiMove,
  ['decline']: decline,
  ['unroll-dice']: () => edit.unrollDice(),
  ['cancel']: cancelMove,
  ['confirm']: confirmMove,
  ['zoom-out']: () => zoom.zoomOut(),
  ['zoom-default']: () => zoom.zoomDefault(),
  ['zoom-in']: () => zoom.zoomIn(),
};

// Inject into sidebar object
sb.handleClick = (e) => {
  const change = closestData(e, 'change');
  if (change) edit.handleChange(change);
  else dispatch[closestData(e)]?.();
};
