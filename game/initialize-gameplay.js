import {
  arrayMinus, cssInt, cssIntWH,
} from './utility.js';
import {debug} from './debug.js';
import {bd} from './logic.js';
import {pieces} from './pieces.js';
import {gs, zd, pl} from './game-objects.js';
import {gp} from './functions-gameplay.js';
import {autoSave} from './auto-save.js';
import {edit} from './edit-mode.js';
import {
  clickHumanSpace, clickRaptorSpace, clickBuilding,
} from './click-board.js';
import {
  clickHumanPiece, clickRaptorPiece,
} from './click-pieces.js';

// Initialize objects
gp.initializeObjects();
gp.setSaveFunction(() => {autoSave.update();});
autoSave.clear();
edit.clear();

// Extra space at edges of board
function addExtraSpace(arr, full = false) {
  const xs = ['left', 'top', 'right', 'bottom']
    .map(x => cssInt(`--extra-space-${x}`));
  for (let i = 0; i < arr.length; i++) {
    arr[i][0] += xs[0] + (full ? xs[2] : 0);
    arr[i][1] += xs[1] + (full ? xs[3] : 0);
  }
}

// Raptor space geometry
const rPoints = [
  [ 324,   72],   //   0
  [ 475,   72],
  [1025,   72],
  [1635,   72],
  [2048,   72],
  [2605,   72],   //   5
  [2928,   72],
  [3575,   72],
  [3852,   72],
  [ 324,  406],
  [ 710,  406],   //  10
  [ 710,  276],
  [ 710,  628],
  [ 878,  628],
  [1162,  628],
  [1162,  276],   //  15
  [1010,  276],
  [ 324,  710],
  [ 684, 1116],
  [ 504, 1188],
  [1015, 1010],   //  20
  [1185,  882],
  [1215,  730],
  [1795,  360],
  [1392,  276],
  [1392,  628],   //  25
  [1795,  628],
  [1795,  276],
  [1625,  276],
  [1962,  429],
  [1962,  764],   //  30
  [2235,  764],
  [2448,  764],
  [2448,  429],
  [2384,  429],
  [2162,  429],   //  35
  [1880,  764],
  [2590,  282],
  [2696,  764],
  [2738,  764],
  [2835,  764],   //  40
  [3158,  764],
  [3158,  678],
  [3158,  302],
  [2992,  302],
  [2992,  598],   //  45
  [2778,  598],
  [2696,  598],
  [3416,  302],
  [3424,  534],
  [3332,  678],   //  50
  [ 845, 1892],
  [ 894, 1892],
  [1252, 1892],
  [1252, 1442],
  [1092, 1442],   //  55
  [ 980, 1442],
  [ 980, 1595],
  [ 845, 1595],
  [ 845, 1805],
  [1162,  345],   //  60
  [ 504, 1487],
  [ 504, 1862],
  [1434, 1226],               // available
  [1327, 1154],
  [1603,  947],   //  65
  [1642,  947],
  [1852, 1016],
  [2036,  947],               // available
  [2200,  972],
  [1542,  628],   //  70
  [2304, 1086],
  [1489, 1226],
  [1838, 1226],
  [2036, 1226],
  [1327, 1226],   //  75
  [2190, 1310],
  [1475, 1525],
  [1675, 1525],
  [1810, 1525],
  [1810, 1600],   //  80
  [1810, 1852],
  [1810, 2011],
  [1682, 2011],
  [1475, 2011],
  [1475, 1892],   //  85
  [1475, 1640],
  [2050, 1525],
  [2198, 1525],
  [2461, 1525],
  [2536, 1525],   //  90
  [2536, 1860],
  [2462, 1860],
  [2148, 1860],
  [2050, 1860],
  [ 504, 2160],   //  95
  [ 800, 2160],
  [1300, 2160],
  [1735, 2160],
  [1980, 2160],
  [2436, 2160],   // 100
  [2720, 2160],
  [3355, 2160],
  [3672, 2160],
  [1980, 2078],
  [2775, 1620],   // 105
  [3075, 1620],
  [3150, 1620],
  [3150, 1775],
  [3150, 1972],
  [2775, 1972],   // 110
  [2775, 1910],
  [2615, 1390],
  [2600, 1288],
  [2536, 1184],
  [2912, 1085],   // 115
  [3008, 1100],
  [3025, 1228],
  [3262, 1330],
  [3315, 1702],
  [3260, 1044],   // 120
  [3158,  396],
  [2972, 1422],
  [3852,  720],
  [3654,  720],
  [3492,  720],   // 125
  [3492, 1128],
  [3492, 1300],
  [3492, 1522],
  [3672, 1702],
  [2036, 1154],   // 130
  [1392,  345],
  [4032,  720],
  [4032, 1522],
  [1252, 1550],
  [ 144, 1044],   // 135
  [3672, 1522],
  [ 324, 1044],
  [ 684, 1044],
  [ 684, 1188],
  [1760,  947],   // 140
  [1555,  983],
  [ 144, 1188],
  [2050, 1600],
  [1944, 1085],
  [1534, 1525],   // 145
];
addExtraSpace(rPoints);
const rSpacePoints = [
  [0, 1, 11, 10, 9],                        //  0
  [1, 2, 16, 11],
  [11, 10, 12, 13, 14, 60, 15, 16],
  [9, 17, 12, 10],
  [137, 138, 13, 12, 17],
  [138, 18, 20, 21, 22, 14, 13],            //  5
  [24, 131, 25, 70, 26, 23, 27, 28],
  [2, 3, 28, 24, 131, 60, 15, 16],
  [14, 60, 131, 25, 22],
  [29, 30, 31, 32, 33, 34, 35],
  [3, 4, 35, 29, 23, 27, 28],               // 10
  [4, 5, 37, 34, 35],
  [26, 23, 29, 30, 36],
  [38, 39, 40, 41, 42, 121, 43, 44, 45, 46, 47],
  [32, 38, 47, 46, 37, 34, 33],
  [5, 6, 44, 45, 46, 37],                   // 15
  [6, 7, 48, 121, 43, 44],
  [48, 49, 50, 42, 121],
  [51, 52, 53, 134, 54, 55, 56, 57, 58, 59],
  [18, 139, 56, 55, 75, 64, 20],
  [20, 21, 141, 64],                        // 20
  [56, 57, 58, 61, 19, 139],
  [61, 62, 59, 58],
  [65, 66, 70, 25, 22, 21, 141],
  [66, 140, 67, 36, 26, 70],
  [67, 144, 69, 31, 30, 36],                // 25
  [
    75, 64, 141, 65, 66, 140, 67,
    144, 130, 74, 73, 72,
  ],
  [69, 71, 76, 74, 130, 144],
  [77, 145, 78, 79, 80, 81, 82, 83, 84, 85, 86],
  [54, 55, 75, 72, 145, 77, 86, 134],
  [53, 134, 86, 85],                        // 30
  [72, 73, 78, 145],
  [87, 88, 89, 90, 91, 92, 93, 94, 143],
  [78, 79, 80, 143, 87, 88, 76, 74, 73],
  [95, 96, 52, 51, 59, 62],
  [96, 97, 84, 85, 53, 52],                 // 35
  [97, 98, 83, 84],
  [98, 99, 104, 81, 82, 83],
  [99, 100, 92, 93, 104],
  [104, 93, 94, 143, 80, 81],
  [105, 106, 107, 108, 109, 110, 111],      // 40
  [100, 101, 110, 111, 91, 92],
  [101, 102, 109, 110],
  [89, 112, 113, 114, 71, 76, 88],
  [114, 39, 38, 32, 31, 69, 71],
  [113, 114, 39, 40, 115],                  // 45
  [40, 115, 116, 120, 50, 42, 41],
  [112, 113, 115, 116, 117, 122],
  [89, 90, 91, 111, 105, 106, 122, 112],
  [106, 107, 108, 119, 118, 117, 122],
  [7, 8, 123, 124, 49, 48],                 // 50
  [124, 125, 126, 120, 50, 49],
  [116, 117, 118, 127, 126, 120],
  [118, 119, 129, 136, 128, 127],
  [129, 103, 102, 109, 108, 119],
  [123, 124, 125, 126, 127, 128, 136, 133, 132], // 55
  [135, 137, 138, 18, 139, 142],
];
const rSpaceCoords = rSpacePoints.map(
  x => x.map(point => rPoints[point])
);
function midpoint(a) {
  return (Math.min(...a) + Math.max(...a)) / 2;
}
pl.raptor = rSpaceCoords.map(a => [
  midpoint(a.map(co => co[0])),
  midpoint(a.map(co => co[1])),
]);
const rAdjustments = [
  [12, [0, -72] ],
  [13, [0, 144] ],
  [18, [0, 36] ],
  [26, [0, 36] ],
  [29, [36, 0] ],
  [36, [36, 0] ],
  [37, [36, 108] ],
  [39, [-36, 0] ],
  [47, [36, 36] ],
  [48, [-36, -72] ],
  [49, [0, -72] ],
  [51, [-72, 72] ],
  [52, [0, -36] ],
  [53, [-72, 0] ],
];
for (const [space, offset] of rAdjustments) {
  pl.raptor[space][0] += offset[0];
  pl.raptor[space][1] += offset[1];
}

