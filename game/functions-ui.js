import {cssInt} from './utility.js';
import {anim} from './animation.js';
import {zd} from './game-objects.js';

// Container object for UI-related functions
export const ui = {};

// Gameplay menu
{
  ui.showButton = id => {
    const $button = $(`#${id}`);
    $button.css('display', 'inline').animate(
      {left: '0px'},
      anim.time.buttonSlide, 'linear',
      () => $button.prop('disabled', false)
    );
  };
  ui.hideButton = (id, after) => {
    const $button = $(`#${id}`);
    $button.prop('disabled', true).animate(
      {left: `-${cssInt('--button-width')}px`},
      anim.time.buttonSlide, 'linear',
      () => {
        $button.css('display', 'none');
        if (after) after();
      }
    );
  };
  ui.replaceButton = (idOld, idNew) => {
    ui.hideButton(idOld, () => ui.showButton(idNew));
  };
  ui.displayTurn = (species, skipFx) => {
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
  };
  ui.displayRollResult = (rollState, skipFx) => {
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
    const aString = skipFx ? ' no-animation' : '';
    const delay = skipFx ? 0 :
        anim.time.buttonSlide * 2 +
        anim.time.dieRollDelay;
    setTimeout(
      () => $dice.addClass(`rolled${aString}`), delay
    );
  };
}

// Messages and game over
{
  ui.showMessage = (message, append) => {
    const $container = $('#message-container');
    const $content = $('#message-container .content');
    const retainedMessage = (
      append && $container.hasClass('appendable')
    ) ? ($content.html() + '<br>') : '';
    if (append) $container.addClass('appendable');
    $content.html(retainedMessage + message)
        .css('visibility', 'visible');
    $container.slideDown(anim.time.messageSlide);
  };
  ui.hideMessage = () => {
    const $container = $('#message-container');
    if (! $container.is(':visible')) return;
    if ($container.is(':animated')) return;
    $('#message-container .content')
        .css('visibility', 'hidden');
    $('#message-container .hider')
        .css('display', 'none');
    $container.removeClass('appendable')
        .slideUp(anim.time.messageSlide);
  };
  ui.showGameOver = (nSaved, nTotal) => {
    const gameOverHtml = '<h1>Game Over</h1>' +
        `Humans Saved:<br>${nSaved} of ${nTotal}`;
    ui.hideMessage();
    ui.hideButton('roll-display');
    ui.hideButton('turn-display');
    const $el = $('#game-over');
    $el.html(gameOverHtml);
    if (zd.factor.current >= 1) {
      $el.fadeIn(anim.time.menuFade);
    }
  };
}

// Enable or disable clicks
{
  ui.disableMenu = (id, disable) => {
    const d = disable ?? true;
    $(`#${id}`).find('button').prop('disabled', d);
  };
  ui.humanItemsClickable = clickable => {
    $(
      '.human-space:not(.building), .human-piece'
    ).css(
      'pointer-events', clickable ? 'auto' : 'none'
    );
  };
  ui.raptorItemsClickable = clickable => {
    $('#raptor-map').css('pointer-events',
      clickable ? 'visibleFill' : 'none'
    );
    $('.raptor-piece').css('pointer-events',
      clickable ? 'auto' : 'none'
    );
  };
}

// Show special screens
{
  ui.showStartOptions = skipFx => {
    const aTime = skipFx ? 0 : anim.time.menuFade;
    $('#start-message').fadeOut(aTime, () => {
      ui.disableMenu('start-options', false);
      $('#start-options').fadeIn(aTime);
    });
  };
  ui.showControl = () => {
    $('#player-control').fadeIn(anim.time.menuFade,
      () => ui.disableMenu('player-control', false)
    );
  };
}

// Make various UI-related structures
{
  ui.makeFlexContainer = (where, id) => {
    $('<div></div>').attr('id', id)
        .css('display', 'none')
        .addClass('flex-container').appendTo(where);
  };
  ui.makeOption = (where, id, label, handler) => {
    const $button = $('<button></button>');
    if (id) $button.attr('id', id);
    if (handler) $button.click(handler);
    $button.attr('type', 'button').html(label)
        .appendTo(where);
  };
  ui.makeInstruction = (where, instruction) => {
    $('<div></div>').addClass('info')
        .html(instruction).appendTo(where);
  };
  ui.asParagraphs = (...strArr) => {
    return strArr.map(x => `<p>${x}</p>`).join('');
  };
}

// Change display options
{
  ui.toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else document.exitFullscreen();
  };
  ui.displayModes = ['', 'tv'];
  ui.cycleDisplayMode = () => {
    const modes = ui.displayModes;
    const valueOld = document.body.dataset.display;
    const indexOld = modes.indexOf(valueOld ?? '');
    const indexNew = (indexOld + 1) % modes.length;
    document.body.dataset.display = modes[indexNew];
  };
}
