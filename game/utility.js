export function qjs(value, parent = document) {
  return parent.querySelector(`[data-js="${value}"]`);
}
export function qd(attr, parent = document) {
  const selector = `[data-${attr}]`;
  return parent.querySelector(selector);
}
export function qdv(attr, value, parent = document) {
  const selector = `[data-${attr}="${value}"]`;
  return parent.querySelector(selector);
}
export function qda(attr, parent = document) {
  const selector = `[data-${attr}]`;
  return [...parent.querySelectorAll(selector)];
}
export function closestData(event, attr = 'js') {
  const selector = `[data-${attr}]`;
  const element = event.target.closest(selector);
  return element?.dataset[camelFromKebab(attr)];
}

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
export function fromTemplate(id, oneElement) {
  const {content} = document.getElementById(id);
  const node = content.cloneNode(true);
  if (oneElement) return node.firstElementChild;
  return node;
}
export function click(x, type = 'mousedown') {
  const element = typeof x === 'object' ? x : qs(x);
  element.dispatchEvent(new MouseEvent(type, {
    bubbles: true, cancelable: true,
  }));
}
export function waitForClick(x, type = 'mousedown') {
  const element = typeof x === 'object' ? x : qs(x);
  return new Promise((resolve) => {
    aelo(element, type, resolve);
  });
}

export function sleep(delay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
  });
}

export function addWarningBeforeUnload() {
  ael(window, 'beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
  });
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

export function invertMap(source) {
  const values = source.values();
  const valuesUnique = new Set(values);
  if (valuesUnique.size < values.length) {
    throw new Error('values are not unique');
  }
  const output = new Map();
  for (const [key, value] of source) {
    output.set(value, key);
  }
  return output;
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

export function camelFromKebab(str) {
  return str.replace(/-./g, x => x[1].toUpperCase());
}
export function kebabFromCamel(str) {
  return str.replace(
    /[A-Z]/g, x => `-${x.toLowerCase()}`,
  );
}

export function sqrtStep(t) {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return Math.sqrt(t);
}
export function smoothStep(t) {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t * t * (3 - 2 * t);
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

export function windowWH() {
  const {innerWidth, innerHeight} = window;
  return [innerWidth, innerHeight];
}
export function absoluteBoundingRect(x) {
  const element = typeof x === 'object' ? x : qs(x);
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left + scrollX,
    right: rect.right + scrollX,
    top: rect.top + scrollY,
    bottom: rect.bottom + scrollY,
  };
}
export function boundingBox(...rects) {
  return {
    left: Math.min(...rects.map(x => x.left)),
    right: Math.max(...rects.map(x => x.right)),
    top: Math.min(...rects.map(x => x.top)),
    bottom: Math.max(...rects.map(x => x.bottom)),
  };
}
export function setSvgSize(svg, size) {
  svg.setAttribute('width', size[0]);
  svg.setAttribute('height', size[1]);
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

export async function fileContents(fh, splitLines) {
  const file = await fh.getFile();
  const contents = await file.text();
  return splitLines ? contents.split('\n') : contents;
}
export async function appendToFile(fh, data) {
  const writable = await fh.createWritable({
    keepExistingData: true,
  });
  const file = await fh.getFile();
  await writable.seek(file.size);
  await writable.write(data);
  await writable.close();
}
export async function copyFile(fhSource, fhDest) {
  const contents = await fileContents(fhSource);
  const writable = await fhDest.createWritable();
  await writable.write(contents);
  await writable.close();
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
