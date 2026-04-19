import {
  deepCopy, isNull, rollDie, cssInt,
} from './utility.js';
import {debug} from './debug.js';
import {prng} from './prngs.js';
import {bd, dice} from './logic.js';
import {ai} from './ai.js';
import {anim} from './animation.js';
import {pieces} from './pieces.js';
import {music} from './music.js';
import {sfx} from './sfx.js';
import {gs, mv, zd, pl} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';



// Set display to none on dormant elements
$('.dormant').css('display', 'none');

// Initialize dormant elements in gameplay menu
$('#gameplay-menu > .dormant:not(.edit-control)')
  .each((_, e) => {ui.hideButton(e.id);});

// Animation time for menu fade
const aTime = anim.time.menuFade;



// Full-screen interfaces outside of normal gameplay

// Title screen
{
  $('#title-container').one('click', () => {
    $('#title-container').fadeOut(aTime, () => {
      $('#start-container').fadeIn(aTime);
      music.next();
    });
  });
}

// Start screen
{

  $('#start-new').click(() => {
    ui.disableMenu('start-options');
    $('#start-options')
        .fadeOut(aTime, ui.showControl);
  });

  const loadOverwrite = async fhLoad => {
    ui.disableMenu('load-choose-save');
    const okAlready = await fhLoad.queryPermission({
      mode: 'readwrite',
    });
    autoSave.fh = fhLoad;
    ui.startMessage(`load-permission-${okAlready}`);
    $('#load-choose-save').fadeOut(aTime,
      () => $('#start-message').fadeIn(aTime,
        () => $('#start-container').one('click',
          () => autoSave.begin(fhLoad)
        )
      )
    );
  };
  const loadNew = async fhLoad => {
    ui.disableMenu('load-choose-save');
    $('#load-choose-save').fadeOut(aTime,
      () => autoSave.begin(fhLoad)
    );
  };
  const selectFileToLoad = async () => {
    const $container = $('#start-container');
    const $message = $('#start-message');
    $message.fadeOut(aTime);
    let fh;
    try {
      [fh] = await showOpenFilePicker({
        startIn: autoSave.defaultDirectory
      });
    } catch (error) {
      ui.showStartOptions();
      return;
    }
    const file = await fh.getFile();
    const contents = await file.text();
    const lines = contents.split('\n');
    if (lines[0] !== 'LWBG' || lines[1] !== '0,0') {
      ui.startMessage('load-invalid-file');
      $message.fadeIn(aTime,
        () => $container.one(
          'click', ui.showStartOptions
        )
      );
      return;
    };
    $('#load-overwrite')
        .off().click(() => loadOverwrite(fh));
    $('#load-new').off().click(() => loadNew(fh));
    $('#load-choose-save').fadeIn(aTime,
      () => ui.disableMenu('load-choose-save', false)
    );
  }
  $('#load-saved').click(() => {
    ui.disableMenu('start-options');
    $('#start-options').fadeOut(aTime, () => {
      ui.startMessage('load-introduction');
      $('#start-message').fadeIn(aTime);
      $('#start-container')
          .one('click', selectFileToLoad);
    });
  });

  $('#start-toggle-audio').click(() => {
    $('#toggle-audio').click();
  });

}

// Player control screen
{
  const savePlayers = async () => {
    if (! ai.control.changed) return;
    ai.control.changed = false;
    if (debug.skipAutoSave) return;
    const file = await autoSave.fh.getFile();
    const contents = await file.text();
    const writable =
        await autoSave.fh.createWritable();
    await writable.write(contents);
    const playerCode = ai.control.fullSaveCode();
    await writable.write(playerCode + ';');
    await writable.close();
  };
  const continueInGame = () => {
    savePlayers();
    $('#hide-more').click();
    ui.hideMessage();
    $('#player-control').fadeOut(aTime);
    if (ai.control[gs.turn] && gs.phase !== 'roll') {
      $('#cancel-button').click();
      ui.hideButton('ok-no-move');
      ui.hideButton('decline-button');
      ui.showButton('ok-ai-move');
    } else {
      ui.hideButton('ok-ai-move');
      if (gs.je) gp.startJumpEnter();
    }
  };
  const continueAtStart = () => {
    $('#player-control')
        .fadeOut(aTime, autoSave.begin);
  };
  $('#continue-from-control').click(() => {
    ui.disableMenu('player-control');
    (gs.turn ? continueInGame : continueAtStart)();
  });
  const changeControl = (species, level) => {
    $(`#${species}-control .current`)
        .removeClass('current');
    if (level === -1) {
      $(`#${species}-control .manual`)
          .addClass('current');
      ai.control[species] = false;
    } else {
      $(`#${species}-control .ai-${level}`)
          .addClass('current');
      ai.control[species] = ai.level[species][level];
    }
    if (gs.turn) ai.control.changed = true;
    if (isNull(ai.control.human)) return;
    if (isNull(ai.control.raptor)) return;
    $('#continue-from-control')
        .animate({opacity: 1}, aTime);
  };
  for (const species of ['human', 'raptor']) {
    $(`#${species}-control .manual`).click(() => {
      changeControl(species, -1);
    });
    const nLevels = ai.level[species].length
    for (let i = 0; i < nLevels; i++) {
      $(`#${species}-control .ai-${i}`).click(() => {
        changeControl(species, i);
      });
    }
  }
  ui.disableMenu('player-control');
}

