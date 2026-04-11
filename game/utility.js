'use strict';

function deepCopy(x) {
  return JSON.parse(JSON.stringify(x));
}
function isNull(x) {
  return x === null;
}
function sequence(n) {
  return new Array(n).fill().map((_, i) => i);
}

function arrayMinus(arrFrom, arrSubtracted) {
  return arrFrom.map((e, i) => e - arrSubtracted[i]);
}
function arraySum(arr) {
  return arr.reduce((a, e) => a + e);
}
function arrayCumSum(arr) {
  return arr.map(
    (_, i, a) => arraySum(a.slice(0, i + 1))
  );
}

function rollDie(die, prngFn) {
  return die[Math.floor(prngFn() * die.length)];
}
function shuffle(arr, prngFn) {
  const output = [];
  const remaining = arr.slice(0);
  while (remaining.length) {
    const pick = rollDie(remaining, prngFn);
    const pickIndex = remaining.indexOf(pick);
    output.push(pick);
    remaining.splice(pickIndex, 1);
  }
  return output;
}

function cssInt(property, where = ':root') {
  return parseInt($(where).css(property) ?? 0);
}
function cssIntWH(propertyStem, where = ':root') {
  return ['width', 'height'].map(
    x => cssInt(`${propertyStem}-${x}`, where)
  );
}

// Encode array of one-byte integers to base64
//   and keep a specified number of characters
function base64(codeArr, nKeep) {
  return btoa(
    String.fromCharCode(...codeArr)
  ).substring(0, nKeep);
}

// Decode base64 into array of one-byte integers
function base256(base64string) {
  return atob(base64string).split('').map(
    x => x.charCodeAt(0)
  );
}

// Detect if script is running in simulation mode
//   (i.e., in node rather than in a broswer)
// If so, assign settings needed for simulation
//   to the global object
if(typeof global !== typeof void 0) {
  Object.assign(global, {
    deepCopy, isNull, sequence,
    arrayMinus, arraySum, arrayCumSum,
    rollDie, shuffle,
  });
}
