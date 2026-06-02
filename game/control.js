import {qs, qsa, ael, isNull} from './utility.js';
import {ai} from './ai.js';
import {anim} from './animation.js';

export const control = {
  async show() {
    await anim.fade(sectionControl, 1, aTime, {
      display: '',
    });
    sectionControl.inert = false;
    return new Promise((resolve) => {
      finish = async () => {
        sectionControl.inert = true;
        await anim.fade(sectionControl, 0, aTime);
        resolve();
      };
    });
  },
  change(species, level) {
    const area = areaElement[species];
    qs('.current', area)?.classList.remove('current');
    ai.control[species] = ai.level[species][level];
    const button = levelButtons[species][level];
    button.classList.add('current');
    ai.control.changed = true;
    if (isNull(ai.control.human)) return;
    if (isNull(ai.control.raptor)) return;
    if (!continueButton.disabled) return;
    continueButton.disabled = false;
    anim.fade(continueButton, 1, aTime);
  },
};

let finish;

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Element references
const sectionControl = qs('#control');
const continueButton = qs('#continue-from-control');
const areaElement = {};
const levelButtons = {};
for (const species of ['human', 'raptor']) {
  const area = qs(`.${species}-menu`, sectionControl);
  const buttons = qsa('button', area);
  buttons[-1] = buttons.shift();
  areaElement[species] = area;
  levelButtons[species] = buttons;
}

// Add player control screen click handler
ael(sectionControl, 'mousedown', (e) => {
  const button = e.target.closest('button');
  if (button === continueButton) return finish();
  const species = ['human', 'raptor'].find(
    (s) => areaElement[s].contains(e.target)
  );
  if (!button || !species) return;
  const i = levelButtons[species].indexOf(button);
  control.change(species, i);
});
