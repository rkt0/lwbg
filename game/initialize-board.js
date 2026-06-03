import {
  qs, qsa, ce, cesvg, cssInt, cssIntWH,
} from './utility.js';
import {dom} from './dom.js';
import {debug} from './debug.js';
import {bd} from './board-topology.js';
import {geom} from './board-geometry.js';
import {
  addBldgBgs, addEntrances, addJumps, addHelos,
} from './building-appearance.js';
import {pl} from './game-objects.js';
import {zoom} from './zoom.js';

// Get human edges from human paths
bd.humanEdges = [];
for (const path of bd.humanPaths) {
  for (let i = 1; i < path.length; i++) {
    bd.humanEdges.push([path[i - 1], path[i]]);
  }
}

// Get which raptor spaces are buildings
bd.bldgRaptorSpaces = bd.bldgHumanSpaces.map(
  hSpace => bd.humanSpacesInRaptorSpace.findIndex(
    hSpacesIn => hSpacesIn.includes(hSpace)
  )
);

// Get lists of move choices
bd.humanChoices = {move: [], jump: []};
for (let s = 0; s < bd.nHumanSpaces; s++) {
  const mChoices = new Set();
  const jChoices = new Set();
  for (const edge of bd.humanEdges) {
    if (edge[0] === s) mChoices.add(edge[1]);
    if (edge[1] === s) mChoices.add(edge[0]);
  }
  for (const jump of bd.humanJumps) {
    if (jump[0] === s) jChoices.add(jump[1]);
  }
  bd.humanChoices.move.push(mChoices);
  bd.humanChoices.jump.push(jChoices);
}
bd.raptorChoices = {move: [], enter: []};
for (let s = 0; s < bd.nRaptorSpaces; s++) {
  const mChoices = new Set();
  const eChoices = new Set();
  for (const edge of bd.raptorEdges) {
    if (edge[0] === s) mChoices.add(edge[1]);
    if (edge[1] === s) mChoices.add(edge[0]);
  }
  for (const enter of bd.raptorEntrances) {
    if (enter[0] === s) eChoices.add(enter[1]);
    if (enter[1] === s) mChoices.add(enter[0]);
  }
  bd.raptorChoices.move.push(mChoices);
  bd.raptorChoices.enter.push(eChoices);
}

// Extra space at edges of board
const extraSpace = {
  left: null, top: null, bottom: null, right: null,
};
for (const side of Object.keys(extraSpace)) {
  extraSpace[side] = cssInt(`--extra-space-${side}`);
}
function addExtraSpace(pts, full) {
  for (const point of pts) {
    if (!point) continue;
    point[0] += extraSpace.left;
    point[1] += extraSpace.top;
    if (full) {
      point[0] += extraSpace.right;
      point[1] += extraSpace.bottom;
    }
  }
}

// Get coordinates of raptor spaces
addExtraSpace(geom.raptorPoints);
const raptorSpacePoints = geom.raptorSpaces.map(
  ptIds => ptIds.map(id => geom.raptorPoints[id])
);

// Calculate raptor piece locations
function midpoint(arr) {
  return (Math.min(...arr) + Math.max(...arr)) / 2;
}
pl.raptor = raptorSpacePoints.map(pts => [
  midpoint(pts.map(pt => pt[0])),
  midpoint(pts.map(pt => pt[1])),
]);
for (const space of Object.keys(geom.adjustRaptor)) {
  pl.raptor[space][0] += geom.adjustRaptor[space][0];
  pl.raptor[space][1] += geom.adjustRaptor[space][1];
}

// Make raptor spaces
const svgRaptorMap = cesvg('svg');
qs('#raptor-map').append(svgRaptorMap);
for (const pts of raptorSpacePoints) {
  const element = cesvg('polygon');
  element.setAttribute('points', pts.join(' '));
  element.classList.add('raptor-space');
  svgRaptorMap.append(element);
  dom.raptorSpace.push(element);
}
if (debug.boardLabels.raptorPoint) {
  debug.makeLabels('raptor-point', geom.raptorPoints);
}
if (debug.boardLabels.raptorSpace) {
  debug.makeLabels('raptor-space', pl.raptor);
}

// Make human spaces
addExtraSpace(geom.humanSpaces);
const humanSpaceSize = cssInt('--human-space-size');
for (const pt of geom.humanSpaces) {
  const div = ce('div');
  div.classList.add('human-space');
  div.style.left = `${pt[0] - humanSpaceSize / 2}px`;
  div.style.top = `${pt[1] - humanSpaceSize / 2}px`;
  dom.sectionGameplay.append(div);
  dom.humanSpace.push(div);
  pl.human.push([...pt]);
}
dom.humanSpace[bd.humanDead].classList.add('dead');
if (debug.boardLabels.humanSpace)  {
  debug.makeLabels('human-space', geom.humanSpaces);
}

