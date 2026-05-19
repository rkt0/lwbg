import {
  qs, qsa, ce, fromTemplate, cssInt,
} from './utility.js';
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
  startMessage(templateId) {
    const node = fromTemplate(templateId);
    qs('#start-message').replaceChildren(node);
  },
  showMessage(templateId, append) {
    const node = fromTemplate(templateId);
    const container = qs('#message-container');
    const content = qs('.content', container);
    const previousWasAppendable =
      container.classList.contains('appendable');
    if (append && previousWasAppendable) {
      content.append(ce('br'), node);
    } else content.replaceChildren(node);
    if (append) container.classList.add('appendable');
    content.style.visibility = 'visible';
    anim.slide(container, 1, anim.time.messageSlide);
  },
  hideMessage() {
    const container = qs('#message-container');
    if (container.style.display === 'none') return;
    if (anim.isAnimated(container)) return;
    const content = qs('.content', container);
    content.style.visibility = 'hidden';
    const hider = qs('.hider', container);
    hider.style.display = 'none';
    container.classList.remove('appendable');
    anim.slide(container, 0, anim.time.messageSlide);
  },
  disableMenu(id, disable) {
    for (const button of qsa(`#${id} button`)) {
      button.disabled = disable ?? true;
    }
  },
  humanItemsClickable(clickable) {
    const value = clickable ? 'auto' : 'none';
    const items = qsa(
      '.human-space:not(.building), .human-piece'
    );
    for (const item of items) {
      item.style.pointerEvents = value;
    }
  },
  raptorItemsClickable(clickable) {
    const valueMap =
      clickable ? 'visibleFill' : 'none';
    const valuePieces = clickable ? 'auto' : 'none';
    qs('#raptor-map').style.pointerEvents = valueMap;
    for (const element of qsa('.raptor-piece')) {
      element.style.pointerEvents = valuePieces;
    }
  },
  async showStartOptions(skipFx) {
    const aTime = skipFx ? 0 : anim.time.menuFade;
    await anim.fade('#start-message', 0, aTime);
    this.disableMenu('start-options', false);
    anim.fade('#start-options', 1, aTime, {
      display: '',
    });
  },
  async showControl() {
    const aTime = anim.time.menuFade;
    await anim.fade('#player-control', 1, aTime, {
      display: '',
    });
    this.disableMenu('player-control', false);
  },
  async hideMore() {
    this.disableMenu('more-menu');
    const moreMenu = qs('#more-menu');
    await anim.fade(moreMenu, 0, anim.time.menuFade);
    for (const child of moreMenu.children) {
      child.style.display = 'none';
    }
    document.body.style.overflow = 'visible';
  },
};
