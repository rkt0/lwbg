import {qs, ael, aelo} from './utility.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';

// Animation time for menu fade
const aTime = anim.time.menuFade;

// More menu click handlers
async function manualSave() {
  if (debug.skipAutoSave) {
    ui.hideMore();
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
    ui.hideMore();
  }
}
async function savePoint() {
  ui.disableMenu('more-options');
  const help = qs('#manual-save-help');
  await anim.fade('#more-options', 0, aTime);
  await anim.fade(help, 1, aTime, {display: ''});
  aelo(help, 'mousedown', () => {manualSave();});
}
async function beginChangeControlInGame() {
  ui.disableMenu('more-options');
  await anim.fade('#more-options', 0, aTime);
  ui.showControl();
}
async function showQuitOptions() {
  ui.disableMenu('more-options');
  await anim.fade('#more-options', 0, aTime);
  await anim.fade('#quit-options', 1, aTime, {
    display: '',
  });
  ui.disableMenu('quit-options', false);
}
async function confirmQuit() {
  await ui.hideMore();
  await anim.fade('#gameplay-container', 0, aTime);
  gp.initializeObjects();
  gp.initializeView();
  pieces.shuffleFeatures();
  pieces.addImgs();
  autoSave.clear();
  ui.showStartOptions(true);
  anim.fade('#start-container', 1, aTime);
}

// Add more menu click handlers
ael('#hide-more', 'mousedown', () => {
  ui.hideMore();
});
ael('#save-point', 'mousedown', () => {
  savePoint();
});
ael('#begin-edit', 'mousedown', () => {
  edit.begin();
});
ael('#change-control', 'mousedown', () => {
  beginChangeControlInGame();
});
ael('#show-quit-options', 'mousedown', () => {
  showQuitOptions();
});
ael('#abort-quit', 'mousedown', () => {
  ui.hideMore();
});
ael('#confirm-quit', 'mousedown', () => {
  confirmQuit();
});
