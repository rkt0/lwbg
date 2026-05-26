import {
  qs, ael, aelo, fromTemplate, waitForClick,
  addWarningBeforeUnload,
} from './utility.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {control} from './player-control.js';

export async function showStartOptions(time = aTime) {
  autoSave.clear();
  await anim.fade(startMessage, 0, time);
  startOptions.inert = false;
  anim.fade(startOptions, 1, time, {display: ''});
}

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const titleContainer = qs('#title-container');
const startContainer = qs('#start-container');
const startOptions = qs('#start-options');
const startMessage = qs('#start-message');
const gameplayContainer = qs('#gameplay-container');
const loadFork = qs('#load-fork');

// Add title screen click handler
aelo(titleContainer, 'mousedown', async () => {
  addWarningBeforeUnload();
  await anim.fade(titleContainer, 0, aTime);
  anim.fade(startContainer, 1, aTime);
  music.next();
});

// Add start screen click handlers
ael(startContainer, 'mousedown', (e) => {
  const id = e.target.closest('button')?.id;
  if (id === 'start-new') startNew();
  else if (id === 'load-saved') loadSaved();
  else if (id === 'load-overwrite') loadOverwrite();
  else if (id === 'load-copy') loadCopy();
});

// Start screen click handlers
async function startNew() {
  await hideStartOptions();
  await control.show();
  if (debug.skipAutoSave) return startGame();
  await showStartMessage('save-introduction');
  try {
    await autoSave.createFile();
  }
  catch {
    return showStartOptions();
  }
  await showStartMessage('save-created');
  startGame();
}
async function loadSaved() {
  if (debug.skipAutoSave) return;
  await hideStartOptions();
  await showStartMessage('load-introduction');
  hideStartMessage();
  try {
    await autoSave.selectFileToLoad();
  }
  catch (error) {
    if (error.message === 'invalid file') {
      await showStartMessage('load-invalid-file');
    }
    return showStartOptions();
  }
  showLoadFork();
}
async function loadOverwrite() {
  autoSave.fh = autoSave.fhLoad;
  await hideLoadFork();
  await showStartMessage(`overwrite-granted-${
    await autoSave.checkPermission(true)
  }`);
  startGame(true);
}
async function loadCopy() {
  await hideLoadFork();
  await showStartMessage('save-introduction');
  try {
    await autoSave.createFile(true);
  }
  catch {
    return showStartOptions();
  }
  await showStartMessage('save-created');
  startGame(true);
}

// Needed for start screen click handlers
async function startGame(load) {
  const okToSave = await autoSave.checkPermission();
  if (!okToSave) {
    await hideStartMessage();
    return showStartOptions();
  }
  if (load) await autoSave.executeLoad(autoSave.fh);
  await anim.fade(startContainer, 0, aTime);
  hideStartMessage();
  anim.fade(gameplayContainer, 1, aTime);
  gp.initializeView();
  if (load) {
    gp.interrupt(0);
    await control.show();
    gp.resume();
    gp.handleControlChange();
  } else gp.endTurn();
}

// UI helper functions
async function hideStartOptions() {
  startOptions.inert = true;
  await anim.fade(startOptions, 0, aTime);
}
async function showStartMessage(templateId) {
  const node = fromTemplate(templateId);
  startMessage.replaceChildren(node);
  anim.fade(startMessage, 1, aTime);
  await waitForClick(startContainer);
}
function hideStartMessage() {
  anim.fade(startMessage, 0, aTime);
}
function showLoadFork() {
  loadFork.inert = false;
  anim.fade(loadFork, 1, aTime, {display: ''});
}
async function hideLoadFork() {
  loadFork.inert = true;
  await anim.fade(loadFork, 0, aTime);
}
