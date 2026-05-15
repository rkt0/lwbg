import {ce, cesvg, cssIntWH} from './utility.js';

export function addBldgBgs(svg) {
  for (const [i, pattern] of patternList.entries()) {
    pattern.id = `bldg-bg-${i}`;
    svg.append(pattern);
  }
}

export function addEntrances(svg, centers) {
  for (const center of centers) {
    const element = cesvg('polygon');
    element.classList.add('raptor-entrance');
    const pts = entranceMarkerShape.map(
      pt => [pt[0] + center[0], pt[1] + center[1]]
    );
    element.setAttribute('points', pts.join(' '));
    svg.append(element);
  }
}

export function addJumps(container, markers) {
  for (const point of markers.jump) {
    addJumpMarker(container, point, 'Jump');
  }
  for (const point of markers.land) {
    addJumpMarker(container, point, 'Land');
  }
}

export function addHelos(container, corners) {
  for (const [l, t] of corners) {
    const img = ce('img');
    img.src = 'img/helo/helo.png';
    img.classList.add('helo');
    img.style.left = `${l}px`;
    img.style.top = `${t}px`;
    container.append(img);
  }
}

function makePattern(src, dimensions) {
  const pattern = cesvg('pattern');
  pattern.setAttribute('width', dimensions[0]);
  pattern.setAttribute('height', dimensions[1]);
  const units = 'userSpaceOnUse';
  pattern.setAttribute('patternUnits', units);
  const image = cesvg('image');
  image.setAttribute('href', `img/bldg/${src}`);
  pattern.append(image);
  return pattern;
}
const patternList = [
  makePattern('block-gy.png', [96, 72]),
  makePattern('block-yw.png', [96, 72]),
  makePattern('block-dk.png', [96, 72]),
  makePattern('brick.png', [48, 48]),
  makePattern('wood-s-yw.png', [480, 120]),
  makePattern('wood-s-gy.png', [480, 120]),
  makePattern('wood-l-rd.png', [480, 144]),
  makePattern('wood-l-bn.png', [480, 144]),
  makePattern('vertical.png', [6, 1]),
  makePattern('concrete.png', [500, 250]),
  makePattern('asphalt.png', [250, 180]),
];

const radiusOuter = 80;
const radiusInner = 40;
const nRays = 12;
const period = 2 * Math.PI / nRays;
function circleCoords(angle, r) {
  return [r * Math.cos(angle), r * Math.sin(angle)];
}
const entranceMarkerShape = [];
for (let i = 0; i < nRays; i++) {
  entranceMarkerShape.push(
    circleCoords(i * period, radiusInner),
    circleCoords((i + 0.5) * period, radiusOuter),
  );
}

const jumpDimensions = cssIntWH('--jump-land');
const jumpOffset = jumpDimensions.map(t => t / 2);
function addJumpMarker(container, point, text) {
  const div = ce('div');
  div.classList.add('jump-land-marker');
  div.append(text);
  div.style.left = `${point[0] - jumpOffset[0]}px`;
  div.style.top = `${point[1] - jumpOffset[1]}px`;
  container.append(div);
}