// Make raptor spaces
const svgR = $('#raptor-map').svg().svg('get');
for (const [i, a] of rSpaceCoords.entries()) {
  const idString = `raptor-space-${i}`;
  svgR.polygon(a, {id: idString});
  $(`#${idString}`).addClass('raptor-space')
    .click({space: i}, clickRaptorSpace);
}
if (debug.boardLabels.raptorPoint) {
  const $div = $('#raptor-point-labels');
  $div.css({display: 'block'});
  const svg = $div.svg().svg('get');
  for (const [i, c] of rPoints.entries()) {
    svg.text(...c, `${i}`);
  }
}
if (debug.boardLabels.raptorSpace) {
  const $div = $('#raptor-space-labels');
  $div.css({display: 'block'});
  const svg = $div.svg().svg('get');
  for (const [i, c] of pl.raptor.entries()) {
    svg.text(...c, `${i}`);
  }
}

// Building backgrounds
const bldgBg = [
  0, 4, 7, 3, // upper row
  1, 6, 5, 2, // lower row
  9, 10, 8,   // center, end, start
];
const bgInfo = [
  ['block-gy.png',  [ 96,  72]],
  ['block-yw.png',  [ 96,  72]],
  ['block-dk.png',  [ 96,  72]],
  ['brick.png',     [ 48,  48]],
  ['wood-s-yw.png', [480, 120]],
  ['wood-s-gy.png', [480, 120]],
  ['wood-l-rd.png', [480, 144]],
  ['wood-l-bn.png', [480, 144]],
  ['vertical.png',  [  6,   1]],
  ['concrete.png',  [500, 250]],
  ['asphalt.png',   [250, 180]],
];
const svgB = $('#buildings-map').svg().svg('get');
for (const [i, [src, dim]] of bgInfo.entries()) {
  const pattern = svgB.pattern(
    svgB.defs(), `bldg-bg-${i}`, 0, 0, dim[0], dim[1],
    {patternUnits: 'userSpaceOnUse'}
  );
  svgB.image(
    pattern, null, null, dim[0], dim[1],
    `img/bldg/${src}`
  );
}

