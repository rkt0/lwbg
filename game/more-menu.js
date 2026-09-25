import {qjs, closestData} from './utility.js';
import {
  atClick, waitForClick,
} from './mouse-events.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {message} from './message.js';
import {sb} from './sidebar.js';
import {control} from './control.js';
import {gp} from './gameplay.js';
import {toggle} from './toggle.js';
import {audioPanel} from './audio-panel.js';
import {edit} from './edit-mode.js';
import {autoSave} from './auto-save.js';
import {showStartOptions} from './pregame.js';

export const moreMenu = {
  isActive() {
    return section.style.display !== 'none';
  },
  async show() {
    gp.interrupt();
    const aOpts = {display: ''};
    anim.fade(moreOptions, 1, 0, aOpts);
    await anim.fade(section, 1, aTime, aOpts);
    moreOptions.inert = false;
  },
  async hide(resumeGameplay = true) {
    moreOptions.inert = true;
    quitOptions.inert = true;
    if (resumeGameplay) gp.resume();
    await anim.fade(section, 0, aTime);
    for (const child of section.children) {
      child.style.display = 'none';
    }
  },
};

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const section = qjs('more-menu');
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
async function showAudioPanel() {
  await moreMenu.hide(false);
  await audioPanel.show();
  gp.resume();
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
  dom.gameplay.inert = true;
  await moreMenu.hide();
  await Promise.all([
    sb.hide(),
    toggle.hideGroup(),
    message.hide(),
    anim.fade(dom.gameOver, 0, aTime),
  ]);
  dom.hud.style.display = 'none';
  await anim.fade(dom.gameplay, 0, aTime);
  sb.reset();
  gp.clearMoveObject();
  gp.clearVisibleMove();
  gp.initializeObjects();
  gp.initializeView();
  pieces.shuffleFeatures();
  pieces.addImgs();
  showStartOptions(0);
  anim.fade(dom.start, 1, aTime, {display: ''});
}
function beginEdit() {
  moreMenu.hide();
  edit.begin();
}

// Dispatch table for click handler
const dispatch = {
  'show-quit': showQuit,
  'abort-quit': () => moreMenu.hide(),
  'confirm-quit': confirmQuit,
  'hide-more': () => moreMenu.hide(),
  'save-point': savePoint,
  'change-control': controlInGame,
  'begin-edit': beginEdit,
  'show-audio-more': showAudioPanel,
};

// Add click handler
atClick(section, (e) => dispatch[closestData(e)]?.());
