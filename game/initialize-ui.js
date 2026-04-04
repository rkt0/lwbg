'use strict';



// Full-screen interfaces outside of normal gameplay

// Title screen
{
  $('<div></div>').attr('id', 'title-container')
      .addClass('full-screen').appendTo('body');
  ui.makeFlexContainer(
    '#title-container', 'title-content'
  );
  $('#title-content').css('display', 'flex');
  const m = "Click anywhere to start";
  ui.makeInstruction('#title-content', m);
  const aTime = anim.time.menuFade;
  const goToStart = () => {
    $('#title-container').fadeOut(aTime, () => {
      $('#start-container').fadeIn(aTime);
      music.next();
    });
  };
  $('#title-container').one('click', goToStart)
      .fadeIn(anim.time.menuFade);
}

// Start screen
{

  $('<div></div>').attr('id', 'start-container')
      .addClass('full-screen').appendTo('body');

  $('<div></div>').attr('id', 'start-options')
      .addClass('flex-container')
      .appendTo('#start-container');
  const aTime = anim.time.menuFade;

  const startNewGame = () => {
    ui.disableMenu('start-options');
    $('#start-options')
        .fadeOut(aTime, ui.showControl);
  };
  ui.makeOption(
    '#start-options',
    null, 'Start New Game', startNewGame
  );

  const loadOverwrite = async fhLoad => {
    ui.disableMenu('load-choose-save');
    const okAlready = await fhLoad.queryPermission({
      mode: 'readwrite'
    });
    autoSave.fh = fhLoad;
    const $container = $('#start-container');
    const $message = $('#start-message');
    const aTime = anim.time.menuFade;
    const m = [];
    if (okAlready === 'granted') {
      m[0] = "Your progress will automatically" +
          " be saved to the same file.";
      m[1] = "Click anywhere to start the game.";
    } else {
      m[0] = "You will now be asked for" +
          " permission to save changes to this file.";
      m[1] = "When you give permission," +
          " the game will start.";
      m[2] = "Click anywhere to continue.";
    }
    $message.html(ui.asParagraphs(...m));
    $('#load-choose-save').fadeOut(aTime,
      () => $message.fadeIn(aTime,
        () => $container.one('click',
          () => autoSave.begin(fhLoad)
        )
      )
    );
  };
  const loadNew = async fhLoad => {
    ui.disableMenu('load-choose-save');
    $('#load-choose-save').fadeOut(anim.time.menuFade,
      () => autoSave.begin(fhLoad)
    );
  };
  const selectFileToLoad = async () => {
    const $container = $('#start-container');
    const $message = $('#start-message');
    const aTime = anim.time.menuFade;
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
      const m0 =
          "That file isn't a valid saved game file.";
      const m1 = "Click anywhere to go back.";
      $message.html(ui.asParagraphs(m0, m1));
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
  const prepareToLoadFile = () => {
    ui.disableMenu('start-options');
    $('#start-options').fadeOut(aTime, () => {
      const m0 = "You will now be asked to" +
          " select a saved game file to load.";
      const m1 = "It can be a file that you created" +
          " when you started a game or a file" +
          " that you created manually during a game.";
      const m2 = "Click anywhere to continue.";
      $('#start-message')
          .html(ui.asParagraphs(m0, m1, m2))
          .fadeIn(aTime);
      $('#start-container')
          .one('click', selectFileToLoad);
    });
  };
  ui.makeOption(
    '#start-options',
    null, 'Load Saved Game', prepareToLoadFile
  );

  ui.makeOption(
    '#start-options',
    'start-toggle-audio', 'Toggle Audio',
    () => $('#toggle-audio').click()
  );

  $('<div></div>').attr('id', 'start-message')
      .addClass('info').css('display', 'none')
      .appendTo('#start-container');

}

// Clarification of save upon loading game
{
  $('<div></div>').attr('id', 'load-choose-save')
      .addClass('flex-container')
      .css('display', 'none')
      .appendTo('#start-container');
  const m0 = "Do you want to use this same file as" +
      " your auto-save file (overwriting it)?";
  const m1 = "Or do you want to leave this file" +
      " alone and create a new auto-save file?";
  ui.makeInstruction(
    '#load-choose-save', ui.asParagraphs(m0, m1)
  );
  ui.makeOption(
    '#load-choose-save', 'load-overwrite',
    'Use Same File (Overwrite)', null
  );
  ui.makeOption(
    '#load-choose-save', 'load-new',
    'Create New File', null
  );
}

// Player control screen
{
  // Make it a child of body so that it can be used
  //   both at start and in game
  $('<div></div>').attr('id', 'player-control')
      .addClass('full-screen flex-container tight')
      .css('display', 'none').appendTo('body');
  $('<div></div>')
      .addClass('flex-container row tight')
      .appendTo('#player-control');
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
    $('#player-control').fadeOut(anim.time.menuFade);
    if (ai.control[gs.turn] && gs.phase !== 'roll') {
      $('#cancel-button').click();
      ui.hideButton('ok-no-move');
      ui.hideButton('decline-move');
      ui.showButton('ok-ai-move');
    } else {
      ui.hideButton('ok-ai-move');
      if (gs.je) gp.startJumpEnter();
    }
  };
  const continueAtStart = () => {
    $('#player-control')
        .fadeOut(anim.time.menuFade, autoSave.begin);
  };
  const continueFromControl = () => {
    ui.disableMenu('player-control');
    (gs.turn ? continueInGame : continueAtStart)();
  };
  ui.makeOption(
    '#player-control',
    'continue-from-control', 'Continue',
    continueFromControl
  );
  $('#player-control > button').css({opacity: 0});
  const changeControl = (species, level) => {
    $(`#${species}-control .current`)
        .removeClass('current');
    if (level === -1) {
      $(`#${species}-control-manual`)
          .addClass('current');
      ai.control[species] = false;
    } else {
      $(`#${species}-control-ai-${level}`)
          .addClass('current');
      ai.control[species] = ai.level[species][level];
    }
    if (gs.turn) ai.control.changed = true;
    if (isNull(ai.control.human)) return;
    if (isNull(ai.control.raptor)) return;
    $('#continue-from-control')
        .animate({opacity: 1}, anim.time.menuFade);
  };
  const addControlAreas = species => {
    $('<div></div>').attr('id', `${species}-control`)
        .addClass('info')
        .appendTo('#player-control .row');
    $('<h1></h1>').html(`${species}s`)
        .appendTo(`#${species}-control`);
    ui.makeOption(
      `#${species}-control`,
      `${species}-control-manual`, 'Manual Control',
      () => changeControl(species, -1)
    );
    $(`#${species}-control-manual`)
        .addClass('manual');
    $('<div>Computer Level</div>')
        .appendTo(`#${species}-control`);
    $('<div></div>')
        .attr('id', `${species}-control-ai`)
        .appendTo(`#${species}-control`);
    const nLevels = ai.level[species].length
    for (let i = 0; i < nLevels; i++) {
      ui.makeOption(
        `#${species}-control-ai`,
        `${species}-control-ai-${i}`,
        i, () => changeControl(species, i)
      );
    }
  };
  addControlAreas('human');
  addControlAreas('raptor');
  ui.disableMenu('player-control');
}

