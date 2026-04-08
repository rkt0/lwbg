'use strict';

{

  const keys = {
    greenButton: [13, 32],          // enter space
    redButton: [27, 88, 90],        // escape x z
    toggleAudio: [77],              // m
    skipTrack: [75],                // k (with Shift)
    fullscreen: [70],               // f
    displayMode: [84],              // t
    zoomOut: [189],                 // -
    zoomIn: [187],                  // +/=
    zoomDefault: [48],              // 0
      // [48, 79, 80, 219, 220, 221],  // 0 o p [ ] \
  };

  const clickIfOk = buttonId => {
    const $button = $(`#${buttonId}`);
    if (! $button.prop('disabled')) $button.click();
  };

  const tA = e => {
    e.preventDefault();
    $('#toggle-audio').click();
  };
  const sT = e => {
    if (! e.shiftKey) return;
    e.preventDefault();
    music.next(true, ! e.altKey);
  };
  const zIn = e => {
    e.preventDefault();
    const level =
        zd.factor.current === 1 ? 'in' : 'default';
    $(`#zoom-${level}`).click();
  };
  const zOut = e => {
    e.preventDefault();
    const level =
        zd.factor.current === 1 ? 'out' : 'default';
    $(`#zoom-${level}`).click();
  };
  const z0 = e => {
    e.preventDefault();
    $('#zoom-default').click();
  };
  const green = e => {
    e.preventDefault();
    if (edit.on) return;
    if (gs.phase === 'select') {
      const id = ai.control[gs.turn] ? 'ok-ai-move' :
          gs.je && mv.toGo === -1 ? 'ok-no-move' : '';
      if (id) clickIfOk(id);
    } else if (gs.phase === 'roll') {
      clickIfOk('roll-button');
    } else if (gs.phase === 'move') {
      const id = gs.turn === 'trex' ?
          (gs.rollN ? 'ok-trex-move' : 'ok-no-move') :
          (mv.toGo ? '' : 'confirm-button');
      if (id) clickIfOk(id);
    }
  };
  const red = e => {
    e.preventDefault();
    if (edit.on) return;
    if (gs.phase === 'move') {
      clickIfOk('cancel-button');
    }
  };
  const full = e => {
    e.preventDefault();
    ui.toggleFullscreen();
  };
  const dM = e => {
    e.preventDefault();
    ui.cycleDisplayMode();
  };

  const keyboardListener = e => {
    const keyCode = e.which;
    // Audio and display controls work everywhere
    if (keys.toggleAudio.includes(keyCode)) tA(e);
    if (keys.skipTrack.includes(keyCode)) sT(e);
    if (keys.fullscreen.includes(keyCode)) full(e);
    if (keys.displayMode.includes(keyCode)) dM(e);
    // Other keys only work in gameplay
    const tsc = '#title-container, #start-container';
    const mm = '#more-menu';
    if ($(`${tsc}, ${mm}`).is(':visible')) return;
    // Zoom keys work in edit mode
    if (keys.zoomIn.includes(keyCode)) zIn(e);
    if (keys.zoomOut.includes(keyCode)) zOut(e);
    if (keys.zoomDefault.includes(keyCode)) z0(e);
    // Other keys don't work in edit mode,
    //   but still prevent default
    if (keys.greenButton.includes(keyCode)) green(e);
    if (keys.redButton.includes(keyCode)) red(e);
  };

  $(document).keydown(keyboardListener);

}
