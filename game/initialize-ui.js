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

// Disable menus that should be inactive at start
ui.disableMenu('player-control');
ui.disableMenu('more-options');
ui.disableMenu('quit-options');

// Animation times for menu fade and edit control fade
const aTime = anim.time.menuFade;
const eTime = anim.time.editControlFade;

// Title screen click handler
$('#title-container').one('click', () => {
  onbeforeunload = () => '';
  $('#title-container').fadeOut(aTime, () => {
    $('#start-container').fadeIn(aTime);
    music.next();
  });
});

// Needed for start screen click handlers
async function loadOverwrite (fhLoad) {
  ui.disableMenu('load-choose-save');
  const okAlready = await fhLoad.queryPermission({
    mode: 'readwrite',
  });
  autoSave.fh = fhLoad;
  ui.startMessage(`load-permission-${okAlready}`);
  $('#load-choose-save').fadeOut(aTime, () => {
    $('#start-message').fadeIn(aTime, () => {
      $('#start-container').one('click', () => {
        autoSave.begin(fhLoad);
      });
    });
  });
}
function loadNew(fhLoad) {
  ui.disableMenu('load-choose-save');
  $('#load-choose-save').fadeOut(aTime, () => {
    autoSave.begin(fhLoad);
  });
}
async function selectFileToLoad() {
  const $container = $('#start-container');
  const $message = $('#start-message');
  $message.fadeOut(aTime);
  let fh;
  try {
    [fh] = await showOpenFilePicker({
      startIn: autoSave.defaultDirectory,
    });
  } catch {
    ui.showStartOptions();
    return;
  }
  const file = await fh.getFile();
  const contents = await file.text();
  const lines = contents.split('\n');
  if (lines[0] !== 'LWBG' || lines[1] !== '0,0') {
    ui.startMessage('load-invalid-file');
    $message.fadeIn(aTime, () => {
      $container.one('click', ui.showStartOptions);
    });
    return;
  };
  $('#load-overwrite').off().click(() => {
    loadOverwrite(fh);
  });
  $('#load-new').off().click(() => {loadNew(fh);});
  $('#load-choose-save').fadeIn(aTime, () => {
    ui.disableMenu('load-choose-save', false);
  });
}

// Start screen click handlers
$('#start-new').click(() => {
  ui.disableMenu('start-options');
  $('#start-options').fadeOut(aTime, ui.showControl);
});
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

// Needed for player control screen click handlers
async function savePlayers() {
  if (!ai.control.changed) return;
  ai.control.changed = false;
  if (debug.skipAutoSave) return;
  const file = await autoSave.fh.getFile();
  const contents = await file.text();
  const writable = await autoSave.fh.createWritable();
  await writable.write(contents);
  const playerCode = ai.control.fullSaveCode();
  await writable.write(playerCode + ';');
  await writable.close();
}
function continueInGame() {
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
}
function continueAtStart() {
  $('#player-control').fadeOut(aTime, autoSave.begin);
};
function changeControl(species, level) {
  const area = `#${species}-control`;
  $(`${area} .current`).removeClass('current');
  if (level === -1) {
    $(`${area} .manual`).addClass('current');
    ai.control[species] = false;
  } else {
    $(`${area} .ai-${level}`).addClass('current');
    ai.control[species] = ai.level[species][level];
  }
  if (gs.turn) ai.control.changed = true;
  if (isNull(ai.control.human)) return;
  if (isNull(ai.control.raptor)) return;
  $('#continue-from-control')
    .animate({opacity: 1}, aTime);
}

// Player control screen click handlers
$('#continue-from-control').click(() => {
  ui.disableMenu('player-control');
  (gs.turn ? continueInGame : continueAtStart)();
});
for (const species of ['human', 'raptor']) {
  const area = `#${species}-control`;
  $(`${area} .manual`).click(() => {
    changeControl(species, -1);
  });
  const nLevels = ai.level[species].length
  for (let i = 0; i < nLevels; i++) {
    $(`${area} .ai-${i}`).click(() => {
      changeControl(species, i);
    });
  }
}

