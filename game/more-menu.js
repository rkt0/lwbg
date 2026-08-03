import {
  qjs, closestData, waitForClick,
} from './utility.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {message} from './message.js';
import {control} from './control.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';
import {autoSave} from './auto-save.js';
import {showStartOptions} from './pregame.js';

export const moreMenu = {
  element: qjs('more-menu'),
  isActive() {
    return this.element.style.display === 'block';
  },
  async show() {
    gp.interrupt();
    const aOpts = {display: ''};
    anim.fade(moreOptions, 1, 0, aOpts);
    await anim.fade(this.element, 1, aTime, aOpts);
    moreOptions.inert = false;
  },
  async hide(resumeGameplay = true) {
    moreOptions.inert = true;
    quitOptions.inert = true;
    if (resumeGameplay) gp.resume();
    await anim.fade(this.element, 0, aTime);
    for (const child of this.element.children) {
      child.style.display = 'none';
    }
  },
  handleClick(e) {
    const js = closestData(e);
    if (js === 'show-quit') showQuit();
    else if (js === 'abort-quit') this.hide();
    else if (js === 'confirm-quit') confirmQuit();
    else if (js === 'hide-more') this.hide();
    else if (js === 'save-point') savePoint();
    else if (js === 'change-control') controlInGame();
    else if (js === 'begin-edit') {
      this.hide();
      edit.begin();
    }
  },
};

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const moreOptions = qjs('more-options');
const quitOptions = qjs('quit-options');
const saveHelp = qjs('manual-save-help');

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
  moreOptions.inert = true;
  await anim.fade(moreOptions, 0, aTime);
  await anim.fade(saveHelp, 1, aTime, {display: ''});
  await waitForClick(saveHelp);
  manualSave();
}
async function controlInGame() {
  await moreMenu.hide(false);
  await control.show();
  gp.resume();
  gp.handleControlChange();
}
async function showQuit() {
  moreOptions.inert = true;
  await anim.fade(moreOptions, 0, aTime);
  await anim.fade(quitOptions, 1, aTime, {
    display: '',
  });
  quitOptions.inert = false;
}
async function confirmQuit() {
  quitOptions.inert = true;
  await moreMenu.hide();
  await anim.fade(dom.gameplay, 0, aTime);
  gp.initializeObjects();
  gp.initializeView();
  pieces.shuffleFeatures();
  pieces.addImgs();
  showStartOptions(0);
  anim.fade(dom.start, 1, aTime, {display: ''});
}