// Make buildings
const bhs = bd.bldgHumanSpaces;
for (const [bldg, hSpace] of bhs.entries()) {
  const rSpace = bd.bldgRaptorSpaces[bldg];
  const coords = rSpaceCoords[rSpace];
  const idString = `human-space-${hSpace}`;
  // First make polygon with background only
  svgB.polygon(coords, {
    fill: `url(#bldg-bg-${bldgBg[bldg]})`,
  });
  // Then make clickable polygon on top
  svgB.polygon(coords, {
    id: idString, fill: '#0000',
  });
  $(`#${idString}`).click(
    {hSpace: hSpace, rSpace: rSpace}, clickBuilding
  ).addClass('human-space building');
  pl.human[hSpace] = [...pl.raptor[rSpace]];
}

// Human space geometry
const hSpaces = [
  [ 536, 1116],   //   0
  [ 624,  904],
  [ 565,  782],
  [ 710,  703],
  [ 935,  438],
  [ 796,  969],   //   5
  [ 995,  892],
  [1108,  738],
  [ 955,  728],
  [ 990, 1112],
  [1158,  995],   //  10
  [1277, 1061],
  [1409, 1010],
  [ 968, 1295],
  [1100, 1668],
  [1270, 1372],   //  15
  [1415, 1340],
  [1595, 1386],
  [1708, 1308],
  [1815, 1418],
  [1645, 1718],   //  20
  [1920, 1310],
  [2075, 1330],
  [2150, 1190],
  [1603, 1190],
  [2192, 1068],   //  25
  [2352, 1178],
  [2360, 1328],
  [2375, 1458],
  [2300, 1710],
  [2510, 1348],   //  30
  [2616, 1490],
  [2678, 1625],
  [2800, 1515],
  [2935, 1518],
  [3134, 1524],   //  35
  [3175, 1364],
  [3210, 1215],
  [3360, 1205],
  [ 933, 2008],
  [1065, 2068],   //  40
  [1225, 2015],
  [1370, 1980],
  [1484, 2096],
  [1648, 2096],
  [1952, 1455],   //  45
  [1902, 1682],
  [1902, 1835],
  [1975, 1958],
  [2168, 1950],
  [2230, 2078],   //  50
  [2362, 2030],
  [2552, 2078],
  [2658, 1982],
  [2818, 2072],
  [2960, 2095],   //  55
  [3108, 2082],
  [3300, 1975],
  [3365, 1810],
  [3400, 1608],
  [3348, 1428],   //  60
  [2892, 1785],
  [1285,  815],
  [1420,  830],
  [1472,  710],
  [1642,  740],   //  65
  [1780,  762],
  [1745,  878],
  [2008,  862],
  [2148,  828],
  [2308,  850],   //  70
  [2368,  980],
  [2482, 1062],
  [2652, 1082],
  [2770,  945],
  [2978,  948],   //  75
  [3128,  920],
  [3246,  793],
  [3386,  832],
  [3362,  995],
  [ 798,  155],   //  80
  [ 930,  160],
  [1128,  172],
  [1270,  230],
  [1408,  162],
  [1545,  168],   //  85
  [1532,  455],
  [1730,  172],
  [1870,  245],
  [2030,  315],
  [2180,  172],   //  90
  [2338,  212],
  [2340,  360],
  [2278,  588],
  [2522,  418],
  [2645,  508],   //  95
  [2880,  465],
  [2775,  328],
  [2835,  165],
  [3038,  158],
  [3168,  230],   // 100
  [3380,  155],
  [3594,  254],
  [3515,  435],
  [3654,  590],
  [3434,  653],   // 105
  [3015,  640],
  [3948, 1210],
  [3924, 1859],
];
addExtraSpace(hSpaces);
const humanSpaceSize = cssInt('--human-space-size');