// More menu
{

  // Return to game
  $('#hide-more').click(() => {
    ui.disableMenu('more-menu');
    $('#more-menu').fadeOut(aTime,
      () => {
        $('#more-menu > *').css('display', 'none');
        $('body').css({overflow: 'visible'});
      }
    );
  });

  // Manual save
  const manualSave = async () => {
    if (debug.skipAutoSave) {
      $('#hide-more').click();
      return;
    }
    const file = await autoSave.fh.getFile();
    const contents = await file.text();
    try {
      const fh = await showSaveFilePicker({
        startIn: autoSave.fh,
        types: [autoSave.fileType],
      });
      const writable = await fh.createWritable();
      await writable.write(contents);
      await writable.close();
      const m = "Your game has been saved.";
      ui.showMessage(m, false);
    } finally {
      $('#hide-more').click();
    }
  };
  $('#new-save-point').click(() => {
    ui.disableMenu('more-options');
    const $msh = $('#manual-save-help');
    $('#more-options').fadeOut(aTime,
      () => $msh.fadeIn(aTime,
        () => $msh.one('click', manualSave)
      )
    );
  });

  // Go to edit mode
  const eTime = anim.time.editControlFade;
  const enableDiceEdit = () => {
    $('.edit-dice').fadeIn(eTime);
    $(`.wrapper-${gs.turn}`).css('display', 'block');
    const dc = (value, die) => {
      if (value === null || ! die) return 0;
      // Max to return 0 instead of -1 if not found
      return Math.max(die.lastIndexOf(value), 0);
    };
    edit.dieCodes.movement =
        dc(gs.rollN, dice[gs.turn].movement);
    edit.dieCodes.continue =
        dc(gs.rollGo, dice[gs.turn].continue);
  };
  $('#begin-edit').click(() => {
    $('#hide-more').click();
    if (gs.turn !== 'trex' && gs.turn !== 'over') {
      $('#cancel-button').click();
    }
    edit.on = true;
    edit.gsPrevious = deepCopy(gs);
    ui.hideMessage();
    const hidden = [
      'show-more', 'roll-button', 'decline-button',
      'ok-trex-move', 'ok-no-move', 'ok-ai-move',
    ];
    for (const x of hidden) ui.hideButton(x);
    $('.edit-control:not(.edit-dice):not(.edit-turn)')
        .fadeIn(eTime);
    if (gs.turn === 'over') {
      $('#game-over').fadeOut(eTime);
    } else {
      $('.edit-turn').fadeIn(eTime);
    }
    if (gs.phase !== 'roll') enableDiceEdit();
    ui.humanItemsClickable(true);
    ui.raptorItemsClickable(true);
    $('#cancel-edits, #confirm-edits')
        .prop('disabled', false);
  });

  // Go to player control
  $('#change-control').click(() => {
    ui.disableMenu('more-options');
    $('#more-options')
        .fadeOut(aTime, ui.showControl);
  });

  // Quit game
  $('#show-quit-options').click(() => {
    ui.disableMenu('more-options');
    $('#more-options').fadeOut(aTime,
      () => $('#quit-options').fadeIn(aTime,
        () => ui.disableMenu('quit-options', false)
      )
    );
  });

  // Disable at start of game
  ui.disableMenu('more-options');

}

// Confirm quit screen
{
  $('#abort-quit').click(() => {
    $('#hide-more').click();
  });
  $('#confirm-quit').click(() => {
    $('#hide-more').click();
    $('#gameplay-container').fadeOut(aTime, () => {
      gp.initializeObjects();
      gp.initializeView();
      pieces.shuffleFeatures();
      pieces.removeImgs();
      pieces.addImgs();
      autoSave.clear();
      ui.showStartOptions(true);
      $('#start-container').fadeIn(aTime);
    });
  });
  ui.disableMenu('quit-options');
}



