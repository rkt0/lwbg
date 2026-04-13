'use strict';

// Container object for auto-save
const autoSave = {
  defaultDirectory: 'desktop',
  fileType: {
    description: 'Text Files',
    accept: {'text/plain': ['.txt']},
  },
  code: {gameFormat: 0, compression: 0},
  // gsPrevious: deepCopy(gs),
};

// Clear auto-save when starting new game
autoSave.clear = () => {
  autoSave.fh = void 0;
  autoSave.gsPrevious = deepCopy(gs);
};
autoSave.clear();

// Begin new auto-save file (or skip) and start game
{
  const executeLoadFromFile = async fhLoad => {
    const loadPlayers = playerCodeString => {
      const [, h, r] = playerCodeString.split('%');
      const findAndSetLevel = (species, code) => {
        const i = ai.level[species].findIndex(
          x => x.saveCode === code
        );
        // i is -1 if not found, i.e., manual
        const c = i < 0 ? 'manual' : `ai-${i}`;
        $(`#${species}-control-${c}`).click();
        ai.control.changed = false;
      };
      findAndSetLevel('human', h);
      findAndSetLevel('raptor', r);
    };
    const loadPieces = pieceCodeString => {
      const pieceCodeArr = pieceCodeString.split(';');
      const hFeature = pieces.human.feature;
      const hKeys = Object.keys(hFeature).sort();
      for (let h = 0; h < gs.humans.length; h++) {
        const indices = [h * 4, (h + 1) * 4];
        const b64 = pieceCodeArr[0].slice(...indices);
        const charCodes = base256(b64);
        for (let c = 0; c < 3; c++) {
          const attr0 = charCodes[c] >> 4;
          const attr1 = charCodes[c] & 15;
          hFeature[hKeys[c * 2    ]][h] = attr0;
          hFeature[hKeys[c * 2 + 1]][h] = attr1;
        }
      }
      const raptorCodes = pieceCodeArr[1].split('');
      for (let r = 0; r < gs.raptors.length; r++) {
        const rInt = parseInt(raptorCodes[r], 16);
        pieces.raptor.feature.shape[r] = rInt >> 2;
        pieces.raptor.feature.color[r] = rInt & 3;
      }
      pieces.removeImgs();
      pieces.addImgs();
    };
    const expandAndExecute = changeCodeString => {
      if (changeCodeString.startsWith('%')) {
        loadPlayers(changeCodeString);
        return;
      }
      const changeCodes = [];
      const characters = changeCodeString.split('');
      characters.reverse();
      while (characters.length) {
        const chg = [];
        chg.push(characters.pop());
        chg.push(characters.pop());
        chg.push(characters.pop());
        changeCodes.push(chg.join(''));
      }
      for (const changeCode of changeCodes) {
        const first = changeCode.substring(0, 1);
        if (first === '@') continue;
        const b64 = (['~', '|'].includes(first)) ?
            changeCode.substring(1, 3) + 'AA' :
            changeCode + 'A';
        const charCodes = base256(b64);
        if (first === '~') {
          const changeInt =
              charCodes[0] << 4 | charCodes[1] >> 4;
          const turnCodes = changeInt & 15;
          const rollGoCodes = changeInt >> 4 & 3;
          const rollNCodes = changeInt >> 6 & 63;
          if (turnCodes) {
            gs.turn = [
              'over', 'human', 'trex', 'raptor'
            ][turnCodes & 3];
          }
          if (rollGoCodes) {
            gs.rollGo = rollGoCodes & 1;
          }
          if (rollNCodes) {
            const special = gs.turn === 'human' ?
                'Jump' : 'Enter';
            gs.rollN = [
              0, 1, 2, 3, 4, special, 0, null
            ][rollNCodes & 7];
          }
          gs.phase = gs.rollN === null ? 'roll' :
              gs.turn === 'trex' ? 'move' : 'select';
          gs.je =
              ['Jump', 'Enter'].includes(gs.rollN);
        } else if (first === '|') {
          const changeInt = charCodes[0];
          edit.relocatePiece(
            'trex', null, changeInt & 15
          );
        } else {
          const changeInt = charCodes[0] << 10 |
              charCodes[1] << 2 | charCodes[2] >> 6;
          const pieceCode = changeInt >> 14;
          const loc = changeInt & 127;
          if (pieceCode >> 2) {
            edit.relocatePiece(
              'human', pieceCode - 4, loc
            );
          } else {
            edit.relocatePiece(
              'raptor', pieceCode, loc
            );
          }
        }
      }
    };
    const file = await fhLoad.getFile();
    const contents = await file.text();
    const lines = contents.split('\n');
    loadPlayers(lines[2]);
    loadPieces(lines[3]);
    const changeCodeStrings = lines[4].split(';');
    changeCodeStrings.pop();
    for (const ccs of changeCodeStrings) {
      expandAndExecute(ccs);
    }
    gp.adjustHumanPositions();
    ui.displayTurn(gs.turn);
    if (gs.phase === 'roll') {
      ui.replaceButton('roll-display', 'roll-button');
    } else ui.displayRollResult(gs, true);
    autoSave.gsPrevious = deepCopy(gs);
    if (ai.control[gs.turn] && gs.phase !== 'roll') {
      ui.showButton('ok-ai-move');
    } else {
      ui.hideButton('ok-ai-move');
      if (gs.je) gp.startJumpEnter();
    }
    ui.humanItemsClickable(gs.turn === 'human');
    ui.raptorItemsClickable(gs.turn === 'raptor');
  };
  const startGame = async fhLoad => {
    const checkAutoSavePermission = async () => {
      if (debug.skipAutoSave) return true;
      const file = await autoSave.fh.getFile();
      const contents = await file.text();
      let writable;
      try {
        writable = await autoSave.fh.createWritable();
      } catch (error) {
        return false;
      }
      await writable.write(contents);
      await writable.close();
      return true;
    };
    const okToSave = await checkAutoSavePermission();
    const aTime = anim.time.menuFade;
    if (okToSave) {
      if (fhLoad) await executeLoadFromFile(fhLoad);
      $('#start-container').fadeOut(aTime, () => {
        $('#gameplay-container').fadeIn(aTime);
        gp.initializeView();
        if (! gs.turn) gp.endTurn();
        if (fhLoad) {
          $('body').css({overflow: 'hidden'});
          $('#more-menu')
              .fadeIn(aTime, ui.showControl);
        }
      });
    } else {
      autoSave.fh = void 0;
      $('#start-message')
          .fadeOut(aTime, ui.showStartOptions);
    }
  };
  autoSave.begin = fhLoad => {
    if (debug.skipAutoSave) {
      startGame();
      return;
    }
    if (autoSave.fh) {
      startGame(fhLoad);
      return;
    }
    const $message = $('#start-message');
    const $container = $('#start-container');
    const compressPieces = () => {
      if (autoSave.code.compression !== 0) return;
      let outputString = '';
      const hFeature = pieces.human.feature;
      const hKeys = Object.keys(hFeature).sort();
      for (let h = 0; h < gs.humans.length; h++) {
        const hInts = [];
        for (let k = 0; k < hKeys.length; k += 2) {
          const attr0 = hFeature[hKeys[k]][h];
          const attr1 = hFeature[hKeys[k + 1]][h];
          hInts.push((attr0 << 4) + attr1);
        }
        outputString += base64(hInts, 4);
      }
      outputString += ';';
      for (let r = 0; r < gs.raptors.length; r++) {
        const s = pieces.raptor.feature.shape[r];
        const c = pieces.raptor.feature.color[r];
        const rInt = (s << 2) + c;
        outputString += rInt.toString(16);
      }
      return outputString;
    };
    const createAutoSaveFile = async fhl => {
      const aTime = anim.time.menuFade;
      $message.fadeOut(aTime);
      try {
        autoSave.fh = await showSaveFilePicker({
          startIn: fhl ?? autoSave.defaultDirectory,
          types: [autoSave.fileType],
        });
      } catch (error) {
        ui.showStartOptions();
        return;
      }
      const writable =
          await autoSave.fh.createWritable();
      if (fhl) {
        const file = await fhl.getFile();
        const contents = await file.text();
        await writable.write(contents);
      } else {
        const playerCode = ai.control.fullSaveCode();
        await writable.write(
          'LWBG\n' +
          autoSave.code.gameFormat + ',' +
          autoSave.code.compression + '\n' +
          playerCode + '\n' + compressPieces() + '\n'
        );
      }
      await writable.close();
      const m0 = "Your progress will" +
          " automatically be saved to the file" +
          " that you just created.";
      const m1 = "Click anywhere to start the game.";
      $message.html(ui.asParagraphs(m0, m1));
      $message.fadeIn(aTime,
        () => $container.one('click',
          () => startGame(fhl)
        )
      );
    };
    const m0 = "You will now be asked to create" +
        " a file. Your progress will automatically" +
        " be saved to this file as you play.";
    const m1 =
        "Don't pick a file that already exists." +
        " (That existing file would be erased!)";
    const m2 = "Once you start playing, you can" +
        " also manually save your game at any time" +
        " by clicking the 'Save' button.";
    const m3 = "Click anywhere to continue.";
    $message.html(ui.asParagraphs(m0, m1, m2, m3))
        .fadeIn(anim.time.menuFade);
    $container.one(
      'click', () => createAutoSaveFile(fhLoad)
    );
  };
}

