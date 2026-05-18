import {
  qs, qsa, ael, aelo, click, sleep,
  deepCopy, isNull, sqrtStep, rollDie,
  windowWH, absoluteBoundingRect, boundingBox,
} from './utility.js';
import {scrollBetter} from './scroll.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';
import {bd} from './board-topology.js';
import {dice} from './dice.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {music} from './music.js';
import {gs, mv, zd, pl} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';

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

// Animation times for menu fade and edit control fade
const aTime = anim.time.menuFade;
const eTime = anim.time.editControlFade;

// Title screen click handler
aelo('#title-container', 'mousedown', async () => {
  onbeforeunload = () => '';
  await anim.fade('#title-container', 0, aTime);
  anim.fade('#start-container', 1, aTime);
  music.next();
});

// Needed for start screen click handlers
async function loadOverwrite() {
  const {fhLoad} = autoSave;
  ui.disableMenu('load-choose-save');
  const okAlready = await fhLoad.queryPermission({
    mode: 'readwrite',
  });
  autoSave.fh = fhLoad;
  ui.startMessage(`load-permission-${okAlready}`);
  await anim.fade('#load-choose-save', 0, aTime);
  await anim.fade('#start-message', 1, aTime);
  aelo('#start-container', 'mousedown', () => {
    autoSave.begin(fhLoad);
  });
}
async function loadNew() {
  const {fhLoad} = autoSave;
  ui.disableMenu('load-choose-save');
  await anim.fade('#load-choose-save', 0, aTime);
  autoSave.begin(fhLoad);
}
async function selectFileToLoad() {
  anim.fade('#start-message', 0, aTime);
  let fh;
  try {
    [fh] = await showOpenFilePicker({
      startIn: autoSave.defaultDirectory,
    });
  } catch {
    ui.showStartOptions();
    return;
  }
  const file = await fh.getFile();
  const contents = await file.text();
  const lines = contents.split('\n');
  if (lines[0] !== 'LWBG' || lines[1] !== '0,0') {
    ui.startMessage('load-invalid-file');
    await anim.fade('#start-message', 1, aTime);
    aelo('#start-container', 'mousedown', () => {
      ui.showStartOptions();
    });
    return;
  };
  autoSave.fhLoad = fh;
  await anim.fade('#load-choose-save', 1, aTime, {
    display: '',
  });
  ui.disableMenu('load-choose-save', false);
}

// Start screen click handlers
ael('#start-new', 'mousedown', async () => {
  ui.disableMenu('start-options');
  await anim.fade('#start-options', 0, aTime);
  ui.showControl();
});
ael('#load-saved', 'mousedown', async () => {
  ui.disableMenu('start-options');
  await anim.fade('#start-options', 0, aTime);
  ui.startMessage('load-introduction');
  anim.fade('#start-message', 1, aTime);
  aelo('#start-container', 'mousedown', () => {
    selectFileToLoad();
  });
});
ael('#load-overwrite', 'mousedown', () => {
  loadOverwrite();
});
ael('#load-new', 'mousedown', () => {
  loadNew();
});
ael('#start-toggle-audio', 'mousedown', () => {
  click('#toggle-audio');
});

// Needed for player control screen click handlers
async function savePlayers() {
  if (!ai.control.changed) return;
  ai.control.changed = false;
  if (debug.skipAutoSave) return;
  const file = await autoSave.fh.getFile();
  const contents = await file.text();
  const writable = await autoSave.fh.createWritable();
  await writable.write(contents);
  const playerCode = ai.control.fullSaveCode();
  await writable.write(playerCode + ';');
  await writable.close();
}
function continueInGame() {
  savePlayers();
  hideMore();
  ui.hideMessage();
  anim.fade('#player-control', 0, aTime);
  if (ai.control[gs.turn] && gs.phase !== 'roll') {
    click('#cancel-button');
    ui.hideButton('ok-no-move');
    ui.hideButton('decline-button');
    ui.showButton('ok-ai-move');
  } else {
    ui.hideButton('ok-ai-move');
    if (gs.je) gp.startJumpEnter();
  }
}
async function continueAtStart() {
  await anim.fade('#player-control', 0, aTime);
  autoSave.begin();
};
function changeControl(species, level) {
  const area = qs(`#${species}-control`);
  qs('.current', area)?.classList.remove('current');
  if (level === -1) {
    qs('.manual', area).classList.add('current');
    ai.control[species] = false;
  } else {
    qs(`.ai-${level}`, area).classList.add('current');
    ai.control[species] = ai.level[species][level];
  }
  if (gs.turn) ai.control.changed = true;
  if (isNull(ai.control.human)) return;
  if (isNull(ai.control.raptor)) return;
  const button = qs('#continue-from-control');
  anim.fade(button, 1, aTime);
  button.style.pointerEvents = 'auto';
}

