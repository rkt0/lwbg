import {
  qjs, closestData, rollDie,
} from './utility.js';
import {click, atClick} from './mouse-events.js';
import {prng} from './prngs.js';
import {gs, mv} from './game-objects.js';
import {dom} from './dom.js';
import {dice} from './dice.js';
import {zoom} from './zoom.js';
import {ai} from './ai.js';
import {message} from './message.js';
import {sb} from './sidebar.js';
import {toggle} from './toggle.js';
import {bringMoveIntoView} from './view-region.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';
import {moreMenu} from './more-menu.js';

// Show/hide elements and sidebar itself
sb.reset();
sb.hide();

// Simple click handlers
async function okNoMove() {
  if (gs.phase === 'roll') return;
  message.hide();
  sb.hide('ok-no-move');
  await gp.endTurn();
}
async function okAiMove() {
  if (gs.phase !== 'select') return;
  gs.phase = 'think';
  sb.hide('ok-ai-move');
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
    sb.hide('decline');
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
  await sb.displayRollResult(gs);
  gs.je = gs.rollN === 'Jump' || gs.rollN === 'Enter';
  await gp.save();
  if (gs.turn === 'trex') {
    gs.phase = 'move';
    sb.show(gs.rollN ? 'ok-trex-move' : 'ok-no-move');
  } else {
    gs.phase = 'select';
    if (ai.control[gs.turn]) sb.show('ok-ai-move');
    else if (gs.je) gp.startJumpEnter();
  }
}
async function okTrexMove() {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  sb.hide('ok-trex-move');
  zoom.zoomDefault();
  await bringMoveIntoView();
  gp.moveTrex(gs.trex - 1, true);
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
  await gp.clearVisibleMove();
  if (gs.je) gp.startJumpEnter();
}
async function confirmMove() {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  gp.clearVisibleMove();
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

// Dispatch table for sidebar click handler
const dispatchSidebar = {
  'show-more': () => moreMenu.show(),
  'roll-dice': rollDice,
  'ok-trex-move': okTrexMove,
  'ok-no-move': okNoMove,
  'ok-ai-move': okAiMove,
  'decline': decline,
  'unroll-dice': () => edit.unrollDice(),
  'cancel': cancelMove,
  'confirm': confirmMove,
  'zoom-out': () => zoom.zoomOut(),
  'zoom-default': () => zoom.zoomDefault(),
  'zoom-in': () => zoom.zoomIn(),
};

function clicked(element, event) {
  return element.contains(event.target);
}

// Add click handlers
atClick(dom.hud, (e) => {
  const isEditBanner = clicked(edit.bannerElement, e);
  if (isEditBanner) return edit.handleBannerClick(e);
  const isMoreMenu = clicked(moreMenu.element, e);
  if (isMoreMenu) return moreMenu.handleClick(e);
  const isMessage = clicked(message.element, e);
  if (isMessage) return message.hide();
  const isToggle = clicked(toggle.groupElement, e);
  if (isToggle) return toggle.handleClick(e);
  const change = closestData(e, 'change');
  if (change) return edit.handleChange(change);
  dispatchSidebar[closestData(e)]?.();
});
