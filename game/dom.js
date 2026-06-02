import {qs} from './utility.js';

export const dom = {
  sectionGameplay: qs('#gameplay'),
  // only needed in pregame
  sectionTitle: qs('#front'),
  sectionStart: qs('#start'),
  // ALMOST only needed in control
  sectionControl: qs('#control'),
  // only needed in functions-gameplay
  scrim: qs('.scrim'),
  // only needed in pregame
  startOptions: qs('#start .options'),
  // only needed in pregame
  startMessage: qs('#start .message'),
  // only needed in pregame
  startFork: qs('#start .fork'),
};