// Player control screen click handlers
ael('#continue-from-control', 'mousedown', () => {
  ui.disableMenu('player-control');
  if (gs.turn) continueInGame();
  else continueAtStart();
});
for (const species of ['human', 'raptor']) {
  const area = `#${species}-control`;
  ael(`${area} .manual`, 'mousedown', () => {
    changeControl(species, -1);
  });
  for (let i = 0; i < ai.level[species].length; i++) {
    ael(`${area} .ai-${i}`, 'mousedown', () => {
      changeControl(species, i);
    });
  }
}

// Needed for more menu click handlers
async function hideMore() {
  ui.disableMenu('more-menu');
  const moreMenu = qs('#more-menu');
  await anim.fade(moreMenu, 0, aTime);
  for (const child of moreMenu.children) {
    child.style.display = 'none';
  }
  document.body.style.overflow = 'visible';
}
async function manualSave() {
  if (debug.skipAutoSave) {
    hideMore();
    return;
  }
  const file = await autoSave.fh.getFile();
  const contents = await file.text();
  try {
    const fh = await showSaveFilePicker({
      startIn: autoSave.fh,
      types: [autoSave.fileType],
    });
    const writable = await fh.createWritable();
    await writable.write(contents);
    await writable.close();
    ui.showMessage('manual-save-success');
  } finally {
    hideMore();
  }
}
function dieCode(value, die) {
  if (value === null || !die) return 0;
  // Max to return 0 instead of -1 if not found
  return Math.max(die.lastIndexOf(value), 0);
}
function enableDiceEdit() {
  for (const element of qsa('.edit-dice')) {
    anim.fade(element, 1, eTime);
  }
  for (const wrapper of qsa(`.wrapper-${gs.turn}`)) {
    wrapper.style.display = 'block';
  }
  edit.dieCodes.movement =
    dieCode(gs.rollN, dice[gs.turn].movement);
  edit.dieCodes.continue =
    dieCode(gs.rollGo, dice[gs.turn].continue);
};

// More menu click handlers
ael('#hide-more', 'mousedown', async () => {
  await hideMore();
});
ael('#new-save-point', 'mousedown', async () => {
  ui.disableMenu('more-options');
  const help = qs('#manual-save-help');
  await anim.fade('#more-options', 0, aTime);
  await anim.fade(help, 1, aTime, {display: ''});
  aelo(help, 'mousedown', () => {
    manualSave();
  });
});
ael('#begin-edit', 'mousedown', () => {
  hideMore();
  if (gs.turn !== 'trex' && gs.turn !== 'over') {
    click('#cancel-button');
  }
  edit.on = true;
  edit.gsPrevious = deepCopy(gs);
  ui.hideMessage();
  const hidden = [
    'show-more', 'roll-button', 'decline-button',
    'ok-trex-move', 'ok-no-move', 'ok-ai-move',
  ];
  for (const x of hidden) ui.hideButton(x);
  for (const element of qsa('.edit-control')) {
    if (element.classList.contains('.edit-dice')) {
      return;
    }
  }
  const universalControls =
    '.edit-control:not(.edit-dice):not(.edit-turn)';
  for (const element of qsa(universalControls)) {
    anim.fade(element, 1, eTime);
  }
  if (gs.turn === 'over') {
    anim.fade('#game-over', 0, eTime);
  } else anim.fade('.edit-turn', 1, eTime);
  if (gs.phase !== 'roll') enableDiceEdit();
  ui.humanItemsClickable(true);
  ui.raptorItemsClickable(true);
  qs('#cancel-edits').disabled = false;
  qs('#confirm-edits').disabled = false;
});
ael('#change-control', 'mousedown', async () => {
  ui.disableMenu('more-options');
  await anim.fade('#more-options', 0, aTime);
  ui.showControl();
});
ael('#show-quit-options', 'mousedown', async () => {
  ui.disableMenu('more-options');
  await anim.fade('#more-options', 0, aTime);
  await anim.fade('#quit-options', 1, aTime, {
    display: '',
  });
  ui.disableMenu('quit-options', false);
});

// Confirm quit menu click handlers
ael('#abort-quit', 'mousedown', () => {
  hideMore();
});
ael('#confirm-quit', 'mousedown', async () => {
  await hideMore();
  await anim.fade('#gameplay-container', 0, aTime);
  gp.initializeObjects();
  gp.initializeView();
  pieces.shuffleFeatures();
  pieces.addImgs();
  autoSave.clear();
  ui.showStartOptions(true);
  anim.fade('#start-container', 1, aTime);
});

