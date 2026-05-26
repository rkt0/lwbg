import {
  deepCopy, appendToFile, copyFile,
} from './utility.js';
import {debug} from './debug.js';
import {ai} from './ai.js';
import {gs} from './game-objects.js';
import {ui} from './functions-ui.js';
import {gp} from './functions-gameplay.js';
// Remember to fix this
import {
  serialize, deserialize,
} from './old-serialization.js';

export const autoSave = {
  fileType: {
    description: 'Text Files',
    accept: {'text/plain': ['.txt']},
  },
  clear() {
    this.fh = null;
    this.fhLoad = null;
    this.gsPrevious = deepCopy(gs);
  },
  async update(markAsEdited) {
    if (debug.skipAutoSave) return;
    const data = serialize.changes(this.gsPrevious);
    if (!data.length) return;
    const editMarker = markAsEdited ? '@@@' : '';
    await appendToFile(this.fh, editMarker + data);
    this.gsPrevious = deepCopy(gs);
  },
  async playerChange() {
    if (debug.skipAutoSave) return;
    const data = serialize.players() + ';'
    await appendToFile(this.fh, data);
  },
  async checkPermission(queryOnly) {
    if (debug.skipAutoSave) return true;
    const method = queryOnly ?
      'queryPermission' : 'requestPermission';
    const status = await this.fh[method]({
      mode: 'readwrite',
    });
    return status === 'granted';
  },
  async createFile(load) {
    this.fh = await showSaveFilePicker({
      types: [this.fileType],
    });
    if (load) await copyFile(this.fhLoad, this.fh);
    else {
      const data = serialize.header() + '\n' +
        serialize.players() + '\n' +
        serialize.pieces() + '\n';
      await appendToFile(this.fh, data);
    }
  },
  async copyInGame() {
    this.fhLoad = this.fh;
    await this.createFile(true);
  },
  async selectFileToLoad() {
    const [fhLoad] = await showOpenFilePicker({
      types: [this.fileType],
    });
    if (await deserialize.checkHeader(fhLoad)) {
      this.fhLoad = fhLoad;
    } else throw new Error('invalid file');
  },
  async executeLoad(fhLoad) {
    const file = await fhLoad.getFile();
    const contents = await file.text();
    const lines = contents.split('\n');
    deserialize.players(lines[2]);
    deserialize.pieces(lines[3]);
    const changeCodeStrings = lines[4].split(';');
    changeCodeStrings.pop();
    for (const ccs of changeCodeStrings) {
      await deserialize.change(ccs);
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
    if (gs.turn === 'trex' && gs.phase === 'move') {
      if (gs.rollN) ui.showButton('ok-trex-move');
      else ui.showButton('ok-no-move');
    }
    ui.humanItemsClickable(gs.turn === 'human');
    ui.raptorItemsClickable(gs.turn === 'raptor');
  },
};

// Inject into gameplay object
gp.save = () => autoSave.update();
