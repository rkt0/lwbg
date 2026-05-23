import {
  qs, ael, aelo, fromTemplate, waitForClick,
} from './utility.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
// Remember to change this
// import {autoSave} from './new-auto-save.js';
import {autoSave} from './auto-save.js';
import {showControl} from './player-control.js';

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const titleContainer = qs('#title-container');
const startContainer = qs('#start-container');
const startOptions = qs('#start-options');
const startMessage = qs('#start-message');
const gameplayContainer = qs('#gameplay-container');
const loadFork = qs('#load-fork');

// UI helper functions
async function showOptions() {
  await anim.fade(startMessage, 0, aTime);
  startOptions.inert = false;
  anim.fade(startOptions, 1, aTime, {display: ''});
}
async function hideOptions() {
  startOptions.inert = true;
  await anim.fade(startOptions, 0, aTime);
}
async function showMessage(templateId) {
  const node = fromTemplate(templateId);
  startMessage.replaceChildren(node);
  anim.fade(startMessage, 1, aTime);
  await waitForClick(startContainer);
}
function hideMessage() {
  anim.fade(startMessage, 0, aTime);
}
function showFork() {
  loadFork.inert = false;
  anim.fade(loadFork, 1, aTime, {display: ''});
}
async function hideFork() {
  loadFork.inert = true;
  await anim.fade(loadFork, 0, aTime);
}

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
  // else if (id === 'load-new') loadNew();
});

// Start screen click handlers
async function startNew() {
  await hideOptions();
  await showControl();
  if (debug.skipAutoSave) return startGame();
  await showMessage('save-introduction');
  try {await autoSave.createNewGameFile();}
  catch {return showOptions();}
  await showMessage('save-created');
  startGame();
}
async function loadSaved() {
  await hideOptions();
  await showMessage('load-introduction');
  hideMessage();
  try {await autoSave.selectFileToLoad();}
  catch (error) {
    if (error.message === 'invalid file') {
      await showMessage('load-invalid-file');
    }
    return showOptions();
  }
  showFork();
}
async function loadOverwrite() {
  const {fhLoad} = autoSave;
  const okAlready = await fhLoad.queryPermission({
    mode: 'readwrite',
  });
  autoSave.fh = fhLoad;
  await hideFork();
  await showMessage(`load-permission-${okAlready}`);
  startGame(fhLoad);
}

// Needed for start screen click handlers
async function startGame(fhLoad) {
  const okToSave = await autoSave.checkPermission();
  if (!okToSave) {
    autoSave.fh = void 0;
    await anim.fade(startMessage, 0, aTime);
    return ui.showStartOptions();
  }
  if (fhLoad) await autoSave.executeLoad(fhLoad);
  await anim.fade(startContainer, 0, aTime);
  anim.fade(gameplayContainer, 1, aTime);
  gp.initializeView();
  if (fhLoad) autoSave.startGameFromLoad();
  else gp.endTurn();
}