// Needed for more menu click handlers
async function manualSave() {
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
    ui.showMessage('manual-save-success');
  } finally {
    $('#hide-more').click();
  }
}
function dieCode(value, die) {
  if (value === null || !die) return 0;
  // Max to return 0 instead of -1 if not found
  return Math.max(die.lastIndexOf(value), 0);
}
function enableDiceEdit() {
  $('.edit-dice').fadeIn(eTime);
  $(`.wrapper-${gs.turn}`).css('display', 'block');
  edit.dieCodes.movement =
    dieCode(gs.rollN, dice[gs.turn].movement);
  edit.dieCodes.continue =
    dieCode(gs.rollGo, dice[gs.turn].continue);
};

// More menu click handlers
$('#hide-more').click(() => {
  ui.disableMenu('more-menu');
  $('#more-menu').fadeOut(aTime, () => {
    $('#more-menu > *').css('display', 'none');
    $('body').css({overflow: 'visible'});
  });
});
$('#new-save-point').click(() => {
  ui.disableMenu('more-options');
  const $msh = $('#manual-save-help');
  $('#more-options').fadeOut(aTime, () => {
    $msh.fadeIn(aTime, () => {
      $msh.one('click', manualSave);
    });
  });
});
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
$('#change-control').click(() => {
  ui.disableMenu('more-options');
  $('#more-options').fadeOut(aTime, ui.showControl);
});
$('#show-quit-options').click(() => {
  ui.disableMenu('more-options');
  $('#more-options').fadeOut(aTime, () => {
    $('#quit-options').fadeIn(aTime, () => {
      ui.disableMenu('quit-options', false);
    });
  });
});

// Confirm quit menu click handlers
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

// Simple gameplay menu click handlers
$('#show-more').click(() => {
  $('body').css({overflow: 'hidden'});
  $('#more-options').css('display', 'flex');
  $('#more-menu').fadeIn(aTime, () => {
    ui.disableMenu('more-options', false);
  });
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
  if (!decision.length) {
    gp.endTurn();
    return;
  }
  mv.selected = decision[0];
  mv.plan = decision[1];
  gs.phase = 'move';
  $('#confirm-button').click();
});
$('#decline-button').click(() => {
  if (gs.phase !== 'select' || !gs.je) return;
  ui.hideMessage();
  if (mv.toGo) {
    ui.showMessage(`confirm-decline-${
      gs.turn === 'human' ? 'jump' : 'enter'
    }`);
    mv.toGo--;
  } else {
    ui.hideButton('decline-button');
    gp.endTurn();
  }
});
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
  gs.je = gs.rollN === 'Jump' || gs.rollN === 'Enter';
  autoSave.update();
  const delay = anim.time.buttonSlide * 2 +
    anim.time.dieRoll + anim.time.dieRollDelay;
  if (gs.turn === 'trex') {
    setTimeout(() => {
      gs.phase = 'move';
      if (gs.rollN) ui.showButton('ok-trex-move');
      else ui.showButton('ok-no-move');
    }, delay);
  } else {
    setTimeout(() => {
      gs.phase = 'select';
      if (ai.control[gs.turn]) {
        ui.showButton('ok-ai-move');
      } else if (gs.je) gp.startJumpEnter();
    }, delay);
  }
});

// Needed for multiple click handlers
function clearVisibleMove() {
  ui.hideMessage();
  ui.hideButton('cancel-button');
  ui.hideButton('confirm-button');
  $('.selected, .move, .path')
    .removeClass('selected move path');
}
function boundingBox(...regions) {
  return {
    left: Math.min(...regions.map(x => x.left)),
    right: Math.max(...regions.map(x => x.right)),
    top: Math.min(...regions.map(x => x.top)),
    bottom: Math.max(...regions.map(x => x.bottom)),
  };
}