// More menu
{

  // Container
  $('<div></div>').attr('id', 'more-menu')
      .addClass('full-screen non-zoom')
      .css('display', 'none')
      .appendTo('#gameplay-container');
  ui.makeFlexContainer('#more-menu', 'more-options');

  // Return to game
  const hideMore = () => {
    ui.disableMenu('more-menu');
    $('#more-menu').fadeOut(anim.time.menuFade,
      () => {
        $('#more-menu > *').css('display', 'none');
        $('body').css({overflow: 'visible'});
      }
    );
  };
  ui.makeOption(
    '#more-options',
    'hide-more', 'Return to Game', hideMore
  );

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
  const showManualSaveHelp = () => {
    ui.disableMenu('more-options');
    const aTime = anim.time.menuFade;
    const $msh = $('#manual-save-help');
    $('#more-options').fadeOut(aTime,
      () => $msh.fadeIn(aTime,
        () => $msh.one('click', manualSave)
      )
    );
  };
  ui.makeOption(
    '#more-options',
    null, 'Create New Save Point', showManualSaveHelp
  );

  // Go to edit mode
  const enableDiceEdit = () => {
    $('.edit-dice').fadeIn(anim.time.editControlFade);
    $(`.die-button-wrapper-${gs.turn}`)
        .css('display', 'block');
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
  const beginEditMode = () => {
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
    const aTime = anim.time.editControlFade;
    $('.edit-control:not(.edit-dice):not(.edit-turn)')
        .fadeIn(aTime);
    if (gs.turn === 'over') {
      $('#game-over').fadeOut(aTime);
    } else {
      $('.edit-turn').fadeIn(aTime);
    }
    if (gs.phase !== 'roll') enableDiceEdit();
    ui.humanItemsClickable(true);
    ui.raptorItemsClickable(true);
    $('#cancel-edits, #confirm-edits')
        .prop('disabled', false);
  };
  ui.makeOption(
    '#more-options',
    null, 'Edit (Cheat)', beginEditMode
  );

  // Go to player control
  const showControlInGame = () => {
    ui.disableMenu('more-options');
    $('#more-options')
        .fadeOut(anim.time.menuFade, ui.showControl);
  };
  ui.makeOption(
    '#more-options',
    null, 'Change Player Control', showControlInGame
  );

  // Quit game
  const showQuitConfirm = () => {
    ui.disableMenu('more-options');
    const aTime = anim.time.menuFade;
    $('#more-options').fadeOut(aTime,
      () => $('#quit-options').fadeIn(aTime,
        () => ui.disableMenu('quit-options', false)
      )
    );
  };
  ui.makeOption(
    '#more-options',
    null, 'Quit Game', showQuitConfirm
  );

  // Disable at start of game
  ui.disableMenu('more-options');

}

// Manual save help screen
{
  ui.makeFlexContainer(
    '#more-menu', 'manual-save-help'
  );
  const m0 = "You will now be asked to create" +
      " a file. This file will allow you to resume" +
      "  your game later at this exact point.";
  const m1 = "Your progress will continue to be" +
      " automatically saved to your original" +
      " saved game file (and not to the file" +
      " that you're about to create).";
  const m2 = "Click anywhere to continue."
  ui.makeInstruction(
    '#manual-save-help', ui.asParagraphs(m0, m1, m2)
  );
}

// Confirm quit screen
{
  ui.makeFlexContainer('#more-menu', 'quit-options');
  const m0 = "Do you really want to quit the game?";
  const m1 = "(You'll still be able to resume it" +
      " later from your saved game file.)";
  ui.makeInstruction(
    '#quit-options', ui.asParagraphs(m0, m1)
  );
  const abortQuit = () => $('#hide-more').click();
  ui.makeOption(
    '#quit-options', null, 'Return to Game', abortQuit
  );
  const quitGame = () => {
    const aTime = anim.time.menuFade;
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
  };
  ui.makeOption(
    '#quit-options', null, 'Quit Game', quitGame
  );
  ui.disableMenu('quit-options');
}



// Gameplay menu

// Container
{
  $('<div></div>').attr('id', 'gameplay-menu')
      .addClass('non-zoom')
      .appendTo('#gameplay-container');
}

// Zoom, turn, roll displays
{
  const makeInfoDiv = (id, position) => {
    $('<div></div>').attr('id', id)
        .addClass('info').css('display', 'none')
        .appendTo('#gameplay-menu');
    $('<div></div>').addClass('flex-container')
        .appendTo(`#${id}`);
  };
  makeInfoDiv('zoom-display');
  makeInfoDiv('turn-display');
  makeInfoDiv('roll-display');
  $('<div></div>').attr('id', 'turn-display-content')
      .appendTo('#turn-display .flex-container');
  const turnDisplayHtml = 'Turn:<br>' +
      '<span id="species-turn-text">&nbsp;</span>';
  $('#turn-display-content').html(turnDisplayHtml);
  $('#zoom-display .flex-container')
      .html('Zoom<br>&nbsp;');
}

// Buttons
{

  const makeButton = (id, handler) => {
    $('<button></button>').attr('type', 'button')
        .attr('id', id)
        .click(handler).css('display', 'none')
        .appendTo('#gameplay-menu');
  };

  // Simple buttons
  const showMore = () => {
    $('body').css({overflow: 'hidden'});
    $('#more-options').css('display', 'flex');
    $('#more-menu').fadeIn(anim.time.menuFade,
      () => ui.disableMenu('more-options', false)
    );
  };
  makeButton('show-more', showMore);
  const okNoMove = () => {
    if (gs.phase === 'roll') return;
    ui.hideMessage();
    ui.hideButton('ok-no-move');
    gp.endTurn();
  };
  makeButton('ok-no-move', okNoMove);
  const okAiMove = () => {
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
  };
  makeButton('ok-ai-move', okAiMove);
  const declineMove = () => {
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
  };
  makeButton('decline-button', declineMove);

  // More complex buttons
  const clearVisibleMove = () => {
    ui.hideMessage();
    ui.hideButton('cancel-button');
    ui.hideButton('confirm-button');
    $('.selected, .move, .path')
        .removeClass('selected move path');
  };
  const cancelMove = () => {
    if (gs.phase !== 'move') return;
    gs.phase = 'select';
    clearVisibleMove();
    gp.clearMoveObject();
    if (gs.je) gp.startJumpEnter();
  };
  makeButton('cancel-button', cancelMove);
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
  const confirmMove = () => {
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
  };
  makeButton('confirm-button', confirmMove);
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
  const okTrexMove = () => {
    if (gs.phase !== 'move') return;
    gs.phase = 'execute';
    ui.hideButton('ok-trex-move');
    $('#zoom-default').click();
    bringIntoView(
      trexMoveRegion(),
      () => gp.moveTrex(gs.trex - 1, true)
    );
  };
  makeButton('ok-trex-move', okTrexMove);

  // Roll
  const roll = () => {
    if (gs.phase !== 'roll') return;
    gs.phase = 'execute';
    ui.hideMessage();
    gs.rollN = rollDie(
      dice[gs.turn].movement, prng.dice[gs.turn]
    );
    gs.rollGo = gs.turn === 'trex' ? 0 : rollDie(
      dice[gs.turn].continue, prng.dice[gs.turn]
    );
    ui.displayRollResult();
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
  };
  makeButton('roll-button', roll);

  // Default actions
  $(
    '#confirm-button, #roll-button, ' +
    '#ok-trex-move, #ok-no-move, #ok-ai-move'
  ).addClass('default-action');

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
  const zoomOut = () => {
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
  };
  const zoomDefault = () => {
    zoomGeneral(1);
    $('#zoom-default').addClass('current');
  };
  const zoomIn = () => {
    zoomGeneral(zd.factor.in);
    $('#zoom-in').addClass('current');
  };
  makeButton('zoom-out', zoomOut);
  makeButton('zoom-default', zoomDefault);
  makeButton('zoom-in', zoomIn);
  $('#zoom-out, #zoom-default, #zoom-in')
      .addClass('zoom-button');
  $('<div></div>').addClass('zoom-indicator')
      .prependTo('.zoom-button');
  $('#zoom-default').addClass('current');

}

// Positioning
{
  $('#turn-display').addClass('slot-turn');
  $('#roll-display, #roll-button')
      .addClass('slot-roll');
  $(
    '#cancel-button, #decline-button, ' +
    '#ok-trex-move, #ok-no-move, #ok-ai-move'
  ).addClass('slot-cancel');
  $(
    '#show-more, #turn-display, #zoom-display, ' +
    '#zoom-out, #zoom-default, #zoom-in'
  ).css('display', 'inline');
  const hidden = [
    'roll-button', 'roll-display',
    'cancel-button', 'decline-button',
    'ok-trex-move', 'ok-no-move', 'ok-ai-move',
    'confirm-button'
  ];
  for (const x of hidden) ui.hideButton(x);
}

// Dice in roll display
{
  const targetWidth = cssInt('--die-content-width');
  const makeDie = (species, type) => {
    $('<div></div>')
        .attr('id', `die-${species}-${type}`)
        .addClass(`die die-${species} die-${type}`)
        .appendTo('#roll-display .flex-container');
  };
  const makeFaces = (species, type) => {
    const values = [... new Set(dice[species][type])];
    for (const v of values) {
      const $face = $('<div></div>');
      const classStr =
          `face face-${species} face-${type}`;
      $face.addClass(classStr).attr('data-roll', v);
      $face.appendTo(`#die-${species}-${type}`);
      const $faceCopy = $face.clone();
      $faceCopy.css({position: 'fixed', zIndex: -1})
          .appendTo('body');
      const squeezeFn = () => {
        const rawWidth = $faceCopy.width();
        $faceCopy.remove();
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
      // to apply correct width to $faceCopy
      setTimeout(squeezeFn, anim.time.menuFade * 6);
      $face.css('display', 'none');
    }
  };
  for (const ss of Object.keys(dice)) {
    for (const dt of Object.keys(dice[ss])) {
      makeDie(ss, dt);
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
  $('<div></div>').attr('id', 'message-container')
      .click(ui.hideMessage)
      .hover(() => mouse(true), () => mouse(false))
      .addClass('flex-container info non-zoom')
      .css('display', 'none')
      .appendTo('#gameplay-container');
  $('<span></span>').addClass('content')
      .appendTo('#message-container');
  $('<div></div>').addClass('hider flex-container')
      .css('display', 'none')
      .appendTo('#message-container');
  $('<span></span>').html('Hide Message')
      .appendTo('#message-container .hider');
}

// Game over
{
  $('<div></div>').attr('id', 'game-over')
      .addClass('info non-zoom')
      .css('display', 'none')
      .appendTo('#gameplay-container');
}

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
  $('<button></button>').attr('type', 'button')
      .attr('id', 'toggle-audio').click(toggleAudio)
      .addClass('small-button non-zoom')
      .appendTo('#gameplay-container');
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
