#!/usr/local/bin/node

'use strict';

const [hAI, rAI, nSims] = process.argv.slice(2);

require('../game/utility.js');
require('../game/board-logic.js');
require('../game/dice.js');
require('../game/ai.js');

// Works differently in node and therefore cannot
//   be reused from prngs.js
const seedrandom = require(
  '../../node_modules/seedrandom'
);
const prng = {
  dice: {
    human: seedrandom(null),
    raptor: seedrandom(null),
    trex: seedrandom(null),
  },
  ai: seedrandom(null),
};

const gs = {
  humans: new Array(humanCount),
  raptors: new Array(raptorCount),
  trex: null,
  turn: null,
  rollN: null,
  rollGo: null,
};

const sim = {
  initialize() {
    gs.humans.fill(humanStart);
    gs.raptors = raptorStartSpaces.slice(0);
    gs.trex = trexStart;
    gs.turn = firstTurnPlayer;
  },
  roll(player) {
    const [d, r] = [dice[player], prng.dice[player]];
    gs.rollN = rollDie(d.movement, r);
    if (player !== 'trex') {
      gs.rollGo = rollDie(d.continue, r);
    }
  },
  moveHuman(plan) {
    if (! plan.length) return;
    gs.humans[plan[0]] = plan[1].pop();
  },
  moveTrex() {
    gs.trex--;
    if (! gs.trex) {
      for (let h = 0; h < humanCount; h++) {
        if (gs.humans[h] === humanStart) {
          gs.humans[h] = humanDead;
        }
      }
    }
  },
  moveRaptor(plan) {
    if (! plan.length) return;
    sim.checkRaptorEat(plan[1]);
    gs.raptors[plan[0]] = plan[1].pop();
  },
  checkRaptorEat(rSpaces) {
    const hSpacesEaten = rSpaces.map(
      x => humanSpacesInRaptorSpace[x]
    ).flat();
    for (let h = 0; h < humanCount; h++) {
      if (hSpacesEaten.includes(gs.humans[h])) {
        gs.humans[h] = humanDead;
      }
    }
  },
  playTurn() {
    sim.roll(gs.turn);
    if (gs.turn === 'trex') {
      if (gs.rollN) sim.moveTrex();
      gs.turn = 'raptor';
      return;
    }
    const plan = ai.control[gs.turn](gs, prng.ai);
    if (gs.turn === 'human') {
      sim.moveHuman(plan);
      if (! gs.rollGo) {
        sim.checkRaptorEat(gs.raptors);
        if (gs.humans.some(x => x === humanStart)) {
          gs.turn = 'trex';
        } else {
          gs.turn = 'raptor';
        }
      }
      return;
    }
    if (gs.turn === 'raptor') {
      sim.moveRaptor(plan);
      if (gs.rollGo) {
        if (gs.humans.some(x => x === humanStart)) {
          gs.turn = 'trex';
        }
      } else {
        gs.turn = 'human';
      }
      return;
    }
  },
  gameOver() {
    return gs.humans.every(
      x => x === humanGoal || x === humanDead
    );
  },
  nSaved() {
    return gs.humans.filter(
      x => x === humanGoal
    ).length;
  },
};

ai.control.human = ai.decision.human[hAI];
ai.control.raptor = ai.decision.raptor[rAI];

const results = new Array(nSims);
for (let i = 0; i < nSims; i++) {
  sim.initialize();
  while (! sim.gameOver()) sim.playTurn();
  results[i] = sim.nSaved();
}

console.log(`Human: ${hAI}   Raptor: ${rAI}`);

const nSavedFreq = new Array(humanCount + 1).fill(0);
for (const result of results) nSavedFreq[result]++;
const freqOutputHead = nSavedFreq.map((e, i) => {
  const digits = Math.ceil(Math.log10(e + 1));
  return i.toString().padStart(Math.max(2, digits));
});
const freqOutputBody = nSavedFreq.map(
  x => x.toString().padStart(2)
);
console.log(freqOutputHead.join(' '));
console.log(freqOutputBody.join(' '));

const nSavedSum = results.reduce((a, e) => a + e);
const nSavedSumSq = results.reduce(
  (a, e) => a + e ** 2, 0
);
const nSavedMean = nSavedSum / nSims;
const nSavedSD = Math.sqrt((
  nSavedSumSq / nSims - nSavedMean ** 2
) * nSims / (nSims - 1)) || 0;
const nSavedCI = [-1, 1].map(
  x => nSavedMean + 
      x * 1.96 * nSavedSD / Math.sqrt(nSims)
);
const statsPrecision = 2;
const nSavedCIString = nSavedCI.map(
  x => x.toFixed(statsPrecision)
).join(', ');
console.log(
  `Mean: ${nSavedMean.toFixed(statsPrecision)} `,
  ` SD: ${nSavedSD.toFixed(statsPrecision)} `,
  ` 95% CI: (${nSavedCIString})`
);
