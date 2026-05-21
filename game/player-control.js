import {qs, ael, isNull} from './utility.js';
import {debug} from './debug.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';

export async function showControl() {
  await anim.fade('#player-control', 1, aTime, {
    display: '',
  });
  ui.disableMenu('player-control', false);
}

// Inject into auto-save object
autoSave.startGameFromLoad = () => {
  gp.interrupt(0);
  showControl();
};

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Needed for player control screen click handlers
async function savePlayers() {
  if (!ai.control.changed) return;
  ai.control.changed = false;
  if (debug.skipAutoSave) return;
  const file = await autoSave.fh.getFile();
  const contents = await file.text();
  const writable = await autoSave.fh.createWritable();
  await writable.write(contents);
  const playerCode = ai.control.fullSaveCode();
  await writable.write(playerCode + ';');
  await writable.close();
}
function continueInGame() {
  savePlayers();
  message.hide();
  gp.resume();
  anim.fade('#player-control', 0, aTime);
  if (ai.control[gs.turn] && gs.phase !== 'roll') {
    click('#cancel-button');
    ui.hideButton('ok-no-move');
    ui.hideButton('decline-button');
    ui.showButton('ok-ai-move');
  } else {
    ui.hideButton('ok-ai-move');
    if (gs.je) gp.startJumpEnter();
  }
}
async function continueAtStart() {
  await anim.fade('#player-control', 0, aTime);
  autoSave.begin();
};
function changeControl(species, level) {
  const area = qs(`#${species}-control`);
  qs('.current', area)?.classList.remove('current');
  if (level === -1) {
    qs('.manual', area).classList.add('current');
    ai.control[species] = false;
  } else {
    qs(`.ai-${level}`, area).classList.add('current');
    ai.control[species] = ai.level[species][level];
  }
  if (gs.turn) ai.control.changed = true;
  if (isNull(ai.control.human)) return;
  if (isNull(ai.control.raptor)) return;
  const button = qs('#continue-from-control');
  anim.fade(button, 1, aTime);
  button.style.pointerEvents = 'auto';
}

// Add player control screen click handlers
ael('#continue-from-control', 'mousedown', () => {
  ui.disableMenu('player-control');
  if (gs.turn) continueInGame();
  else continueAtStart();
});
for (const species of ['human', 'raptor']) {
  const area = `#${species}-control`;
  ael(`${area} .manual`, 'mousedown', () => {
    changeControl(species, -1);
  });
  for (let i = 0; i < ai.level[species].length; i++) {
    ael(`${area} .ai-${i}`, 'mousedown', () => {
      changeControl(species, i);
    });
  }
}
