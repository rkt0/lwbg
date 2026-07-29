import {qjs, cssInt} from './utility.js';
import {dom} from './dom.js';
import {anim} from './animation.js';

export const ui = {
  async showButton(identifier) {
    const element = menuItem[identifier];
    element.style.display = '';
    const aTime = anim.time.buttonSlide;
    const linear = {easing: 'linear'};
    await anim.move(element, leftShow, aTime, linear);
    if (isProperButton(element)) {
      element.disabled = false;
    }
  },
  async hideButton(identifier) {
    const element = menuItem[identifier];
    if (isProperButton(element)) {
      if (element.disabled) return;
      element.disabled = true;
    }
    const aTime = anim.time.buttonSlide;
    const linear = {easing: 'linear'};
    await anim.move(element, leftHide, aTime, linear);
    element.style.display = 'none';
  },
  async replaceButton(identifierOld, identifierNew) {
    await this.hideButton(identifierOld);
    this.showButton(identifierNew);
  },
  async displayTurn(species, skipFx) {
    const speciesText =
      species === 'human' ? 'Humans' :
      species === 'trex' ? 'T-Rex' : 'Raptors';
    if (turnSpan.innerHTML === speciesText) return;
    const aTime = skipFx ? 0 : anim.time.turnFade;
    await anim.fade(turnSpan, 0, aTime);
    turnSpan.innerHTML = speciesText;
    anim.fade(turnSpan, 1, aTime);
  },
  displayRollResult(rollState, skipFx) {
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
    this.replaceButton('roll-button', 'roll-display');
    const delay = skipFx ? 0 :
      anim.time.buttonSlide * 2 +
      anim.time.dieRollDelay;
    setTimeout(() => {
      for (const die of diceToRoll) {
        die.classList.add('rolled');
        if (skipFx) die.classList.add('no-animation');
      }
    }, delay);
  },
  humanItemsClickable(clickable) {
    const value = clickable ? 'auto' : 'none';
    humanClickableItems ??= [
      ...dom.humanSpace, ...dom.humanPiece,
    ];
    for (const item of humanClickableItems) {
      if (!item.classList.contains('building')) {
        item.style.pointerEvents = value;
      }
    }
  },
  raptorItemsClickable(clickable) {
    dom.board.style.pointerEvents =
      clickable ? 'visibleFill' : 'none';
    const valuePieces = clickable ? 'auto' : 'none';
    for (const element of dom.raptorPiece) {
      element.style.pointerEvents = valuePieces;
    }
  },
};

// Initialize on first use; elements do not exist yet
let humanClickableItems;

// Element references
const identifiers = [
  'roll-button', 'roll-display', 'unroll-dice',
  'ok-trex-move', 'ok-no-move', 'ok-ai-move',
  'decline', 'cancel', 'confirm', 'turn-display',
];
const menuItem = Object.fromEntries(identifiers.map(
  identifier => [identifier, qjs(identifier)]
));
const turnSpan = qjs('species-turn-text');

// Other values
const buttonWidth = cssInt('--button-width');
const leftShow = {left: '0px'};
const leftHide = {left: `-${buttonWidth}px`};

// Helper function
function isProperButton(element) {
  const nn = element.nodeName.toLowerCase();
  return nn === 'button';
}