// Make human spaces
for (const [i, [x, y]] of hSpaces.entries()) {
  const l = x - humanSpaceSize / 2;
  const t = y - humanSpaceSize / 2;
  const isBldg = bd.bldgHumanSpaces.includes(i);
  const suffix = isBldg ? '-under' : '';
  const $div = $('<div></div>');
  $div.attr('id', `human-space-${i}${suffix}`)
    .css({top: `${t}px`, left: `${l}px`})
    .addClass('human-space')
    .click({space: i}, clickHumanSpace);
  if (isBldg) $div.addClass('under-building');
  if (i === bd.humanDead) $div.addClass('dead');
  $div.appendTo('#gameplay-container');
  if (!isBldg) pl.human[i] = [x, y];
}

// Make human edges
const svgE = $('#human-edges').svg().svg('get');
for (const edge of bd.humanEdges) {
  const s0 = Math.min(...edge);
  const s1 = Math.max(...edge);
  const idString = `human-edge-${s0}_${s1}`;
  svgE.line(
    ...hSpaces[edge[0]], ...hSpaces[edge[1]],
    {id: idString, class: 'human-edge'}
  );
}
if (debug.boardLabels.humanSpace)  {
  const $div = $('#human-space-labels');
  $div.css({display: 'block'});
  const svg = $div.svg().svg('get');
  for (const [i, coords] of hSpaces.entries()) {
    svg.text(...coords, `${i}`);
  }
}

