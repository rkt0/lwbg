import {qjs, qd1} from './utility.js';

export const dom = {
  gameplay: qjs('gameplay'),
  start: qjs('start'),
  board: qjs('board'),
  raptorSpaceGroup: qjs('raptor-space-group'),
  raptorSpace: [],
  humanSpace: [],
  humanEdge: {},
  trexSpace: [],
  humanPiece: [],
  raptorPiece: [],
  trexPiece: qd1('trex-piece'),
  gameOver: qjs('game-over'),
};