// Make buildings
const svgBuildingsMap = cesvg('svg');
addBldgBgs(svgBuildingsMap);
qs('#buildings-map').append(svgBuildingsMap);
for (const [i, bg] of geom.bldgBgId.entries()) {
  const hSpace = bd.bldgHumanSpaces[i];
  const rSpace = bd.bldgRaptorSpaces[i];
  const pts = raptorSpacePoints[rSpace];
  // Remove existing regular human space
  dom.humanSpace[hSpace].remove();
  // First make polygon with background only
  const background = cesvg('polygon');
  background.setAttribute('points', pts.join(' '));
  const fill = `url(#bldg-bg-${bg})`;
  background.setAttribute('fill', fill);
  // Then make clickable polygon on top
  const clickable = cesvg('polygon');
  clickable.setAttribute('points', pts.join(' '));
  clickable.setAttribute('fill', '#0000');
  clickable.classList.add('human-space', 'building');
  svgBuildingsMap.append(background, clickable);
  dom.humanSpace[hSpace] = clickable;
  pl.human[hSpace] = [...pl.raptor[rSpace]];
}

// Make human edges
const svgHumanEdges = cesvg('svg');
qs('#human-edges').append(svgHumanEdges);
for (const edge of bd.humanEdges) {
  const line = cesvg('line');
  const points = edge.map(i => geom.humanSpaces[i]);
  line.setAttribute('x1', points[0][0]);
  line.setAttribute('y1', points[0][1]);
  line.setAttribute('x2', points[1][0]);
  line.setAttribute('y2', points[1][1]);
  line.classList.add('human-edge');
  svgHumanEdges.append(line);
  dom.humanEdge[edge.join('-')] = line;
  dom.humanEdge[edge.toReversed().join('-')] = line;
}

// Make T-rex spaces
addExtraSpace(geom.trexSpaces);
const trexSpaceSize = cssInt('--trex-space-size');
for (const pt of geom.trexSpaces) {
  const div = ce('div');
  div.classList.add('trex-space');
  div.style.left = `${pt[0] - trexSpaceSize / 2}px`;
  div.style.top = `${pt[1] - trexSpaceSize / 2}px`;
  dom.sectionGameplay.append(div);
  dom.trexSpace.push(div);
  pl.trex.push([pt[0] + trexSpaceSize / 2, pt[1]]);
}
dom.trexSpace[0].remove();
dom.trexSpace[0] = null;
// Below is ok here since values represent
// piece location centers that will only
// be adjusted to top-left corners later
pl.trex[0] = [...pl.raptor[bd.bldgRaptorSpaces[
  bd.bldgHumanSpaces.indexOf(bd.humanStart)
]]];

// Make T-rex edges
const svgTrexEdges = cesvg('svg');
qs('#trex-edges').append(svgTrexEdges);
for (let i = 0; i < bd.trexStart; i++) {
  const line = cesvg('line');
  line.setAttribute('x1', geom.trexSpaces[i][0]);
  line.setAttribute('y1', geom.trexSpaces[i][1]);
  line.setAttribute('x2', geom.trexSpaces[i + 1][0]);
  line.setAttribute('y2', geom.trexSpaces[i + 1][1]);
  line.classList.add('trex-edge');
  svgTrexEdges.append(line);
}

// Make entrance markers
addExtraSpace(geom.entranceMarkers);
addEntrances(svgRaptorMap, geom.entranceMarkers);

// Make jump markers
addExtraSpace(geom.jumpMarkers.jump);
addExtraSpace(geom.jumpMarkers.land);
addJumps(dom.sectionGameplay, geom.jumpMarkers);

// Make helicopters
addExtraSpace(geom.heloCorners);
addHelos(dom.sectionGameplay, geom.heloCorners);

// Additional piece layout adjustments
for (const species of Object.keys(pl)) {
  const pieceSize = cssIntWH(`--${species}-piece`);
  const offset = pieceSize.map(t => t / 2);
  if (species === 'trex') offset[0] = 0;
  for (const point of pl[species]) {
    point[0] -= offset[0];
    point[1] -= offset[1];
  }
  pl[species].ps = [...pieceSize];
}
pl.trex[0][0] -= pl.trex.ps[0] / 2;
pl.human.margin = cssInt('--board-border-width');

// Set dimensions of board and svgs
zoom.boardSize = cssIntWH('--raw-board');
addExtraSpace([zoom.boardSize], true);
for (const svg of qsa('svg:not(.icon)')) {
  svg.setAttribute('width', zoom.boardSize[0]);
  svg.setAttribute('height', zoom.boardSize[1]);
}

// Set initial view
addExtraSpace([geom.initialViewCenter]);