// Simple gameplay menu click handlers
ael('#show-more', 'mousedown', async () => {
  document.body.style.overflow = 'hidden';
  anim.fade('#more-options', 1, 0, {display: ''});
  await anim.fade('#more-menu', 1, aTime);
  ui.disableMenu('more-options', false);
});
ael('#ok-no-move', 'mousedown', () => {
  if (gs.phase === 'roll') return;
  ui.hideMessage();
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
  ui.hideMessage();
  if (mv.toGo) {
    ui.showMessage(`confirm-decline-${
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
  ui.hideMessage();
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
  ui.hideMessage();
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

// Needed for confirm button click handler
function movePlanRegion() {
  const planCorners =
    mv.plan.map(x => [...pl[gs.turn][x]]);
  const [pw, ph] = pl[gs.turn].ps;
  const planRegions = planCorners.map(x => ({
    left: x[0], right: x[0] + pw,
    top: x[1], bottom: x[1] + ph,
  }));
  return boundingBox(...planRegions);
};
async function bringIntoView(region) {
  const padding = [216, 108];
  const [ww, wh] = windowWH();
  const [ph, pv] = padding;
  const current = {
    left: scrollX, right: scrollX + ww,
    top: scrollY, bottom: scrollY + wh,
  };
  const excess = [
    (region.right - region.left) - ww + ph * 2,
    (region.bottom - region.top) - wh + pv * 2,
  ].map(x => Math.max(x, 0));
  const target = {
    left: region.left - ph + excess[0] / 2,
    right: region.right + ph - excess[0] / 2,
    top: region.top - pv + excess[1] / 2,
    bottom: region.bottom + pv - excess[1] / 2,
  };
  const location = {
    left: Math.min(target.left, current.left),
    top: Math.min(target.top, current.top),
  };
  if (target.right > current.right) {
    location.left = target.right - ww;
  }
  if (target.bottom > current.bottom) {
    location.top = target.bottom - wh;
  }
  const distance = Math.hypot(
    location.left - current.left,
    location.top - current.top,
  );
  // Times will be reduced if distance to be scrolled 
  // is less than taperDistance
  const taperDistance = 648;
  const taper = sqrtStep(distance / taperDistance);
  const duration = anim.time.autoScroll * taper;
  await scrollBetter(location, duration);
  await sleep(anim.time.autoScrollDelay * taper);
}

// Confirm button click handler
ael('#confirm-button', 'mousedown', async () => {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  clearVisibleMove();
  click('#zoom-default');
  const end = mv.plan[mv.plan.length - 1];
  await bringIntoView(movePlanRegion(gs.turn));
  for (const s of mv.plan.slice(1)) {
    const isLast = s === end;
    if (gs.turn === 'human') {
      await gp.moveHuman(mv.selected, s, isLast);
    } else {
      await gp.moveRaptor(mv.selected, s, isLast);
    }
  }
});

// Needed for T-rex button click handler
function trexMoveRegion() {
  const [oldL, oldT] = pl.trex[gs.trex];
  const [newL, newT] = pl.trex[gs.trex - 1];
  const [pw, ph] = pl.trex.ps;
  const pieceRegionOld = {
    left: oldL, right: oldL + pw,
    top: oldT, bottom: oldT + ph,
  };
  const pieceRegionNew = {
    left: newL, right: newL + pw,
    top: newT, bottom: newT + ph,
  };
  const spaceOld = `#trex-space-${gs.trex}`;
  const spaceNew = gs.trex === 1 ?
    `#human-space-${bd.humanStart}` :
    `#trex-space-${gs.trex - 1}`;
  return boundingBox(
    pieceRegionOld, pieceRegionNew,
    absoluteBoundingRect(spaceOld),
    absoluteBoundingRect(spaceNew),
  );
};

// T-rex button click handler
ael('#ok-trex-move', 'mousedown', async () => {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  ui.hideButton('ok-trex-move');
  click('#zoom-default');
  await bringIntoView(trexMoveRegion());
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

// Message hover handler
function mouseover(inbound) {
  const container = qs('#message-container');
  if (anim.isAnimated(container)) return;
  qs('.content', container).style.visibility =
    inbound ? 'hidden' : 'visible';
  qs('.hider', container).style.display =
    inbound ? 'flex' : 'none';
}
ael('#message-container', 'mousedown', () => {
  ui.hideMessage();
});
ael('#message-container', 'mouseenter', () => {
  mouseover(true);
});
ael('#message-container', 'mouseleave', () => {
  mouseover(false);
});

// Gameplay audio toggle button click handler
ael('#toggle-audio', 'mousedown', () => {
  music.toggle();
});