// Gameplay menu

// Buttons
{

  // Simple buttons
  $('#show-more').click(() => {
    $('body').css({overflow: 'hidden'});
    $('#more-options').css('display', 'flex');
    $('#more-menu').fadeIn(aTime,
      () => ui.disableMenu('more-options', false)
    );
  });
  $('#ok-no-move').click(() => {
    if (gs.phase === 'roll') return;
    ui.hideMessage();
    ui.hideButton('ok-no-move');
    gp.endTurn();
  });
  $('#ok-ai-move').click(() => {
    if (gs.phase !== 'select') return;
    gs.phase = 'think';
    ui.hideButton('ok-ai-move');
    const decision = ai.control[gs.turn](gs, prng.ai);
    if (! decision.length) {
      gp.endTurn();
      return;
    }
    mv.selected = decision[0];
    mv.plan = decision[1];
    gs.phase = 'move';
    $('#confirm-button').click();
  });
  $('#decline-button').click(() => {
    if (gs.phase !== 'select' || ! gs.je) return;
    ui.hideMessage();
    if (mv.toGo) {
      let m = "Are you sure you don't want to ";
      m += gs.turn === 'human' ?
        'jump' : 'enter a building';
      m += "?<br>Click 'Decline' again to confirm."
      ui.showMessage(m, false);
      mv.toGo--;
    } else {
      ui.hideButton('decline-button');
      gp.endTurn();
    }
  });

  // More complex buttons
  const clearVisibleMove = () => {
    ui.hideMessage();
    ui.hideButton('cancel-button');
    ui.hideButton('confirm-button');
    $('.selected, .move, .path')
        .removeClass('selected move path');
  };
  $('#cancel-button').click(() => {
    if (gs.phase !== 'move') return;
    gs.phase = 'select';
    clearVisibleMove();
    gp.clearMoveObject();
    if (gs.je) gp.startJumpEnter();
  });
  const boundingBox = (...regions) => ({
    left:   Math.min(...regions.map(x => x.left)),
    right:  Math.max(...regions.map(x => x.right)),
    top:    Math.min(...regions.map(x => x.top)),
    bottom: Math.max(...regions.map(x => x.bottom)),
  });
  const movePlanRegion = () => {
    const planCorners =
        mv.plan.map(x => [...pl[gs.turn][x]]);
    const [pw, ph] = pl[gs.turn].ps;
    const planRegions = planCorners.map(x => ({
      left: x[0], right: x[0] + pw,
      top: x[1], bottom: x[1] + ph,
    }));
    return boundingBox(...planRegions);
  };
  const bringIntoView = (region, after) => {
    const padding = [216, 108];
    // Auto-scroll animation and delay times will
    //   taper to zero nonlinearly according to
    //   the taperTransform function
    //   if the (Euclidean) distance to be scrolled
    //   is less than taperDistance
    const taperDistance = 648;
    const taperTransform = x => {
      if (x < 0) return 0;
      if (x > 1) return 1;
      return Math.sqrt(x);
    }
    const ww = $(window).width();
    const wh = $(window).height();
    const [ph, pv] = padding;
    const current = {
      left:   $(document).scrollLeft(),
      right:  $(document).scrollLeft() + ww,
      top:    $(document).scrollTop(),
      bottom: $(document).scrollTop() + wh,
    };
    const excess = [
      (region.right - region.left) - ww + ph * 2,
      (region.bottom - region.top) - wh + pv * 2
    ].map(x => Math.max(x, 0));
    const target = {
      left:   region.left   - ph + excess[0] / 2,
      right:  region.right  + ph - excess[0] / 2,
      top:    region.top    - pv + excess[1] / 2,
      bottom: region.bottom + pv - excess[1] / 2,
    };
    const scrollObj = {
      scrollLeft: Math.min(target.left, current.left),
      scrollTop:  Math.min(target.top,  current.top),
    };
    if (target.right > current.right) {
      scrollObj.scrollLeft = target.right - ww;
    }
    if (target.bottom > current.bottom) {
      scrollObj.scrollTop = target.bottom - wh;
    }
    const distance = Math.hypot(
      scrollObj.scrollLeft - current.left,
      scrollObj.scrollTop  - current.top
    );
    const taper = taperTransform(
      Math.min(1, distance / taperDistance)
    );
    $('html').animate(
      scrollObj, anim.time.autoScroll * taper,
      () => setTimeout(
        after, anim.time.autoScrollDelay * taper
      )
    );
  };
  $('#confirm-button').click(() => {
    if (gs.phase !== 'move') return;
    gs.phase = 'execute';
    clearVisibleMove();
    $('#zoom-default').click();
    const end = mv.plan[mv.plan.length - 1];
    const moveFn = (gs.turn === 'human') ?
      gp.moveHuman : gp.moveRaptor;
    bringIntoView(movePlanRegion(gs.turn), () => {
      for (const s of mv.plan.slice(1)) {
        moveFn(mv.selected, s, s === end);
      }
    });
  });
  const spaceRegion = id => {
    const $obj = $(`#${id}`);
    return {
      left:   $obj.offset().left,
      right:  $obj.offset().left + $obj.width(),
      top:    $obj.offset().top,
      bottom: $obj.offset().top + $obj.height(),
    };
  };
  const trexMoveRegion = () => {
    const [oldL, oldT] = pl.trex[gs.trex];
    const [newL, newT] = pl.trex[gs.trex - 1];
    const [pw, ph] = pl.trex.ps;
    const oldPieceRegion = {
      left: oldL, right: oldL + pw,
      top: oldT, bottom: oldT + ph,
    };
    const newPieceRegion = {
      left: newL, right: newL + pw,
      top: newT, bottom: newT + ph,
    };
    const oldSpaceRegion =
        spaceRegion('trex-space-' + gs.trex);
    const newSpaceRegion = gs.trex === 1 ?
        spaceRegion('human-space-' + bd.humanStart) :
        spaceRegion('trex-space-' + (gs.trex - 1));
    return boundingBox(
      oldPieceRegion, newPieceRegion,
      oldSpaceRegion, newSpaceRegion
    );
  };
  $('#ok-trex-move').click(() => {
    if (gs.phase !== 'move') return;
    gs.phase = 'execute';
    ui.hideButton('ok-trex-move');
    $('#zoom-default').click();
    bringIntoView(
      trexMoveRegion(),
      () => gp.moveTrex(gs.trex - 1, true)
    );
  });

  // Roll
  $('#roll-button').click(() => {
    if (gs.phase !== 'roll') return;
    gs.phase = 'execute';
    ui.hideMessage();
    gs.rollN = rollDie(
      dice[gs.turn].movement, prng.dice[gs.turn]
    );
    gs.rollGo = gs.turn === 'trex' ? 0 : rollDie(
      dice[gs.turn].continue, prng.dice[gs.turn]
    );
    ui.displayRollResult(gs);
    gs.je =
        gs.rollN === 'Jump' || gs.rollN === 'Enter';
    autoSave.update();
    const delay = anim.time.buttonSlide * 2 +
        anim.time.dieRoll + anim.time.dieRollDelay;
    const fn = gs.turn === 'trex' ? () => {
      gs.phase = 'move';
      ui.showButton(
        gs.rollN ? 'ok-trex-move' : 'ok-no-move'
      );
    } : () => {
      gs.phase = 'select';
      if (ai.control[gs.turn]) {
        ui.showButton('ok-ai-move');
      } else {
        if (gs.je) gp.startJumpEnter();
      }
    };
    setTimeout(fn, delay);
  });

  // Zoom buttons
  const highlightPieces = setting => {
    const $pieces =
        $('.raptor-piece, .human-piece, .trex-piece')
    const ids = zd.highlightBlinkIds;
    if (setting) {
      $pieces.addClass('highlighted');
      const id = setInterval(
        () => $('.highlighted').toggleClass('on'),
        anim.time.highlightBlink
      );
      ids.push(id);
    } else {
      $pieces.removeClass('highlighted');
      while (ids.length) clearInterval(ids.pop());
    }
  };
  const applyZoomCenter = () => {
    const {left: cl, top: ct} = zd.center;
    const fc = zd.factor.current;
    const $w = $(window);
    $(document).scrollLeft(cl * fc - $w.width() / 2);
    $(document).scrollTop(ct * fc - $w.height() / 2);
  };
  const zoomGeneral = factor => {
    if (! zd.factor.current) {
      zd.factor.current = 1;
      applyZoomCenter();
      return;
    }
    if (zd.factor.current === factor) return;
    if (zd.factor.current >= 1) {
      zd.center.left = (
        $(document).scrollLeft() +
        $(window).width() / 2
      ) / zd.factor.current;
      zd.center.top = (
        $(document).scrollTop() +
        $(window).height() / 2
      ) / zd.factor.current;
    }
    $('#gameplay-container').css('zoom', factor);
    zd.factor.current = factor;
    applyZoomCenter();
    $('.non-zoom').css('zoom', 1 / zd.factor.current);
    highlightPieces(factor < 1);
    $('.human-space, .human-edge')
        .toggleClass('more-visible', factor < 1);
    $('.zoom-button').removeClass('current');
    $('.edit-control .obstructive')
        .removeClass('slim');
    if (gs.turn === 'over') $('#game-over').show();
  };
  $('#zoom-out').click(() => {
    const factorFit = Math.max(
      $(window).width()  / zd.boardSize[0],
      $(window).height() / zd.boardSize[1],
    );
    const factorLimited =
        Math.max(factorFit, zd.factor.outMax);
    zoomGeneral(factorLimited);
    $('#zoom-out').addClass('current');
    $('.edit-control .obstructive').addClass('slim');
    if (gs.turn === 'over') $('#game-over').hide();
  });
  $('#zoom-default').click(() => {
    zoomGeneral(1);
    $('#zoom-default').addClass('current');
  });
  $('#zoom-in').click(() => {
    zoomGeneral(zd.factor.in);
    $('#zoom-in').addClass('current');
  });

}

