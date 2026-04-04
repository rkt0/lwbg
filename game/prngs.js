'use strict';

// Initialize PRNGs
// Set seeds to null for nondeterministic results
const prng = {
  pieces: new Math.seedrandom(null),
  dice: {
    human: new Math.seedrandom(null),
    raptor: new Math.seedrandom(null),
    trex: new Math.seedrandom(null),
  },
  music: new Math.seedrandom(null),
  sfx: new Math.seedrandom(null),
  ai: new Math.seedrandom(null),
};
