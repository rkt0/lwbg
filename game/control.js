import {
  qjs, qd, qda, closestData, ael, fromTemplate,
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
  async change(species, level) {
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
    await anim.fade(continueButton, 1, aTime);
    continueButton.disabled = false;
  },
};

// Initialize control buttons
const levelButtons = {};
for (const menu of qda('control-species')) {
  const species = menu.dataset.controlSpecies;
  const buttons = []
  buttons[-1] = qd('control-level', menu);
  const aiLevels = qd('ai-levels', menu);
  for (const level of ai.level[species].keys()) {
    const button = fromTemplate(
      'ai-level-button', true,
    );
    button.dataset.controlLevel = level;
    button.textContent = level;
    buttons.push(button);
    aiLevels.append(button);
  }
  levelButtons[species] = buttons;
}

// Must be in this scope
let finish;

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Other element references
const section = qjs('control');
const continueButton = qjs('control-continue');

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