// Update auto-save file
{
  const compressChanges = () => {
    if (autoSave.code.compression !== 0) return;
    const changeIntsRH = [];
    let changeIntTrex = 0;
    let changeIntOther = 0;
    for (const [p, s] of gs.humans.entries()) {
      const old = autoSave.gsPrevious.humans[p];
      if (s === old) continue;
      changeIntsRH.push(p + 4 << 14 | old << 7 | s);
    }
    for (const [p, s] of gs.raptors.entries()) {
      const old = autoSave.gsPrevious.raptors[p];
      if (s === old) continue;
      changeIntsRH.push(p << 14 | old << 7 | s);
    }
    const oldTrex = autoSave.gsPrevious.trex;
    if (gs.trex !== oldTrex) {
      changeIntTrex = oldTrex << 4 | gs.trex;
    }
    const oldRollN = autoSave.gsPrevious.rollN;
    if (gs.rollN !== oldRollN) {
      const code = r => (
        r === 'Jump'  ? 5 :
        r === 'Enter' ? 5 :
        r === 0       ? 6 :
        r === null    ? 7 : gs.rollN
      );
      changeIntOther +=
          code(oldRollN) << 9 | code(gs.rollN) << 6;
    }
    const oldRollGo = autoSave.gsPrevious.rollGo;
    if (gs.rollGo !== oldRollGo) {
      changeIntOther +=
          oldRollGo << 5 | gs.rollGo << 4;
    }
    const oldTurn = autoSave.gsPrevious.turn;
    if (gs.turn !== oldTurn) {
      const code = t => (
        t === 'human'  ? 1 :
        t === 'trex'   ? 2 :
        t === 'raptor' ? 3 : 0
      );
      changeIntOther +=
          code(oldTurn) << 2 | code(gs.turn);
    }
    // No need to save changes to gs.phase or gs.je
    // since they can be inferred from other changes
    const changeCodes = changeIntsRH.map(i => {
      const charCodes =
          [i >> 10, i >> 2 & 255, (i & 3) << 6];
      return base64(charCodes, 3);
    });
    if (changeIntTrex) {
      const charCodes = [changeIntTrex, 0, 0];
      changeCodes.push('|' + base64(charCodes, 2));
    }
    if (changeIntOther) {
      const i = changeIntOther;
      const charCodes = [i >> 4, (i & 15) << 4, 0];
      changeCodes.push('~' + base64(charCodes, 2));
    }
    return changeCodes.length ?
        changeCodes.join('') + ';' : '';
  };
  autoSave.update = async markAsEdited => {
    if (debug.skipAutoSave) return;
    const changes = compressChanges();
    if (! changes.length) return;
    const file = await autoSave.fh.getFile();
    const contents = await file.text();
    const writable =
        await autoSave.fh.createWritable();
    await writable.write(contents);
    if (markAsEdited) await writable.write('@@@');
    await writable.write(changes);
    await writable.close();
    autoSave.gsPrevious = deepCopy(gs);
  };
}
