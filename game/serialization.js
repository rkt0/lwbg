import {
  click, base64, base256, fileContents,
} from './utility.js';
import {ai} from './ai.js';
import {pieces} from './pieces.js';
import {gs} from './game-objects.js';
import {gp} from './functions-gameplay.js';

export const serialize = {
  code: {signature: 'LWBG', logic: 0, format: 0.2},
  header() {
    const {signature, logic, format} = this.code;
    return `${signature}\n${logic},${format}`;
  },
  players() {
    const hData = ai.control.human.code ?? lastDigit;
    const rData = ai.control.raptor.code ?? lastDigit;
    return `C${hData}${rData}`;
  },
  pieces() {
    const hData = serializeSpeciesPieces('human');
    const rData = serializeSpeciesPieces('raptor');
    return `${hData}\n${rData}`;
  },
  changes(gsPrevious) {
    const changeIntsRH = [];
    let changeIntTrex = 0;
    let changeIntOther = 0;
    for (const [p, s] of gs.humans.entries()) {
      const old = gsPrevious.humans[p];
      if (s === old) continue;
      changeIntsRH.push(p + 4 << 14 | old << 7 | s);
    }
    for (const [p, s] of gs.raptors.entries()) {
      const old = gsPrevious.raptors[p];
      if (s === old) continue;
      changeIntsRH.push(p << 14 | old << 7 | s);
    }
    const oldTrex = gsPrevious.trex;
    if (gs.trex !== oldTrex) {
      changeIntTrex = oldTrex << 4 | gs.trex;
    }
    const oldRollN = gsPrevious.rollN;
    if (gs.rollN !== oldRollN) {
      const codeOld = codeRollN(oldRollN);
      const codeNew = codeRollN(gs.rollN);
      changeIntOther += codeOld << 9 | codeNew << 6;
    }
    const oldRollGo = gsPrevious.rollGo;
    if (gs.rollGo !== oldRollGo) {
      changeIntOther +=
        oldRollGo << 5 | gs.rollGo << 4;
    }
    const oldTurn = gsPrevious.turn;
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
  },
};

export const deserialize = {
  async checkHeader(fh) {
    const lines = await fileContents(fh, true);
    const data = lines.slice(0, 2).join('\n');
    return serialize.header() === data;
  },
  players(playerCodeString) {
    const [, h, r] = playerCodeString.split('');
    findAndSetLevel('human', h);
    findAndSetLevel('raptor', r);
  },
  pieces(dataLines) {
    const [hData, rData] = dataLines;
    deserializeSpeciesPieces('human', hData);
    deserializeSpeciesPieces('raptor', rData);
    pieces.addImgs();
  },
  async change(changeCodeString) {
    if (changeCodeString.startsWith('%')) {
      this.players(changeCodeString);
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
            'over', 'human', 'trex', 'raptor',
          ][turnCodes & 3];
        }
        if (rollGoCodes) gs.rollGo = rollGoCodes & 1;
        if (rollNCodes) {
          const special = gs.turn === 'human' ?
            'Jump' : 'Enter';
          gs.rollN = [
            0, 1, 2, 3, 4, special, 0, null,
          ][rollNCodes & 7];
        }
        gs.phase = gs.rollN === null ? 'roll' :
          gs.turn === 'trex' ? 'move' : 'select';
        gs.je = ['Jump', 'Enter'].includes(gs.rollN);
      } else if (first === '|') {
        const changeInt = charCodes[0];
        const space = changeInt & 15;
        await gp.relocatePiece('trex', null, space);
      } else {
        const changeInt = charCodes[0] << 10 |
          charCodes[1] << 2 | charCodes[2] >> 6;
        const pieceCode = changeInt >> 14;
        const loc = changeInt & 127;
        let species = 'raptor';
        let piece = pieceCode;
        if (pieceCode >> 2) {
          species = 'human';
          piece = pieceCode - 4;
        }
        await gp.relocatePiece(species, piece, loc);
      }
    }
  },
};

// Base (radix) for integer-to-string conversions
const base = 36;
const lastDigit = (base - 1).toString(base);

// Helper functions for pieces
function serializeSpeciesPieces(species) {
  const arr = [];
  const {feature} = pieces[species];
  const keys = Object.keys(feature).sort();
  for (let i = 0; i < gs[`${species}s`].length; i++) {
    let str = '';
    for (const key of keys) {
      str += feature[key][i].toString(base);
    }
    arr.push(str);
  }
  return arr.join(' ');
}
function deserializeSpeciesPieces(species, data) {
  const dataArr = data.split(' ');
  const {feature} = pieces[species];
  const keys = Object.keys(feature).sort();
  for (const [i, str] of Object.entries(dataArr)) {
    const strArr = str.split('');
    for (const [k, key] of Object.entries(keys)) {
      feature[key][i] = parseInt(strArr[k], base);
    }
  }
}

// Other helper functions
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
function findAndSetLevel(species, code) {
  const levels = ai.level[species];
  const i = levels.findIndex((x) => x.code === code);
  // i is -1 if not found, i.e., manual
  const c = i < 0 ? 'manual' : `ai-${i}`;
  click(`#${species}-control .${c}`);
  ai.control.changed = false;
}
