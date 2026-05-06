import {qs, qsa, ce, cssInt} from './utility.js';
import {anim} from './animation.js';
import {zd} from './game-objects.js';

export const ui = {
  showButton(id) {
    const element = qs(`#${id}`);
    element.style.display = 'inline';
    const l0 = {left: '0px'};
    const aTime = anim.time.buttonSlide;
    $(element).animate(l0, aTime, 'linear', () => {
      element.disabled = false;
    });
  },
  hideButton(id, after) {
    const element = qs(`#${id}`);
    element.disabled = true;
    const width = cssInt('--button-width');
    const lHide = {left: `-${width}px`};
    const aTime = anim.time.buttonSlide;
    $(element).animate(lHide, aTime, 'linear', () => {
      element.style.display = 'none';
      if (after) after();
    });
  },
  replaceButton(idOld, idNew) {
    ui.hideButton(idOld, () => {
      ui.showButton(idNew);
    });
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
      const die = qs(`#die-${turn}-${type}`);
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
    ui.replaceButton('roll-button', 'roll-display');
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
    const message = qs(`#${templateId}`).content;
    const node = message.cloneNode(true);
    qs('#start-message').replaceChildren(node);
  },
  showMessage(templateId, append) {
    const message = qs(`#${templateId}`).content;
    const node = message.cloneNode(true);
    const container = qs('#message-container');
    const content = qs('.content', container);
    const previousWasAppendable =
      container.classList.contains('appendable');
    if (append && previousWasAppendable) {
      content.append(ce('br'), node);
    } else content.replaceChildren(node);
    if (append) container.classList.add('appendable');
    content.style.visibility = 'visible';
    $(container).slideDown(anim.time.messageSlide);
  },
  hideMessage() {
    const container = qs('#message-container');
    if (!$(container).is(':visible')) return;
    if ($(container).is(':animated')) return;
    const content = qs('.content', container);
    content.style.visibility = 'hidden';
    const hider = qs('.hider', container);
    hider.style.display = 'none';
    container.classList.remove('appendable');
    $(container).slideUp(anim.time.messageSlide);
  },
  showGameOver(nSaved, nTotal) {
    qs('#humans-saved').innerHTML = nSaved;
    qs('#humans-total').innerHTML = nTotal;
    ui.hideMessage();
    ui.hideButton('roll-display');
    ui.hideButton('turn-display');
    if (zd.factor.current >= 1) {
      anim.fade('#game-over', 1, anim.time.menuFade);
    }
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
    ui.disableMenu('start-options', false);
    anim.fade('#start-options', 1, aTime, '');
  },
  async showControl() {
    const aTime = anim.time.menuFade;
    await anim.fade('#player-control', 1, aTime, '');
    ui.disableMenu('player-control', false);
  },
  toggleFullscreen() {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else document.exitFullscreen();
  },
  cycleDisplayMode () {
    const modes = ['', 'tv'];
    const valueOld = document.body.dataset.display;
    const indexOld = modes.indexOf(valueOld ?? '');
    const indexNew = (indexOld + 1) % modes.length;
    document.body.dataset.display = modes[indexNew];
  },
};