// Cancel button click handler
$('#cancel-button').click(() => {
  if (gs.phase !== 'move') return;
  gs.phase = 'select';
  clearVisibleMove();
  gp.clearMoveObject();
  if (gs.je) gp.startJumpEnter();
});

// Needed for confirm button click handler
function movePlanRegion() {
  const planCorners =
    mv.plan.map(x => [...pl[gs.turn][x]]);
  const [pw, ph] = pl[gs.turn].ps;
  const planRegions = planCorners.map(x => ({
    left: x[0], right: x[0] + pw,
    top: x[1], bottom: x[1] + ph,
  }));
  return boundingBox(...planRegions);
};
function bringIntoView(region, after) {
  const padding = [216, 108];
  // Auto-scroll animation and delay times will
  // taper to zero nonlinearly according
  // to the taperTransform function
  // if the (Euclidean) distance to be scrolled
  // is less than taperDistance
  const taperDistance = 648;
  const taperTransform = x => {
    if (x < 0) return 0;
    if (x > 1) return 1;
    return Math.sqrt(x);
  };
  const ww = $(window).width();
  const wh = $(window).height();
  const [ph, pv] = padding;
  const current = {
    left: $(document).scrollLeft(),
    right: $(document).scrollLeft() + ww,
    top: $(document).scrollTop(),
    bottom: $(document).scrollTop() + wh,
  };
  const excess = [
    (region.right - region.left) - ww + ph * 2,
    (region.bottom - region.top) - wh + pv * 2,
  ].map(x => Math.max(x, 0));
  const target = {
    left: region.left - ph + excess[0] / 2,
    right: region.right + ph - excess[0] / 2,
    top: region.top - pv + excess[1] / 2,
    bottom: region.bottom + pv - excess[1] / 2,
  };
  const scrollObj = {
    scrollLeft: Math.min(target.left, current.left),
    scrollTop: Math.min(target.top, current.top),
  };
  if (target.right > current.right) {
    scrollObj.scrollLeft = target.right - ww;
  }
  if (target.bottom > current.bottom) {
    scrollObj.scrollTop = target.bottom - wh;
  }
  const distance = Math.hypot(
    scrollObj.scrollLeft - current.left,
    scrollObj.scrollTop - current.top,
  );
  const taper = taperTransform(
    Math.min(1, distance / taperDistance)
  );
  const duration = anim.time.autoScroll * taper;
  const delay = anim.time.autoScrollDelay * taper
  $('html').animate(scrollObj, duration, () => {
    setTimeout(after, delay);
  });
}

// Confirm button click handler
$('#confirm-button').click(() => {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  clearVisibleMove();
  $('#zoom-default').click();
  const end = mv.plan[mv.plan.length - 1];
  bringIntoView(movePlanRegion(gs.turn), () => {
    for (const s of mv.plan.slice(1)) {
      if (gs.turn === 'human') {
        gp.moveHuman(mv.selected, s, s === end);
      } else gp.moveRaptor(mv.selected, s, s === end);
    }
  });
});

// Needed for T-rex button click handler
function spaceRegion(id) {
  const $obj = $(`#${id}`);
  return {
    left: $obj.offset().left,
    right: $obj.offset().left + $obj.width(),
    top: $obj.offset().top,
    bottom: $obj.offset().top + $obj.height(),
  };
};
function trexMoveRegion() {
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
    oldSpaceRegion, newSpaceRegion,
  );
};

// T-rex button click handler
$('#ok-trex-move').click(() => {
  if (gs.phase !== 'move') return;
  gs.phase = 'execute';
  ui.hideButton('ok-trex-move');
  $('#zoom-default').click();
  bringIntoView(trexMoveRegion(), () => {
    gp.moveTrex(gs.trex - 1, true);
  });
});

