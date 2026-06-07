import {qs, qjs} from './utility.js';

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
  trexPiece: qs('.trex-piece'),
};
