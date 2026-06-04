import {qs} from './utility.js';

export const dom = {
  gameplay: qs('#gameplay'),
  sectionStart: qs('#start'),
  board: qs('#board'),
  raptorSpaceGroup: qs('#board g'),
  raptorSpace: [],
  humanSpace: [],
  humanEdge: {},
  trexSpace: [],
  humanPiece: [],
  raptorPiece: [],
  trexPiece: qs('.trex-piece'),
};