// Needed for zoom button click handlers
function highlightPieces(setting) {
  const $pieces =
    $('.raptor-piece, .human-piece, .trex-piece')
  const ids = zd.highlightBlinkIds;
  if (setting) {
    $pieces.addClass('highlighted');
    const id = setInterval(() => {
      $('.highlighted').toggleClass('on');
    }, anim.time.highlightBlink);
    ids.push(id);
  } else {
    $pieces.removeClass('highlighted');
    while (ids.length) clearInterval(ids.pop());
  }
}
function applyZoomCenter() {
  const {left: cl, top: ct} = zd.center;
  const fc = zd.factor.current;
  const $w = $(window);
  $(document).scrollLeft(cl * fc - $w.width() / 2);
  $(document).scrollTop(ct * fc - $w.height() / 2);
}
function zoomGeneral(factor) {
  if (!zd.factor.current) {
    zd.factor.current = 1;
    applyZoomCenter();
    return;
  }
  if (zd.factor.current === factor) return;
  if (zd.factor.current >= 1) {
    const $d = $(document);
    const $w = $(window);
    const left = $d.scrollLeft() + $w.width() / 2;
    const top = $d.scrollTop() + $w.height() / 2;
    zd.center.left = left / zd.factor.current;
    zd.center.top = top / zd.factor.current;
  }
  $('#gameplay-container').css('zoom', factor);
  zd.factor.current = factor;
  applyZoomCenter();
  $('.non-zoom').css('zoom', 1 / zd.factor.current);
  highlightPieces(factor < 1);
  $('.human-space, .human-edge')
    .toggleClass('more-visible', factor < 1);
  $('.zoom-button').removeClass('current');
  $('.edit-control .obstructive').removeClass('slim');
  if (gs.turn === 'over') $('#game-over').show();
};

// Zoom button click handlers
$('#zoom-out').click(() => {
  const factorFit = Math.max(
    $(window).width() / zd.boardSize[0],
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

// Make die faces
const dieTargetWidth = cssInt('--die-content-width');
for (const species of Object.keys(dice)) {
  for (const type of Object.keys(dice[species])) {
    const values = [... new Set(dice[species][type])];
    for (const v of values) {
      const $face = $('<div></div>');
      const classStr =
        `face face-${species} face-${type}`;
      $face.addClass(classStr).attr('data-roll', v);
      $face.appendTo(`#die-${species}-${type}`);
      const $copy = $face.clone().addClass('copy');
      $copy.appendTo('body');
      // Calculation of squeeze transform must be
      // delayed to give browser adequate time
      // to apply correct width to $copy
      setTimeout(() => {
        const rawWidth = $copy.width();
        $copy.remove();
        if (rawWidth <= dieTargetWidth) return;
        const s = dieTargetWidth / rawWidth;
        const t = dieTargetWidth * (s - 1) / 2;
        const transformString =
          `translate(${t}px, 0) scale(${s}, 1)`;
        $face.css('transform', transformString);
      }, aTime * 6);
      $face.css('display', 'none');
    }
  }
}

// Message hover handler
function mouseover(inbound) {
  const cv = inbound ? 'hidden' : 'visible';
  const hd = inbound ? 'flex' : 'none';
  const $mc = $('#message-container');
  if ($mc.is(':animated')) return;
  $mc.children('.content').css('visibility', cv);
  $mc.children('.hider').css('display', hd);
}
$('#message-container').click(ui.hideMessage).hover(
  () => {mouseover(true);}, () => {mouseover(false);}
);

// Gameplay audio toggle button click handler
$('#toggle-audio').click(() => {
  if (music.audioOn) {
    $('.icon.audio-on').hide();
    $('.icon.audio-off').show();
    music.element.pause();
  } else {
    $('.icon.audio-off').hide();
    $('.icon.audio-on').show();
    music.element.play();
  }
  music.audioOn = !music.audioOn;
});

// Make piece-specific controls for edit mode
edit.makePieceControls();
