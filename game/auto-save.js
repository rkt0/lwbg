import {deepCopy} from './utility.js';
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
    const file = await this.fh.getFile();
    const contents = await file.text();
    const writable = await this.fh.createWritable();
    await writable.write(contents);
    if (markAsEdited) await writable.write('@@@');
    await writable.write(data);
    await writable.close();
    this.gsPrevious = deepCopy(gs);
  },
  async playerChange() {
    if (debug.skipAutoSave) return;
    const file = await this.fh.getFile();
    const contents = await file.text();
    const writable = await this.fh.createWritable();
    await writable.write(contents);
    await writable.write(serialize.players() + ';');
    await writable.close();
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
    const writable = await this.fh.createWritable();
    if (load) {
      const fileToCopy = await this.fhLoad.getFile();
      const contentsToCopy = await fileToCopy.text();
      await writable.write(contentsToCopy);
    } else {
      const data = serialize.header() + '\n' +
        serialize.players() + '\n' +
        serialize.pieces() + '\n';
      await writable.write(data);
    }
    await writable.close();
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
gp.save = () => {autoSave.update();};
