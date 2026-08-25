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
      die.classList.remove('rolled', 'no-animation');
    }
    const {turn, rollN, rollGo} = rollState;
    const diceToRoll = [];
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
      const value =
        type === 'movement' ? rollN : rollGo;
      dom.faces[name][value].style.display = 'block';
    }
    await this.replace('roll-dice', 'roll-display');
    const dieClasses = ['rolled'];
    if (immediate) dieClasses.push('no-animation');
    else await sleep(anim.time.dieRollDelay);
    for (const die of diceToRoll) {
      die.classList.add(...dieClasses);
    }
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
