export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
export function ael(x, type, fn) {
  const element = typeof x === 'object' ? x : qs(x);
  const f = (e) => {
    e.preventDefault();
    fn.bind(element, e)();
  };
  element.addEventListener(type, f);
}
export function aelo(x, type, fn) {
  const element = typeof x === 'object' ? x : qs(x);
  const f = (e) => {
    e.preventDefault();
    fn.bind(element, e)();
  };
  element.addEventListener(type, f, {once: true});
}
export function ce(...args) {
  return document.createElement(...args);
}
export function cesvg(...args) {
  const uri = 'http://www.w3.org/2000/svg';
  return document.createElementNS(uri, ...args);
}
export function click(x, type = 'mousedown') {
  const element = typeof x === 'object' ? x : qs(x);
  element.dispatchEvent(new MouseEvent(type));
}

export function deepCopy(x) {
  return JSON.parse(JSON.stringify(x));
}
export function isNull(x) {
  return x === null;
}
export function sequence(n) {
  return new Array(n).fill().map((_, i) => i);
}

export function arrayMinus(arrFrom, arrSubtracted) {
  return arrFrom.map((e, i) => e - arrSubtracted[i]);
}
export function arraySum(arr) {
  return arr.reduce((a, e) => a + e);
}
export function arrayCumSum(arr) {
  return arr.map((_, i, a) => {
    const partial = a.slice(0, i + 1);
    return arraySum(partial);
  });
}

export function smoothStep(t) {
  if (t < 0) return 0;
  else if (t > 1) return 1;
  else return t * t * (3 - 2 * t);
}
export function lerp(v0, v1, progress) {
  return v0.map((e, i) => e + progress * (v1[i] - e));
}

export function rollDie(die, prngFn) {
  return die[Math.floor(prngFn() * die.length)];
}
export function shuffle(arr, prngFn) {
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

export function cssInt(property, where = ':root') {
  const style = getComputedStyle(qs(where));
  const value = style.getPropertyValue(property);
  return parseInt(value || 0);
}
export function cssIntWH(stem, where = ':root') {
  const dims = ['width', 'height'];
  return dims.map(x => cssInt(`${stem}-${x}`, where));
}

// Encode array of one-byte integers to base64
// and keep a specified number of characters
export function base64(codeArr, nKeep) {
  const str = String.fromCharCode(...codeArr);
  return btoa(str).substring(0, nKeep);
}

// Decode base64 into array of one-byte integers
export function base256(base64string) {
  const arr = atob(base64string).split('');
  return arr.map(x => x.charCodeAt(0));
}
