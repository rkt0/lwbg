export function qjs(value, parent = document) {
  return parent.querySelector(`[data-js="${value}"]`);
}
export function qd(attr, parent = document) {
  const selector = `[data-${attr}]`;
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

export function addWarningBeforeUnload() {
  globalThis.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
  });
}

export function cesvg(...args) {
  const uri = 'http://www.w3.org/2000/svg';
  return document.createElementNS(uri, ...args);
}

export function sleep(delay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
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
export function absoluteBoundingRect(element) {
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
  const [width, height] = size;
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
}

export function cssValue(property, {
  element = document.documentElement, float = false,
} = {}) {
  const style = getComputedStyle(element);
  const raw = style.getPropertyValue(property) || 0;
  return float ? parseFloat(raw) : parseInt(raw);
}
export function cssValueWH(propertyStem, {
  element = document.documentElement, float = false,
} = {}) {
  const style = getComputedStyle(element);
  const dimensions = ['width', 'height'];
  return dimensions.map(dimension => {
    const property = `${propertyStem}-${dimension}`;
    const raw = style.getPropertyValue(property) || 0;
    return float ? parseFloat(raw) : parseInt(raw);
  });
}
export function cssValueSides(propertyStem, {
  element = document.documentElement, float = false,
} = {}) {
  const style = getComputedStyle(element);
  const sides = ['top', 'right', 'bottom', 'left'];
  return Object.fromEntries(sides.map(side => {
    const property = `${propertyStem}-${side}`;
    const raw = style.getPropertyValue(property) || 0;
    return [
      side, float ? parseFloat(raw) : parseInt(raw),
    ];
  }));
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
