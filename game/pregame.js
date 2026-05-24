import {
  qs, ael, aelo, fromTemplate, waitForClick,
} from './utility.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {showControl} from './player-control.js';

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
  onbeforeunload = () => '';
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
  await showControl();
  if (debug.skipAutoSave) return startGame();
  await showStartMessage('save-introduction');
  try {await autoSave.createFile();}
  catch {return showStartOptions();}
  await showStartMessage('save-created');
  startGame();
}
async function loadSaved() {
  await hideStartOptions();
  await showStartMessage('load-introduction');
  hideStartMessage();
  try {await autoSave.selectFileToLoad();}
  catch (error) {
    if (error.message === 'invalid file') {
      await showStartMessage('load-invalid-file');
    }
    return showStartOptions();
  }
  showLoadFork();
}
async function loadOverwrite() {
  const {fhLoad} = autoSave;
  const ok = await fhLoad.queryPermission({
    mode: 'readwrite',
  });
  autoSave.fh = fhLoad;
  await hideLoadFork();
  await showStartMessage(`load-permission-${ok}`);
  startGame(fhLoad);
}
async function loadCopy() {
  const {fhLoad} = autoSave;
  await hideLoadFork();
  await showStartMessage('save-introduction');
  try {await autoSave.createFile(fhLoad);}
  catch {return showStartOptions();}
  await showStartMessage('save-created');
  startGame(fhLoad);
}

// Needed for start screen click handlers
async function startGame(fhLoad) {
  const okToSave = await autoSave.checkPermission();
  if (!okToSave) {
    await hideStartMessage();
    return showStartOptions();
  }
  if (fhLoad) await autoSave.executeLoad(fhLoad);
  await anim.fade(startContainer, 0, aTime);
  hideStartMessage();
  anim.fade(gameplayContainer, 1, aTime);
  gp.initializeView();
  if (fhLoad) {
    gp.interrupt(0);
    showControl();
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
