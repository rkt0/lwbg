import {qs, aelo} from './utility.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {message} from './message.js';
import {edit} from './edit-mode.js';
import {showControl} from './player-control.js';
import {showStartOptions} from './pregame.js';

export const moreMenu = {
  element: qs('#more-menu'),
  async hide(resumeGameplay = true) {
    qs('#more-options').inert = true;
    qs('#quit-options').inert = true;
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
  if (debug.skipAutoSave) return moreMenu.hide();
  try {
    await autoSave.copyInGame();
    message.show('manual-save-success');
  } catch {
    // Do nothing
  } finally {
    moreMenu.hide();
  }
}
async function savePoint() {
  qs('#more-options').inert = true;
  const help = qs('#manual-save-help');
  await anim.fade('#more-options', 0, aTime);
  await anim.fade(help, 1, aTime, {display: ''});
  aelo(help, 'mousedown', () => manualSave());
}
async function controlInGame() {
  await moreMenu.hide(false);
  showControl();
}
async function showQuitOptions() {
  qs('#more-options').inert = true;
  await anim.fade('#more-options', 0, aTime);
  await anim.fade('#quit-options', 1, aTime, {
    display: '',
  });
  qs('#quit-options').inert = false;
}
async function confirmQuit() {
  qs('#quit-options').inert = true;
  await moreMenu.hide();
  await anim.fade('#gameplay-container', 0, aTime);
  gp.initializeObjects();
  gp.initializeView();
  pieces.shuffleFeatures();
  pieces.addImgs();
  showStartOptions(0);
  anim.fade('#start-container', 1, aTime);
}
