'use strict';

const bd = {
  firstTurn: 'human',
  nHumanPieces: 12,
  nHumanSpaces: 109,
  humanStart: 0,
  humanGoal: 107,
  humanDead: 108,
  // to be filled below
  humanEdges: [],
  humanJumps: [[4, 86], [20, 29]],
  // to be filled below
  humanChoices: {move: [], jump: []},
  trexStart: 11,
  nRaptorPieces: 4,
  nRaptorSpaces: 57,
  raptorStart: [47, 49, 52, 53],
  raptorEdges: [
    [0, 1], [0, 3],
    [1, 7],
    [3, 4],
    [4, 5],
    [5, 8], [5, 19], [5, 20], [5, 23],
    [7, 8], [7, 10],
    [8, 23],
    [10, 11], [10, 12],
    [11, 14], [11, 15],
    [12, 24], [12, 25],
    [14, 15], [14, 44],
    [15, 16],
    [16, 17], [16, 50],
    [17, 46], [17, 50], [17, 51],
    [19, 20], [19, 21], [19, 29],
    [20, 23],
    [21, 22],
    [22, 34],
    [23, 24],
    [24, 25],
    [25, 27], [25, 44],
    [27, 33], [27, 43], [27, 44],
    [29, 30], [29, 31],
    [30, 35],
    [31, 33],
    [33, 39], [33, 43],
    [34, 35],
    [35, 36],
    [36, 37],
    [37, 38], [37, 39],
    [38, 39], [38, 41],
    [41, 42], [41, 48],
    [42, 54],
    [43, 44], [43, 45], [43, 47], [43, 48],
    [44, 45],
    [45, 46], [45, 47],
    [46, 47], [46, 51], [46, 52],
    [47, 48], [47, 49], [47, 52],
    [48, 49],
    [49, 52], [49, 53], [49, 54],
    [50, 51],
    [51, 52],
    [52, 53],
    [53, 54],
  ],
  raptorEntrances: [
    [3, 2], [8, 6], [12, 9], [14, 13],
    [22, 18], [37, 28], [39, 32], [48, 40],
  ],
  // to be filled below
  raptorChoices: {move: [], enter: []},
  humanSpacesInRaptorSpace: [
    [],                   //  0
    [80, 81],
    [4],
    [],
    [1, 2, 3],
    [5, 6, 7, 8],         //  5
    [86],
    [82, 83, 84, 85],
    [],
    [93],
    [87, 88, 89],         // 10
    [90, 91, 92],
    [],
    [106],
    [94, 95],
    [96, 97, 98],         // 15
    [99, 100, 101],
    [],
    [14],
    [9, 13],
    [10, 11, 12],         // 20
    [],
    [],
    [62, 63, 64],
    [65, 66, 67],
    [68, 69],             // 25
    [24],
    [23, 25],
    [20],
    [15, 16],
    [],                   // 30
    [17, 18],
    [29],
    [19, 21, 22, 45],
    [],
    [39, 40, 41, 42],     // 35
    [43, 44],
    [],
    [49, 50, 51],
    [46, 47, 48],
    [61],                 // 40
    [52, 53],
    [54, 55, 56],
    [26, 27, 28, 30],
    [70, 71, 72],
    [73, 74],             // 45
    [75, 76, 77],
    [],
    [31, 32, 33, 34],
    [35, 36],
    [102, 103, 104],      // 50
    [105, 78, 79],
    [37, 38],
    [59, 60],
    [57, 58],
    [107],                // 55
    [0],
  ],
  bldgHumanSpaces: [
    4, 86, 93, 106, 14, 20, 29, 61, 24, 107, 0,
  ],
};

const humanPaths = [
  [0, 1, 2, 3, 4],
  [1, 5, 6, 7, 8, 4],
  [5, 9, 10, 11, 12, 24],
  [9, 13, 14, 15, 16, 17, 18, 19, 20],
  [19, 21, 22, 23, 24],
  [23, 25, 26, 27, 28, 29],
  [27, 30, 31, 32, 33, 61],
  [33, 34, 35, 36, 37, 38, 107],
  [14, 39, 40, 41, 42, 43, 44, 20],
  [19, 45, 46, 47, 48, 49, 29],
  [49, 50, 51, 52, 53, 54, 55, 61],
  [55, 56, 57, 58, 59, 60, 107],
  [7, 62, 63, 64, 65, 66, 67, 24],
  [66, 68, 69, 70, 71, 72],
  [26, 72, 73, 74, 75, 76, 77, 78, 79, 107],
  [25, 71],
  [4, 80, 81, 82, 83, 84, 85, 86, 64],
  [85, 87, 88, 89, 90, 91, 92, 93, 70],
  [92, 94, 95, 96, 97, 98, 99, 100, 106, 76],
  [100, 101, 102, 103, 104, 105, 78],
];
for (const path of humanPaths) {
  for (let i = 1; i < path.length; i++) {
    bd.humanEdges.push([path[i - 1], path[i]]);
  }
}

bd.bldgRaptorSpaces = bd.bldgHumanSpaces.map(
  hSpace => bd.humanSpacesInRaptorSpace.findIndex(
    hSpacesIn => hSpacesIn.includes(hSpace)
  )
);

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

const dice = {
  human: {
    movement: ['Jump', 2, 3, 3, 4, 4],
    continue: [0, 0, 0, 1, 1, 1],
  },
  raptor: {
    movement: ['Enter', 1, 1, 1, 1, 2],
    continue: [0, 0, 0, 1, 1, 1],
  },
  trex: {
    movement: [0, 0, 0, 1, 1, 1],
  },
};

// Detect if script is running in simulation mode
//   (i.e., in node rather than in a broswer)
// If so, assign settings needed for simulation
//   to the global object
if (typeof global !== typeof void 0) {
  Object.assign(global, {bd, dice});
}