// Dice in roll display
{
  const targetWidth = cssInt('--die-content-width');
  const makeFaces = (species, type) => {
    const values = [... new Set(dice[species][type])];
    for (const v of values) {
      const $face = $('<div></div>');
      const classStr =
          `face face-${species} face-${type}`;
      $face.addClass(classStr).attr('data-roll', v);
      $face.appendTo(`#die-${species}-${type}`);
      const $copy = $face.clone().addClass('copy');
      $copy.appendTo('body');
      const squeezeFn = () => {
        const rawWidth = $copy.width();
        $copy.remove();
        if (rawWidth > targetWidth) {
          const s = targetWidth / rawWidth;
          const t = targetWidth * (s - 1) / 2;
          const transformString =
              `translate(${t}px, 0) scale(${s}, 1)`;
          $face.css('transform', transformString);
        }
      };
      // Calculation of squeeze transform must be
      // delayed to give browser adequate time
      // to apply correct width to $copy
      setTimeout(squeezeFn, aTime * 6);
      $face.css('display', 'none');
    }
  };
  for (const ss of Object.keys(dice)) {
    for (const dt of Object.keys(dice[ss])) {
      makeFaces(ss, dt);
    }
  }
}



// Other UI structures

// Prevent accidental navigation away
{
  onbeforeunload = () => '';
}