// T-rex space geometry
const tSpaces = [
  [ 213, 1116],   //  0
  [ 213, 1263],
  [ 213, 1347],
  [ 213, 1431],
  [ 213, 1515],
  [ 213, 1599],   //  5
  [ 213, 1683],
  [ 213, 1767],
  [ 213, 1851],
  [ 213, 1935],
  [ 213, 2019],   // 10
  [ 213, 2103],
];
addExtraSpace(tSpaces);
const trexSpaceSize = cssInt('--trex-space-size');

// Make T-rex spaces
for (const [i, [x, y]] of tSpaces.entries()) {
  const l = x - trexSpaceSize / 2;
  const t = y - trexSpaceSize / 2;
  const suffix = i ? '' : '-under';
  const $div = $('<div></div>');
  $div.attr('id', `trex-space-${i}${suffix}`)
    .css({top: `${t}px`, left: `${l}px`})
    .addClass('trex-space');
  if (i) {
    pl.trex[i] = [x + trexSpaceSize / 2, y];
  } else {
    $div.addClass('under-building');
    const rSpace = bd.bldgRaptorSpaces[
      bd.bldgHumanSpaces.indexOf(bd.humanStart)
    ];
    // Below is ok here since values represent
    // piece location centers that will only
    // be adjusted to top-left corners later
    pl.trex[i] = [...pl.raptor[rSpace]];
  }
  $div.appendTo('#gameplay-container');
}

// Make T-rex edges
const svgT = $('#trex-edges').svg().svg('get');
for (let i = 0; i < bd.trexStart; i++) {
  svgT.line(
    ...tSpaces[i], ...tSpaces[i + 1],
    {class: 'trex-edge'}
  );
}

// Entrance marker geometry
const eMarkers = [
  [ 710,  517],
  [1392,  486],
  [1962,  580],
  [2696,  675],
  [ 845, 1700],
  [1789, 1990],
  [2050, 1730],
  [2775, 1765],
];
addExtraSpace(eMarkers);
const eRadiusOuter = 80;
const eRadiusInner = 40;
const eRays = 12;
const eShape = [];
function circleCoords(angle, r) {
  return [r * Math.cos(angle), r * Math.sin(angle)];
}
for (let i = 0; i < eRays; i++) {
  const period = 2 * Math.PI / eRays;
  eShape.push(
    circleCoords(i * period, eRadiusInner),
    circleCoords((i + 0.5) * period, eRadiusOuter)
  );
}

// Make entrance markers
for (const [x, y] of eMarkers) {
  svgR.polygon(
    eShape.map(s => [s[0] + x, s[1] + y]),
    {class: 'raptor-entrance'}
  );
}

// Jump marker geometry
const jMarkers = [
  [[1108,  592], [1446,  592]],
  [[1756, 1561], [2104, 1561]],
];
for (let i = 0; i < jMarkers.length; i++) {
  addExtraSpace(jMarkers[i]);
}
const jumpMarkerSize = cssIntWH('--jump-land');

