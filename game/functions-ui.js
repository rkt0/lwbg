import {qs, qsa, cssInt} from './utility.js';
import {dom} from './dom.js';
import {anim} from './animation.js';

export const ui = {
  async showButton(id) {
    const element = qs(`#${id}`);
    element.style.display = 'inline';
    const aTime = anim.time.buttonSlide;
    await anim.move(element, {left: '0px'}, aTime, {
      easing: 'linear',
    });
    element.disabled = false;
  },
  async hideButton(id) {
    const element = qs(`#${id}`);
    element.disabled = true;
    await anim.move(element, {
      left: `-${cssInt('--button-width')}px`,
    }, anim.time.buttonSlide, {easing: 'linear'});
    element.style.display = 'none';
  },
  async replaceButton(idOld, idNew) {
    await this.hideButton(idOld);
    this.showButton(idNew);
  },
  async displayTurn(species, skipFx) {
    const speciesText =
      species === 'human' ? 'Humans' :
      species === 'trex' ? 'T-Rex' : 'Raptors';
    const span = qs('#species-turn-text');
    if (span.innerHTML === speciesText) return;
    const aTime = skipFx ? 0 : anim.time.turnFade;
    await anim.fade(span, 0, aTime);
    span.innerHTML = speciesText;
    anim.fade(span, 1, aTime);
  },
  displayRollResult(rollState, skipFx) {
    for (const die of qsa('.die')) {
      die.style.display = 'none';
      die.classList.remove('rolled', 'no-animation');
    }
    const {turn, rollN, rollGo} = rollState;
    const diceToRoll = [];
    for (const type of ['movement', 'continue']) {
      const die = qs(`.die-${turn}.die-${type}`);
      if (!die) continue;
      diceToRoll.push(die);
      die.style.display = 'inline';
      for (const face of qsa('.face', die)) {
        face.style.display = 'none';
      }
      const value =
        type === 'movement' ? rollN : rollGo;
      const face = qs(`[data-roll="${value}"]`, die);
      face.style.display = 'block';
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
    dom.raptorMap.style.pointerEvents =
      clickable ? 'visibleFill' : 'none';
    const valuePieces = clickable ? 'auto' : 'none';
    for (const element of dom.raptorPiece) {
      element.style.pointerEvents = valuePieces;
    }
  },
};

let humanClickableItems;