// Message
{
  const mouse = inbound => {
    const cv = inbound ? 'hidden' : 'visible';
    const hd = inbound ? 'flex' : 'none';
    const $mc = $('#message-container');
    if ($mc.is(':animated')) return;
    $mc.children('.content').css('visibility', cv);
    $mc.children('.hider').css('display', hd);
  }
  $('#message-container').click(ui.hideMessage)
    .hover(() => mouse(true), () => mouse(false));
}

// Controls for edit mode
edit.makeControls();

// CSS variables
anim.makeCssVariables();

// Audio elements
music.makeElement();
sfx.makeElement();

// Audio toggle button in gameplay
{
  const toggleAudio = () => {
    if (music.audioOn) {
      $('.icon.audio-on').hide();
      $('.icon.audio-off').show();
      $(`#${music.id}`).get(0).pause();
    } else {
      $('.icon.audio-off').hide();
      $('.icon.audio-on').show();
      $(`#${music.id}`).get(0).play();
    }
    music.audioOn = ! music.audioOn;
  };
  $('#toggle-audio').click(toggleAudio);
}

// Create audio toggle icons (including at start)
{
  const iconSvgString = {};
  // Inline SVG strings
  {
    iconSvgString.audioOff = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
    `;
    iconSvgString.audioOn = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
    </svg>
    `;
  }
  $('#start-toggle-audio').wrapInner('<span></span>');
  const addAudioToggleIcons = where => {
    $(where).append(iconSvgString.audioOff)
        .append(iconSvgString.audioOn);
    const $svgs = $(`${where} svg`);
    $svgs.eq(0).addClass('icon audio-off').hide();
    $svgs.eq(1).addClass('icon audio-on');
  };
  addAudioToggleIcons('#toggle-audio');
  addAudioToggleIcons('#start-toggle-audio');
}
