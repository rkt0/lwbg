import {qs, qsa, ael, isNull} from './utility.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs} from './game-objects.js';

export const control = {
  async show() {
    await anim.fade(element, 1, aTime, {
      display: '',
    });
    element.inert = false;
    return new Promise((resolve) => {
      hideAndResolve = async () => {
        element.inert = true;
        await anim.fade(element, 0, aTime);
        resolve();
      }
    })
  },
  change(species, level) {
    const area = areaElement[species];
    qs('.current', area)?.classList.remove('current');
    ai.control[species] = ai.level[species][level];
    const button = levelButtons[species][level];
    button.classList.add('current');
    if (gs.turn) ai.control.changed = true;
    if (isNull(ai.control.human)) return;
    if (isNull(ai.control.raptor)) return;
    anim.fade(continueButton, 1, aTime);
    continueButton.style.pointerEvents = 'auto';
  },
};

let hideAndResolve;

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const element = qs('#player-control');
const continueButton = qs('#continue-from-control');
const areaElement = {};
const levelButtons = {};
for (const species of ['human', 'raptor']) {
  const area = qs(`#${species}-control`);
  const buttons = qsa('button', area);
  buttons[-1] = buttons.shift();
  areaElement[species] = area;
  levelButtons[species] = buttons;
}

// Add player control screen click handler
ael(continueButton, 'mousedown', () => {
  hideAndResolve();
});
for (const species of ['human', 'raptor']) {
  const area = qs(`#${species}-control`);
  const manualButton = qs('.manual', area);
  ael(manualButton, 'mousedown', () => {
    control.change(species, -1);
  });
  for (let i = 0; i < ai.level[species].length; i++) {
    const levelButton =
      qs(`[data-level="${i}"]`, area);
    ael(levelButton, 'mousedown', () => {
      control.change(species, i);
    });
  }
}
