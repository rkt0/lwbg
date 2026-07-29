import {
  qjs, qda, closestData, ael,
} from './utility.js';
import {anim} from './animation.js';
import {ai} from './ai.js';

export const control = {
  async show() {
    await anim.fade(section, 1, aTime, {
      display: '',
    });
    section.inert = false;
    return new Promise((resolve) => {
      finish = async () => {
        section.inert = true;
        await anim.fade(section, 0, aTime);
        resolve();
      };
    });
  },
  change(species, level) {
    const buttons = levelButtons[species];
    // Use Object.values() to include buttons[-1]
    for (const button of Object.values(buttons)) {
      button.classList.remove('current');
    }
    buttons[level].classList.add('current');
    ai.control[species] = ai.level[species][level];
    ai.control.changed = true;
    if (!continueButton.disabled) return;
    const {human, raptor} = ai.control;
    if (human === null || raptor === null) return;
    continueButton.disabled = false;
    anim.fade(continueButton, 1, aTime);
  },
};

let finish;

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const section = qjs('control');
const continueButton = qjs('control-continue');
const levelButtons = {};
for (const area of qda('control-species')) {
  const species = area.dataset.controlSpecies;
  const buttons = qda('control-level', area);
  buttons[-1] = buttons.shift();
  levelButtons[species] = buttons;
}

// Add player control screen click handler
ael(section, 'mousedown', (e) => {
  if (continueButton.contains(e.target)) {
    return finish();
  }
  const levelData = closestData(e, 'control-level');
  const species = closestData(e, 'control-species');
  if (!levelData || !species) return;
  control.change(species, +levelData);
});
