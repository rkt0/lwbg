import {
  qs, ael, aelo, waitForClick,
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
  // else if (id === 'load-saved') loadSaved();
  // else if (id === 'load-overwrite') loadOverwrite();
  // else if (id === 'load-new') loadNew();
});

// Start screen click handlers
async function startNew() {
  startOptions.inert = true;
  await anim.fade(startOptions, 0, aTime);
  await showControl();
  if (debug.skipAutoSave) return startGame();
  ui.startMessage('save-introduction');
  anim.fade(startMessage, 1, aTime);
  await waitForClick(startContainer);
  try {await autoSave.createNewGameFile();}
  // catch {return ui.showStartOptions();}
  catch (error) {console.log(error);}
  ui.startMessage('save-created');
  await anim.fade(startMessage, 1, aTime);
  await waitForClick(startContainer);
  startGame();
}

// Needed for start screen click handlers
async function startGame() {
  const okToSave = await autoSave.checkPermission();
  if (!okToSave) {
    autoSave.fh = void 0;
    await anim.fade(startMessage, 0, aTime);
    return ui.showStartOptions();
  }
  await anim.fade(startContainer, 0, aTime);
  anim.fade(gameplayContainer, 1, aTime);
  gp.initializeView();
  gp.endTurn();
  // if (!gs.turn) gp.endTurn();
}
