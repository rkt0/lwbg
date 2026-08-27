import {qjs, cssValue, sleep} from './utility.js';
import {dom} from './dom.js';
import {anim} from './animation.js';

export const sb = {
  async show(identifier) {
    if (!identifier) return showSidebar();
    const element = menuItem[identifier];
    element.style.display = '';
    await anim.move(element, leftShow, bTime, linear);
    if (isProperButton(element)) {
      element.disabled = false;
    }
  },
  async hide(identifier) {
    if (!identifier) return hideSidebar();
    const element = menuItem[identifier];
    if (isProperButton(element)) {
      if (element.disabled) return;
      element.disabled = true;
    }
    await anim.move(element, leftHide, bTime, linear);
    element.style.display = 'none';
  },
  async replace(identifierOld, identifierNew) {
    await this.hide(identifierOld);
    await this.show(identifierNew);
  },
  reset() {
    const items = Object.entries(menuItem);
    for (const [js, element] of items) {
      if ('active' in element.dataset) this.show(js);
      else this.hide(js);
    }
  },
  async displayTurn(species, immediate) {
    const speciesText =
      species === 'human' ? 'Humans' :
      species === 'trex' ? 'T-Rex' : 'Raptors';
    if (turnSpan.textContent === speciesText) return;
    const aTime = immediate ? 0 : anim.time.turnFade;
    await anim.fade(turnSpan, 0, aTime);
    turnSpan.textContent = speciesText;
    anim.fade(turnSpan, 1, aTime);
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
    const spins = anim.dieSpinCount;
    for (const die of diceToRoll) {
      animations.push(anim.roll(die, spins, dieSpin));
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
const sbElement = qjs('sidebar');
const identifiers = [
  'roll-dice', 'roll-display', 'unroll-dice',
  'ok-trex-move', 'ok-no-move', 'ok-ai-move',
  'decline', 'cancel', 'confirm', 'turn-display',
];
const menuItem = Object.fromEntries(identifiers.map(
  identifier => [identifier, qjs(identifier)]
));
const turnSpan = qjs('turn-text');

// Other values
const buttonWidth = cssValue('--button-width');
const leftShow = {left: '0px'};
const leftHide = {left: `-${buttonWidth}px`};
const bTime = anim.time.buttonSlide;
const linear = {easing: 'linear'};

// Helper functions
function isProperButton(element) {
  const nn = element.nodeName.toLowerCase();
  return nn === 'button';
}
async function showSidebar() {
  sbElement.style.display = '';
  await anim.move(sbElement, leftShow, bTime, linear);
  sbElement.inert = false;
}
async function hideSidebar() {
  sbElement.inert = true;
  await anim.move(sbElement, leftHide, bTime, linear);
  sbElement.style.display = 'none';
}
