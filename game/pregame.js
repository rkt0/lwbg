import {
  qjs, closestData, ael, aelo, fromTemplate,
  waitForClick, addWarningBeforeUnload,
} from './utility.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {toggle} from './toggle.js';
import {control} from './control.js';
import {gp} from './gameplay.js';
import {autoSave} from './auto-save.js';

export async function showStartOptions(time = aTime) {
  autoSave.clear();
  await anim.fade(help, 0, time);
  dom.startOptions.inert = false;
  anim.fade(dom.startOptions, 1, time, {display: ''});
}

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const front = qjs('front');
const help = qjs('start-help');
const fork = qjs('start-fork');

// Add title screen click handler
aelo(front, 'mousedown', async () => {
  addWarningBeforeUnload();
  await anim.fade(front, 0, aTime);
  anim.fade(dom.start, 1, aTime, {display: ''});
  music.allowed = true;
  if (music.audioOn) music.next();
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
  await showStartHelp('save-introduction');
  try {
    await autoSave.createFile();
  }
  catch {
    return showStartOptions();
  }
  await showStartHelp('save-created');
  startGame();
}
async function loadSaved() {
  if (debug.skipAutoSave) return;
  await hideStartOptions();
  await showStartHelp('load-introduction');
  hideStartHelp();
  try {
    await autoSave.selectFileToLoad();
  }
  catch (error) {
    if (error.message === 'invalid file') {
      await showStartHelp('load-invalid-file');
    }
    return showStartOptions();
  }
  showFork();
}
async function loadOverwrite() {
  autoSave.fh = autoSave.fhLoad;
  await hideFork();
  await showStartHelp(`overwrite-granted-${
    await autoSave.checkPermission(true)
  }`);
  startGame(true);
}
async function loadCopy() {
  await hideFork();
  await showStartHelp('save-introduction');
  try {
    await autoSave.createFile(true);
  }
  catch {
    return showStartOptions();
  }
  await showStartHelp('save-created');
  startGame(true);
}

// Needed for start screen click handlers
async function startGame(load) {
  const okToSave = await autoSave.checkPermission();
  if (!okToSave) {
    await hideStartHelp();
    return showStartOptions();
  }
  if (load) await autoSave.executeLoad(autoSave.fh);
  await anim.fade(dom.start, 0, aTime);
  hideStartHelp();
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
  dom.startOptions.inert = true;
  await anim.fade(dom.startOptions, 0, aTime);
}
async function showStartHelp(templateId) {
  const node = fromTemplate(templateId);
  help.replaceChildren(node);
  await anim.fade(help, 1, aTime);
  await waitForClick(dom.start);
}
function hideStartHelp() {
  anim.fade(help, 0, aTime);
}
function showFork() {
  fork.inert = false;
  anim.fade(fork, 1, aTime, {display: ''});
}
async function hideFork() {
  fork.inert = true;
  await anim.fade(fork, 0, aTime);
}