// Make jump markers
for (const [j, l] of jMarkers) {
  const jOffset = jumpMarkerSize.map(t => t / 2);
  const [jl, jt] = arrayMinus(j, jOffset);
  const [ll, lt] = arrayMinus(l, jOffset);
  $('<div></div>').html('Jump')
    .css({top: `${jt}px`, left: `${jl}px`})
    .addClass('jump-land-marker')
    .appendTo('#gameplay-container');
  $('<div></div>').html('Land')
    .css({top: `${lt}px`, left: `${ll}px`})
    .addClass('jump-land-marker')
    .appendTo('#gameplay-container');
}

// Helicopter geometry
const heloCorners = [[3607,  920], [3607, 1229]];
addExtraSpace(heloCorners);

// Make helicopters
for (const [l, t] of heloCorners) {
  $('<img>').attr('src', 'img/helo/helo.png')
    .css({top: `${t}px`, left: `${l}px`})
    .addClass('helo').appendTo('#gameplay-container');
}

// Zoom and view geometry
zd.initialViewCenter = [414, 1116];
addExtraSpace([zd.initialViewCenter]);
zd.boardSize = cssIntWH('--raw-board');
addExtraSpace([zd.boardSize], true);
gp.initializeView(false);

// Additional piece layout adjustments
for (const species of Object.keys(pl)) {
  const pieceSize = cssIntWH(`--${species}-piece`);
  const offset = pieceSize.map(x => x / 2);
  if (species === 'trex') offset[0] = 0;
  pl[species] = pl[species].map(
    coords => arrayMinus(coords, offset)
  );
  pl[species].ps = [...pieceSize];
}
pl.trex[0][0] -= pl.trex.ps[0] / 2;
pl.human.margin = cssInt('--board-border-width');

// For reasons that I fail to understand,
// the presence of the full-board SVGs causes
// the document height (but not width!) to be
// inflated by a small amount (specifically 7px)
//
// This issue can be fixed by simply chopping off
// this amount from the bottom edge of each SVG,
// which is fine as long as the amount chopped off
// does not clip any of the actual SVG elements
//
const svgBottomChop = 7;
$('svg:not(.icon)').attr({
  width: zd.boardSize[0],
  height: zd.boardSize[1] - svgBottomChop,
});

// Make human pieces
for (const [p, s] of gs.humans.entries()) {
  const [l, t] = pl.human[s];
  const idString = `human-piece-${p}`;
  $('<div></div>').attr('id', idString)
    .click({piece: p}, clickHumanPiece)
    .css({top: `${t}px`, left: `${l}px`})
    .addClass('human-piece')
    .appendTo('#gameplay-container');
  $('<div></div>')
    .addClass('human-component dead-marker')
    .appendTo(`#${idString}`);
}
gp.adjustHumanPositions();

// Make T-rex piece
{
  const [l, t] = pl.trex[gs.trex];
  $('<div></div>').attr('id', 'trex-piece')
    .css({top: `${t}px`, left: `${l}px`})
    .addClass('trex-piece')
    .appendTo('#gameplay-container');
}

// Make raptor pieces
for (const [p, s] of gs.raptors.entries()) {
  const [l, t] = pl.raptor[s];
  $('<div></div>').attr('id', `raptor-piece-${p}`)
    .click({piece: p}, clickRaptorPiece)
    .css({top: `${t}px`, left: `${l}px`})
    .addClass('raptor-piece')
    .appendTo('#gameplay-container');
}
if (debug.raptorPlacement.on) {
  $('.raptor-piece').remove();
  for (const [s, [l, t]] of pl.raptor.entries()) {
    $('<div></div>').attr('id', `raptor-piece-${s}`)
      .css({top: `${t}px`, left: `${l}px`})
      .addClass('raptor-piece')
      .appendTo('#gameplay-container');
  }
}

// Add all piece images
pieces.shuffleFeatures();
pieces.addImgs();
