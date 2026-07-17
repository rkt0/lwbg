import {
  qjs, qda, closestData, ael, click, rollDie,
} from './utility.js';
import {prng} from './prngs.js';
import {dom} from './dom.js';
import {music} from './music.js';
import {dice} from './dice.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs, mv} from './game-objects.js';
import {zoom} from './zoom.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {message} from './message.js';
import {bringMoveIntoView} from './view-region.js';
import {moreMenu} from './more-menu.js';

// Set display to none on dormant elements
for (const element of qda('dormant')) {
  element.style.display = 'none';
}

// Initialize dormant elements in gameplay menu
const gameplayMenu = qjs('gameplay-menu');
for (const button of qda('dormant', gameplayMenu)) {
  ui.hideButton(button.dataset.js);
}

// Simple gameplay menu click handlers
function showMore() {
  moreMenu.show();
}
async function okNoMove() {
  if (gs.phase === 'roll') return;
  message.hide();
  ui.hideButton('ok-no-move');
  await gp.endTurn();
}
async function okAiMove() {
  if (gs.phase !== 'select') return;
  gs.phase = 'think';
  ui.hideButton('ok-ai-move');
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
    ui.hideButton('decline');
    await gp.endTurn();
  }
}
async function executeRoll() {
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
  await autoSave.update();
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
}
async function okTrexMove() {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  ui.hideButton('ok-trex-move');
  zoom.zoomDefault();
  await bringMoveIntoView();
  gp.moveTrex(gs.trex - 1, true);
}

// Needed for click handlers for cancel and confirm
function clearVisibleMove() {
  message.hide();
  ui.hideButton('cancel');
  ui.hideButton('confirm');
  dom.selected?.classList.remove('selected');
  dom.selected = null;
  dom.move?.classList.remove('move');
  dom.move = null;
  for (const element of dom.path) {
    element.classList.remove('path');
  }
  dom.path = [];
}

// Click handlers for cancel and confirm
function cancelMove() {
  if (gs.phase !== 'move') return;
  gs.phase = 'select';
  clearVisibleMove();
  gp.clearMoveObject();
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

// Gameplay menu click handler
ael(qjs('gameplay-menu'), 'mousedown', (e) => {
  const js = closestData(e);
  if (js === 'show-more') showMore();
  else if (js === 'ok-no-move') okNoMove();
  else if (js === 'ok-ai-move') okAiMove();
  else if (js === 'ok-trex-move') okTrexMove();
  else if (js === 'decline') decline();
  else if (js === 'roll-button') executeRoll();
  else if (js === 'cancel') cancelMove();
  else if (js === 'confirm') confirmMove();
  else if (js === 'zoom-out') zoom.zoomOut();
  else if (js === 'zoom-default') zoom.zoomDefault();
  else if (js === 'zoom-in') zoom.zoomIn();
});

// Toggle button area click handler
ael(qjs('toggle-button-area'), 'mousedown', (e) => {
  const toggle = closestData(e, 'toggle');
  if (toggle === 'audio') {
    music.toggle();
  } else if (toggle === 'fullscreen') {
    zoom.toggleFullscreen();
  } else if (toggle === 'tv-mode') {
    zoom.toggleTvMode();
  }
});
