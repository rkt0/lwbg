import {
  invertMap, base256, fileContents,
} from './utility.js';
import {ai} from './ai.js';
import {pieces} from './pieces.js';
import {gs} from './game-objects.js';
import {gp} from './functions-gameplay.js';
import {control} from './control.js';

export const serialize = {
  code: {signature: 'LWBG', logic: 0, format: 0.5},
  header() {
    const {signature, logic, format} = this.code;
    return `${signature}\n${logic},${format}`;
  },
  control() {
    const leader = leaderFromItem.get('control');
    const hData = ai.control.human.code ?? digit(-1);
    const rData = ai.control.raptor.code ?? digit(-1);
    return leader + hData + rData;
  },
  pieces() {
    const hData = serializeSpeciesPieces('human');
    const rData = serializeSpeciesPieces('raptor');
    return `${hData}\n${rData}`;
  },
  changes(gsPrevious) {
    let data = '';
    for (const [h, space] of gs.humans.entries()) {
      if (space === gsPrevious.humans[h]) continue;
      data += serializeMove('human', h, space);
    }
    if (gs.trex !== gsPrevious.trex) {
      data += serializeMove('trex', '', gs.trex);
    }
    for (const [r, space] of gs.raptors.entries()) {
      if (space === gsPrevious.raptors[r]) continue;
      data += serializeMove('raptor', r, space);
    }
    if (gs.rollN !== gsPrevious.rollN) {
      data += serializeDie('rollN', gs.rollN);
    }
    if (gs.rollGo !== gsPrevious.rollGo) {
      data += serializeDie('rollGo', gs.rollGo);
    }
    if (gs.turn !== gsPrevious.turn) {
      data += serializeTurn(gs.turn);
    }
    return data;
  },
  markEdit(data) {
    const leader = leaderFromItem.get('editBegin');
    const follower = leaderFromItem.get('editEnd');
    return leader + data + follower;
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
function digit(n) {
  return (((n % base) + base) % base).toString(base);
}

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

// Helper functions for player control
function findAndSetLevel(species, code) {
  const levels = ai.level[species];
  const i = levels.findIndex((x) => x.code === code);
  // i is -1 if not found, i.e., manual
  control.change(species, i);
  ai.control.changed = false;
}

// Leaders for change items
const itemFromLeader = new Map([
  ['C', 'control'],
  ['H', 'human'],
  ['T', 'trex'],
  ['R', 'raptor'],
  ['N', 'rollN'],
  ['G', 'rollGo'],
  [' ', 'turn'],
  ['E', 'editBegin'],
  ['F', 'editEnd'],
]);
const leaderFromItem = invertMap(itemFromLeader);

// Helper functions for turn
const turnFromData = new Map([
  [0, 'over'],
  [1, 'human'],
  [2, 'trex'],
  [3, 'raptor'],
]);
const dataFromTurn = invertMap(turnFromData);
function serializeTurn(turn) {
  const leader = leaderFromItem.get('turn');
  return leader + dataFromTurn.get(turn);
}

// Helper functions for dice
const rollFromData = new Map([
  [digit(-3), 'Jump'],
  [digit(-2), 'Enter'],
  [digit(-1), null],
]);
const dataFromRoll = invertMap(rollFromData);
function serializeDie(dieType, roll) {
  const leader = leaderFromItem.get(dieType);
  return leader + (dataFromRoll.get(roll) ?? roll);
}

// Helper functions for moves
function serializeMove(species, piece, space) {
  const leader = leaderFromItem.get(species);
  let spaceData = space.toString(base);
  if (spaceData.length < 2 && species !== 'trex') {
    spaceData = '0' + spaceData;
  }
  return leader + piece.toString(base) + spaceData;
}
