import {qs, aelo} from './utility.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {message} from './message.js';
import {edit} from './edit-mode.js';
import {showControl} from './player-control.js';

export const moreMenu = {
  element: qs('#more-menu'),
  async hide(resumeGameplay = true) {
    ui.disableMenu('more-menu');
    if (resumeGameplay) gp.resume();
    await anim.fade(this.element, 0, aTime);
    for (const child of this.element.children) {
      child.style.display = 'none';
    }
  },
  handleClick(e) {
    const id = e.target.closest('button')?.id;
    if (id === 'show-quit-options') showQuitOptions();
    else if (id === 'abort-quit') this.hide();
    else if (id === 'confirm-quit') confirmQuit();
    else if (id === 'hide-more') this.hide();
    else if (id === 'save-point') savePoint();
    else if (id === 'change-control') controlInGame();
    else if (id === 'begin-edit') {
      this.hide();
      edit.begin();
    }
  },
};


// Animation time for menu fade
const aTime = anim.time.menuFade;

// More menu click handlers
async function manualSave() {
  if (debug.skipAutoSave) {
    moreMenu.hide();
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
    message.show('manual-save-success');
  } finally {
    moreMenu.hide();
  }
}
async function savePoint() {
  ui.disableMenu('more-options');
  const help = qs('#manual-save-help');
  await anim.fade('#more-options', 0, aTime);
  await anim.fade(help, 1, aTime, {display: ''});
  aelo(help, 'mousedown', () => {manualSave();});
}
async function controlInGame() {
  await moreMenu.hide(false);
  showControl();
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
  await moreMenu.hide();
  await anim.fade('#gameplay-container', 0, aTime);
  gp.initializeObjects();
  gp.initializeView();
  pieces.shuffleFeatures();
  pieces.addImgs();
  autoSave.clear();
  ui.showStartOptions(true);
  anim.fade('#start-container', 1, aTime);
}
