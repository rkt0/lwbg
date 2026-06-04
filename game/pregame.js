import {
  qs, ael, aelo, fromTemplate, waitForClick,
  addWarningBeforeUnload,
} from './utility.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {control} from './control.js';

export async function showStartOptions(time = aTime) {
  autoSave.clear();
  await anim.fade(startMessage, 0, time);
  startOptions.inert = false;
  anim.fade(startOptions, 1, time, {display: ''});
}

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const sectionFront = qs('#front');
const startOptions = qs('#start .options');
const startMessage = qs('#start .message');
const startFork = qs('#start .fork');

// Add title screen click handler
aelo(sectionFront, 'mousedown', async () => {
  addWarningBeforeUnload();
  await anim.fade(sectionFront, 0, aTime);
  anim.fade(dom.sectionStart, 1, aTime);
  music.next();
});

// Add start screen click handlers
ael(dom.sectionStart, 'mousedown', (e) => {
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
  showFork();
}
async function loadOverwrite() {
  autoSave.fh = autoSave.fhLoad;
  await hideFork();
  await showStartMessage(`overwrite-granted-${
    await autoSave.checkPermission(true)
  }`);
  startGame(true);
}
async function loadCopy() {
  await hideFork();
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
  await anim.fade(dom.sectionStart, 0, aTime);
  hideStartMessage();
  anim.fade(dom.gameplay, 1, aTime);
  gp.initializeView();
  if (load) {
    gp.interrupt(0);
    await control.show();
    gp.resume();
    gp.handleControlChange();
  } else {
    // Save first to record player control
    await gp.save();
    gp.endTurn();
  }
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
  await waitForClick(dom.sectionStart);
}
function hideStartMessage() {
  anim.fade(startMessage, 0, aTime);
}
function showFork() {
  startFork.inert = false;
  anim.fade(startFork, 1, aTime, {display: ''});
}
async function hideFork() {
  startFork.inert = true;
  await anim.fade(startFork, 0, aTime);
}
