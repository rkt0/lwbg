'use strict';

const ui = {
  showButton(id) {
    const $button = $(`#${id}`);
    $button.css('display', 'inline').animate(
      {left: '0px'},
      anim.time.buttonSlide, 'linear',
      () => $button.prop('disabled', false)
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
  replaceButton(idToHide, idToShow) {
    this.hideButton(
      idToHide, () => this.showButton(idToShow)
    );
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
      () => $span.html(speciesText).fadeIn(aTime)
    );
  },
  displayRollResult(skipFx) {
    $('.die').css('display', 'none')
      .removeClass('rolled no-animation');
    const $dice = $(`.die-${gs.turn}`);
    $dice.css('display', 'inline');
    for (const type of ['movement', 'continue']) {
      const cSel = `.face-${gs.turn}.face-${type}`;
      $(cSel).css('display', 'none');
      const x = type === 'movement' ? 'N' : 'Go';
      const dataRoll = gs[`roll${x}`];
      const aSel = `[data-roll="${dataRoll}"]`;
      $(`${cSel}${aSel}`).css('display', 'block');
    }
    this.replaceButton('roll-button', 'roll-display');
    const aString = skipFx ? ' no-animation' : '';
    const delay = skipFx ? 0 :
      anim.time.buttonSlide * 2 +
      anim.time.dieRollDelay;
    setTimeout(
      () => $dice.addClass(`rolled${aString}`), delay
    );
  },
  showMessage(message, append) {
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
  showGameOver() {
    const nSaved = gp.nHumansOn(bd.humanGoal);
    const nTotal = gs.humans.length;
    const gameOverHtml = '<h1>Game Over</h1>' +
      `Humans Saved:<br>${nSaved} of ${nTotal}`;
    this.hideMessage();
    this.hideButton('roll-display');
    this.hideButton('turn-display');
    const $el = $('#game-over');
    $el.html(gameOverHtml);
    if (zd.factor.current >= 1) {
      $el.fadeIn(anim.time.menuFade);
    }
  },
  disableMenu(id, disable) {
    const d = disable ?? true;
    $(`#${id}`).find('button').prop('disabled', d);
  },
  humanItemsClickable(clickable) {
    $(
      '.human-space:not(.building), .human-piece'
    ).css(
      'pointer-events', clickable ? 'auto' : 'none'
    );
  },
  raptorItemsClickable(clickable) {
    $('#raptor-map').css('pointer-events',
      clickable ? 'visibleFill' : 'none'
    );
    $('.raptor-piece').css('pointer-events',
      clickable ? 'auto' : 'none'
    );
  },
  showStartOptions(skipFx) {
    const aTime = skipFx ? 0 : anim.time.menuFade;
    $('#start-message').fadeOut(aTime, () => {
      this.disableMenu('start-options', false);
      $('#start-options').fadeIn(aTime);
    });
  },
  showControl() {
    $('#player-control').fadeIn(anim.time.menuFade,
      () => ui.disableMenu('player-control', false)
    );
  },
  makeFlexContainer(where, id) {
    $('<div></div>').attr('id', id)
      .css('display', 'none')
      .addClass('flex-container').appendTo(where);
  },
  makeOption(where, id, label, handler) {
    const $button = $('<button></button>');
    if (id) $button.attr('id', id);
    if (handler) $button.click(handler);
    $button.attr('type', 'button').html(label)
      .appendTo(where);
  },
  makeInstruction(where, instruction) {
    $('<div></div>').addClass('info')
      .html(instruction).appendTo(where);
  },
  asParagraphs(...strArr) {
    return strArr.map(x => `<p>${x}</p>`).join('');
  },
  toggleFullscreen() {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else document.exitFullscreen();
  },
  displayModes:  ['', 'tv'],
  cycleDisplayMode() {
    const modes = this.displayModes;
    const valueOld = document.body.dataset.display;
    const indexOld = modes.indexOf(valueOld);
    const indexNew = (indexOld + 1) % modes.length;
    document.body.dataset.display = modes[indexNew];
  },
};
