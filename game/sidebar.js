import {qr, sleep} from './utility.js';
import {dom} from './dom.js';
import {anim} from './animation.js';

export const sb = {
  async show(identifier) {
    if (!identifier) return showSidebar();
    const {element, current} = menuItem[identifier];
    if (current) return;
    menuItem[identifier].current = true;
    await anim.slide(element, 'left', 1, aTime);
    if (isProperButton(element)) {
      element.disabled = false;
    }
  },
  async hide(identifier) {
    if (!identifier) return hideSidebar();
    const {element, current} = menuItem[identifier];
    if (!current) return;
    menuItem[identifier].current = false;
    if (isProperButton(element)) {
      if (element.disabled) return;
      element.disabled = true;
    }
    await anim.slide(element, 'left', 0, aTime);
  },
  async replace(identifierOld, identifierNew) {
    await this.hide(identifierOld);
    await this.show(identifierNew);
  },
  changeShowMoreButtonVisibility(setting) {
    const {element} = menuItem['show-more'];
    const value = setting ? 'visible' : 'hidden';
    element.style.visibility = value;
    element.disabled = !setting;
  },
  reset() {
    const entries = Object.entries(menuItem);
    for (const [ref, item] of entries) {
      // Set current to ensure that show/hide will run
      item.current = !item.initial;
      if (item.initial) this.show(ref);
      else this.hide(ref);
    }
  },
  async displayTurn(species, immediate) {
    const speciesText =
      species === 'human' ? 'Humans' :
      species === 'trex' ? 'T-Rex' : 'Raptors';
    if (turnSpan.textContent === speciesText) return;
    const fTime = immediate ? 0 : anim.time.turnFade;
    await anim.fade(turnSpan, 0, fTime);
    turnSpan.textContent = speciesText;
    anim.fade(turnSpan, 1, fTime);
  },
  async displayRollResult(rollState, immediate) {
    for (const die of Object.values(dom.dice)) {
      die.style.display = 'none';
      anim.cancelAll(die);
    }
    const {turn, rollN, rollGo} = rollState;
    const diceToRoll = [];
    const facesToShow = [];
    for (const type of ['movement', 'continue']) {
      const name = `${turn}-${type}`;
      const die = dom.dice[name];
      if (!die) continue;
      diceToRoll.push(die);
      die.style.display = 'inline';
      const faces = Object.values(dom.faces[name]);
      for (const face of faces) {
        face.style.display = 'none';
      }
      const r = type === 'movement' ? rollN : rollGo;
      facesToShow.push(dom.faces[name][r]);
    }
    await this.replace('roll-dice', 'roll-display');
    const {
      dieDelay = 0, dieSpin = 0, faceDelay = 0,
    } = immediate ? {} : anim.time;
    await sleep(dieDelay);
    const animations = [];
    for (const die of diceToRoll) {
      animations.push(anim.roll(die, dieSpin));
    }
    await sleep(faceDelay);
    const faceFade = dieSpin - faceDelay;
    for (const face of facesToShow) {
      animations.push(anim.fade(face, 1, faceFade));
    }
    await Promise.all(animations);
  },
};

// Element references
const sbElement = qr('sidebar');
const turnSpan = qr('turn-text');

// Menu item element references and status
const menuItem = {};
for (const element of sbElement.children) {
  const {ref} = element.dataset;
  if (!ref) continue;
  const initial = 'initial' in element.dataset;
  menuItem[ref] = {element, initial};
}

// Animation time for button slide
const aTime = anim.time.buttonSlide;

// Helper functions
function isProperButton(element) {
  const nn = element.nodeName.toLowerCase();
  return nn === 'button';
}
async function showSidebar() {
  await anim.slide(sbElement, 'left', 1, aTime);
  sbElement.inert = false;
}
async function hideSidebar() {
  sbElement.inert = true;
  await anim.slide(sbElement, 'left', 0, aTime);
}
