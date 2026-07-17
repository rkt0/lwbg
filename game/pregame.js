import {
  qjs, closestData, ael, aelo, fromTemplate,
  waitForClick, addWarningBeforeUnload,
} from './utility.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {toggle} from './toggle.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {control} from './control.js';

export async function showStartOptions(time = aTime) {
  autoSave.clear();
  await anim.fade(message, 0, time);
  options.inert = false;
  anim.fade(options, 1, time, {display: ''});
}

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const front = qjs('front');
const options = qjs('start-options');
const message = qjs('start-message');
const fork = qjs('start-fork');

// Add title screen click handler
aelo(front, 'mousedown', async () => {
  addWarningBeforeUnload();
  await anim.fade(front, 0, aTime);
  anim.fade(dom.start, 1, aTime, {display: ''});
  music.next();
});

// Add start screen click handlers
ael(dom.start, 'mousedown', (e) => {
  const js = closestData(e);
  if (js === 'start-new') startNew();
  else if (js === 'load-saved') loadSaved();
  else if (js === 'load-overwrite') loadOverwrite();
  else if (js === 'load-copy') loadCopy();
  else toggle.handleClick(e);
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
  await anim.fade(dom.start, 0, aTime);
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
  options.inert = true;
  await anim.fade(options, 0, aTime);
}
async function showStartMessage(templateId) {
  const node = fromTemplate(templateId);
  message.replaceChildren(node);
  anim.fade(message, 1, aTime);
  await waitForClick(dom.start);
}
function hideStartMessage() {
  anim.fade(message, 0, aTime);
}
function showFork() {
  fork.inert = false;
  anim.fade(fork, 1, aTime, {display: ''});
}
async function hideFork() {
  fork.inert = true;
  await anim.fade(fork, 0, aTime);
}
