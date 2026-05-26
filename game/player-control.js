import {qs, ael, isNull} from './utility.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {gs} from './game-objects.js';

export const control = {
  element: qs('#player-control'),
  async show() {
    await anim.fade(this.element, 1, aTime, {
      display: '',
    });
    this.element.inert = false;
    return new Promise((resolve) => {
      hideAndResolve = async () => {
        this.element.inert = true;
        await anim.fade(this.element, 0, aTime);
        resolve();
      }
    })
  },
  change(species, level) {
    const area = qs(`#${species}-control`);
    qs('.current', area)?.classList.remove('current');
    if (level === -1) {
      qs('.manual', area).classList.add('current');
      ai.control[species] = false;
    } else {
      const aiButton = qs(`.ai-${level}`, area);
      aiButton.classList.add('current');
      ai.control[species] = ai.level[species][level];
    }
    if (gs.turn) ai.control.changed = true;
    if (isNull(ai.control.human)) return;
    if (isNull(ai.control.raptor)) return;
    const button = qs('#continue-from-control');
    anim.fade(button, 1, aTime);
    button.style.pointerEvents = 'auto';
  },
};

let hideAndResolve;

// Animation time for menu fade
const aTime = anim.time.menuFade;

// Add player control screen click handler
ael('#continue-from-control', 'mousedown', () => {
  hideAndResolve();
});
for (const species of ['human', 'raptor']) {
  const area = `#${species}-control`;
  ael(`${area} .manual`, 'mousedown', () => {
    control.change(species, -1);
  });
  for (let i = 0; i < ai.level[species].length; i++) {
    ael(`${area} .ai-${i}`, 'mousedown', () => {
      control.change(species, i);
    });
  }
}
