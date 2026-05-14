import {bd} from './board-topology.js';

bd.humanEdges = [];
for (const path of bd.humanPaths) {
  for (let i = 1; i < path.length; i++) {
    bd.humanEdges.push([path[i - 1], path[i]]);
  }
}

bd.bldgRaptorSpaces = bd.bldgHumanSpaces.map(
  hSpace => bd.humanSpacesInRaptorSpace.findIndex(
    hSpacesIn => hSpacesIn.includes(hSpace)
  )
);

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
