import {
  qjs, closestData, addWarningBeforeUnload,
} from './utility.js';
import {atClick} from './mouse-events.js';
import {waitForClick} from './mouse-events.js';
import {template} from './template.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {sb} from './sidebar.js';
import {toggle} from './toggle.js';
import {control} from './control.js';
import {gp} from './gameplay.js';
import {audioPanel} from './audio-panel.js';
import {autoSave} from './auto-save.js';

export function showStartOptions(time = aTime) {
  autoSave.clear();
  dom.startOptions.inert = false;
  anim.fade(dom.startOptions, 1, time, {display: ''});
}

export async function initializeFront() {
  await waitForClick(front);
  addWarningBeforeUnload();
  await anim.fade(front, 0, aTime);
  anim.fade(dom.start, 1, aTime, {display: ''});
  music.allowed = true;
  if (music.audioOn) music.next();
}

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const front = qjs('front');
const help = qjs('start-help');
const fork = qjs('start-fork');

// Add start screen click handlers
atClick(dom.start, (e) => {
  const handler = dispatch[closestData(e)];
  if (handler) handler(); else toggle.handleClick(e);
});

// Dispatch table for start screen click handler
const dispatch = {
  'start-new': startNew,
  'load-saved': loadSaved,
  'show-audio-start': showAudioPanel,
  'load-overwrite': loadOverwrite,
  'load-copy': loadCopy,
};

// Start screen click handlers
async function startNew() {
  await hideStartOptions();
  await control.show();
  if (debug.skipAutoSave) return startGame();
  await showStartHelp('save-introduction');
  let failure;
  try {
    await autoSave.createFile();
  } catch {
    failure = true;
  } finally {
    await hideStartHelp();
  }
  if (failure) return showStartOptions();
  await showStartHelp('save-created');
  startGame();
}
async function loadSaved() {
  if (debug.skipAutoSave) return;
  await hideStartOptions();
  await showStartHelp('load-introduction');
  let failure;
  try {
    await autoSave.selectFileToLoad();
  } catch (error) {
    failure = true;
    if (error.message === 'invalid file') {
      await hideStartHelp();
      await showStartHelp('load-invalid-file');
    }
  } finally {
    await hideStartHelp();
  }
  if (failure) return showStartOptions();
  showFork();
}
async function showAudioPanel() {
  await hideStartOptions();
  await audioPanel();
  showStartOptions();
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
    await hideStartHelp();
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
  dom.hud.style.display = '';
  if (load) gp.interrupt(0);
  else {
    // Save first to record player control
    await gp.save();
    gp.endTurn(true);
  }
  const ready = anim.fade(dom.gameplay, 1, aTime);
  gp.initializeView();
  if (load) {
    await Promise.all([ready, control.show()]);
    gp.resume();
    gp.handleControlChange();
  } else await ready;
  sb.show();
  toggle.showGroup();
  dom.gameplay.inert = false;
}

// UI helper functions
async function hideStartOptions() {
  dom.startOptions.inert = true;
  await anim.fade(dom.startOptions, 0, aTime);
}
async function showStartHelp(templateId) {
  help.replaceChildren(template(templateId, true));
  await anim.fade(help, 1, aTime);
  await waitForClick(dom.start);
}
async function hideStartHelp() {
  await anim.fade(help, 0, aTime);
}
function showFork() {
  fork.inert = false;
  anim.fade(fork, 1, aTime, {display: ''});
}
async function hideFork() {
  fork.inert = true;
  await anim.fade(fork, 0, aTime);
}
