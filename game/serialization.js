import {invertMap, fileContents} from './utility.js';
import {gs} from './game-objects.js';
import {pieces} from './pieces.js';
import {ai} from './ai.js';
import {control} from './control.js';
import {gp} from './gameplay.js';

export const serialize = {
  code: {signature: 'LWBG', logic: 0, format: 1},
  header() {
    const {signature, logic, format} = this.code;
    return `${signature}\n${logic},${format}`;
  },
  pieces() {
    const hData = serializeSpeciesPieces('human');
    const rData = serializeSpeciesPieces('raptor');
    return `${hData}\n${rData}`;
  },
  changes(gsPrevious) {
    if (ai.control.changed) {
      ai.control.changed = false;
      return serializeControl();
    }
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

export async function deserialize(fh) {
  const lines = await fileContents(fh, true);
  deserializePieces(lines.slice(2, 4));
  const changesData = lines[4].split(/(?=[A-Z ])/);
  for (const data of changesData) {
    await deserializeChange(data);
  }
  reconcileGameStateAfterDeserialization();
  gp.adjustHumanPositions();
}

export async function checkHeader(fh) {
  const lines = await fileContents(fh, true);
  const data = lines.slice(0, 2).join('\n');
  return serialize.header() === data;
}

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
function deserializePieces(dataLines) {
  const [hData, rData] = dataLines;
  deserializeSpeciesPieces('human', hData);
  deserializeSpeciesPieces('raptor', rData);
  pieces.addImgs();
}

// Helper functions for change items
const itemFromLeader = new Map([
  ['C', 'ctrl'],
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
async function deserializeChange(data) {
  const item = itemFromLeader.get(data.slice(0, 1));
  switch (item.slice(0, 4)) {
    case 'edit': return;
    case 'ctrl': return deserializeControl(data);
    case 'turn': return deserializeTurn(data);
    case 'roll': return deserializeDie(item, data);
    default: await deserializeMove(item, data);
  }
}
function reconcileGameStateAfterDeserialization() {
  if (gs.rollN === null) gs.phase = 'roll';
  else if (gs.turn === 'trex') gs.phase = 'move';
  else gs.phase = 'select';
  gs.je = ['Jump', 'Enter'].includes(gs.rollN);
}

// Helper functions for player control
function serializeControl() {
  const leader = leaderFromItem.get('ctrl');
  const hData = ai.control.human.code ?? digit(-1);
  const rData = ai.control.raptor.code ?? digit(-1);
  return leader + hData + rData;
}
function findAndSetLevel(species, code) {
  const levels = ai.level[species];
  const i = levels.findIndex((x) => x.code === code);
  // i is -1 if not found, i.e., manual
  control.change(species, i);
  ai.control.changed = false;
}
function deserializeControl(data) {
  const [, h, r] = data.split('');
  findAndSetLevel('human', h);
  findAndSetLevel('raptor', r);
}

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
function deserializeTurn(data) {
  gs.turn = turnFromData.get(+data.slice(1));
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
function deserializeDie(dieType, data) {
  const char = data.slice(1);
  gs[dieType] = rollFromData.has(char) ?
    rollFromData.get(char) : +char;
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
async function deserializeMove(species, data) {
  let piece = parseInt(data.slice(1, 2), base);
  let space = parseInt(data.slice(2), base);
  if (species === 'trex') [piece, space] = [, piece];
  await gp.relocatePiece(species, piece, space);
}
