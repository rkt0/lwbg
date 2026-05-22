import {deepCopy, base64} from './utility.js';
import {debug} from './debug.js';
import {ai} from './ai.js';
import {pieces} from './pieces.js';
import {gs} from './game-objects.js';
import {gp} from './functions-gameplay.js';

export const autoSave = {
  defaultDirectory: 'desktop',
  fileType: {
    description: 'Text Files',
    accept: {'text/plain': ['.txt']},
  },
  clear() {
    this.fh = void 0;
    this.fhLoad = void 0;
    this.gsPrevious = deepCopy(gs);
  },
  async update(markAsEdited) {
    if (debug.skipAutoSave) return;
    const changes = compressChanges();
    if (!changes.length) return;
    const file = await this.fh.getFile();
    const contents = await file.text();
    const writable = await this.fh.createWritable();
    await writable.write(contents);
    if (markAsEdited) await writable.write('@@@');
    await writable.write(changes);
    await writable.close();
    this.gsPrevious = deepCopy(gs);
  },
  async checkPermission() {
    if (debug.skipAutoSave) return true;
    const status = await this.fh.requestPermission({
      mode: 'readwrite',
    });
    return status === 'granted';
  },
  async createFile() {
    const fh = await showSaveFilePicker({
      startIn: this.defaultDirectory,
      types: [this.fileType],
    });
    const file = await fh.getFile();
    const contents = await file.text();
    if (contents.length) throw new Error();
    return fh;
  },
  async createNewGameFile() {
    const fh = await this.createFile();
    this.fh = fh;
    const writable = await fh.createWritable();
    const playerCode = ai.control.fullSaveCode();
    await writable.write(
      'LWBG\n' + formatCode.gameLogic + ',' +
      formatCode.compression + '\n' + playerCode +
      '\n' + compressPieces() + '\n'
    );
    await writable.close();
  },
};

// Inject into gameplay object
gp.save = () => {autoSave.update();};

// Allow for future changes to save file format
const formatCode = {gameLogic: 0, compression: 0};

// Compress information for save file
function compressPieces() {
  if (formatCode.compression !== 0) return;
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
}
function codeRollN(rollN) {
  if (rollN === 'Jump' || rollN === 'Enter') return 5;
  if (rollN === 0) return 6;
  if (rollN === null) return 7;
  return gs.rollN;
}
function codeTurn(turn) {
  if (turn === 'human') return 1;
  if (turn === 'trex') return 2;
  if (turn === 'raptor') return 3;
  return 0;
}
function compressChanges() {
  if (formatCode.compression !== 0) return;
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
    const codeOld = codeRollN(oldRollN);
    const codeNew = codeRollN(gs.rollN);
    changeIntOther += codeOld << 9 | codeNew << 6;
  }
  const oldRollGo = autoSave.gsPrevious.rollGo;
  if (gs.rollGo !== oldRollGo) {
    changeIntOther += oldRollGo << 5 | gs.rollGo << 4;
  }
  const oldTurn = autoSave.gsPrevious.turn;
  if (gs.turn !== oldTurn) {
    const codeOld = codeTurn(oldTurn);
    const codeNew = codeTurn(gs.turn);
    changeIntOther += codeOld << 2 | codeNew;
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
  if (!changeCodes.length) return '';
  return changeCodes.join('') + ';';
}
