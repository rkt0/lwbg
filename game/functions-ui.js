import {cssInt} from './utility.js';
import {anim} from './animation.js';
import {zd} from './game-objects.js';

export const ui = {
  showButton(id) {
    const $button = $(`#${id}`);
    $button.css('display', 'inline').animate(
      {left: '0px'},
      anim.time.buttonSlide, 'linear',
      () => {$button.prop('disabled', false);}
    );
  },
  hideButton(id, after) {
    const $button = $(`#${id}`);
    $button.prop('disabled', true).animate(
      {left: `-${cssInt('--button-width')}px`},
      anim.time.buttonSlide, 'linear',
      () => {
        $button.css('display', 'none');
        if (after) after();
      }
    );
  },
  replaceButton(idOld, idNew) {
    ui.hideButton(idOld, () => {
      ui.showButton(idNew);
    });
  },
  displayTurn(species, skipFx) {
    const speciesText =
      species === 'human' ? 'Humans' :
      species === 'trex' ? 'T-Rex' : 'Raptors';
    const $div = $('#turn-display-content');
    if ($div.text().endsWith(speciesText)) return;
    const $span = $('#species-turn-text');
    const aTime = skipFx ? 0 : anim.time.turnFade;
    $span.fadeOut(aTime,
      () => {$span.html(speciesText).fadeIn(aTime);}
    );
  },
  displayRollResult(rollState, skipFx) {
    $('.die').css('display', 'none')
      .removeClass('rolled no-animation');
    const {turn, rollN, rollGo} = rollState;
    const $dice = $(`.die-${turn}`);
    $dice.css('display', 'inline');
    for (const die of ['movement', 'continue']) {
      const cSel = `.face-${turn}.face-${die}`;
      $(cSel).css('display', 'none');
      const aSel = `[data-roll="${
        die === 'movement' ? rollN : rollGo
      }"]`;
      $(`${cSel}${aSel}`).css('display', 'block');
    }
    ui.replaceButton('roll-button', 'roll-display');
    const delay = skipFx ? 0 :
      anim.time.buttonSlide * 2 +
      anim.time.dieRollDelay;
    setTimeout(() => {
      $dice.addClass('rolled');
      if (skipFx) $dice.addClass('no-animation');
    }, delay);
  },
  startMessage(templateId) {
    $('#start-message')[0].replaceChildren(
      $(`#${templateId}`)[0].content.cloneNode(true)
    );
  },
  showMessage(templateId, append) {
    const template = $(`#${templateId}`)[0];
    const message = template.innerHTML.trim();
    const $container = $('#message-container');
    const $content = $('#message-container .content');
    const retainedMessage = (
      append && $container.hasClass('appendable')
    ) ? ($content.html() + '<br>') : '';
    if (append) $container.addClass('appendable');
    $content.html(retainedMessage + message)
      .css('visibility', 'visible');
    $container.slideDown(anim.time.messageSlide);
  },
  hideMessage() {
    const $container = $('#message-container');
    if (!$container.is(':visible')) return;
    if ($container.is(':animated')) return;
    $('#message-container .content')
      .css('visibility', 'hidden');
    $('#message-container .hider')
      .css('display', 'none');
    $container.removeClass('appendable')
      .slideUp(anim.time.messageSlide);
  },
  showGameOver(nSaved, nTotal) {
    $('#humans-saved').html(nSaved);
    $('#humans-total').html(nTotal);
    ui.hideMessage();
    ui.hideButton('roll-display');
    ui.hideButton('turn-display');
    const $el = $('#game-over');
    if (zd.factor.current >= 1) {
      $el.fadeIn(anim.time.menuFade);
    }
  },
  disableMenu(id, disable) {
    const d = disable ?? true;
    $(`#${id}`).find('button').prop('disabled', d);
  },
  humanItemsClickable(clickable) {
    const value = clickable ? 'auto' : 'none';
    $('.human-space:not(.building), .human-piece')
      .css('pointer-events', value);
  },
  raptorItemsClickable(clickable) {
    const valueM = clickable ? 'visibleFill' : 'none';
    $('#raptor-map').css('pointer-events', valueM);
    const valueP = clickable ? 'auto' : 'none';
    $('.raptor-piece').css('pointer-events', valueP);
  },
  showStartOptions(skipFx) {
    const aTime = skipFx ? 0 : anim.time.menuFade;
    $('#start-message').fadeOut(aTime, () => {
      ui.disableMenu('start-options', false);
      $('#start-options').fadeIn(aTime);
    });
  },
  showControl() {
    const aTime = anim.time.menuFade;
    $('#player-control').fadeIn(aTime, () => {
      ui.disableMenu('player-control', false);
    });
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
