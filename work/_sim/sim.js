#!/usr/local/bin/node

'use strict';

const [hAI, rAI, nSims] = process.argv.slice(2);

require('../game/utility.js');
require('../game/logic.js');
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
  humans: new Array(bd.nHumanPieces),
  raptors: new Array(bd.nRaptorPieces),
  trex: null,
  turn: null,
  rollN: null,
  rollGo: null,
};

const sim = {
  initialize() {
    gs.humans.fill(bd.humanStart);
    gs.raptors = [...bd.raptorStart];
    gs.trex = bd.trexStart;
    gs.turn = bd.firstTurn;
  },
  roll(species) {
    const d = dice[species];
    const r = prng.dice[species];
    gs.rollN = rollDie(d.movement, r);
    if (species !== 'trex') {
      gs.rollGo = rollDie(d.continue, r);
    }
  },
  moveHuman(plan) {
    if (! plan.length) return;
    gs.humans[plan[0]] = plan[1].pop();
  },
  moveTrex() {
    gs.trex--;
    if (gs.trex) return;
    for (let h = 0; h < bd.nHumanPieces; h++) {
      if (gs.humans[h] === bd.humanStart) {
        gs.humans[h] = bd.humanDead;
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
      x => bd.humanSpacesInRaptorSpace[x]
    ).flat();
    for (let h = 0; h < bd.nHumanPieces; h++) {
      if (hSpacesEaten.includes(gs.humans[h])) {
        gs.humans[h] = bd.humanDead;
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
        gs.turn = gs.humans.includes(bd.humanStart) ?
            'trex' : 'raptor';
      }
    } else {
      sim.moveRaptor(plan);
      gs.turn = ! gs.rollGo ? 'human' :
          gs.humans.includes(bd.humanStart) ? 'trex' :
              'raptor';
    }
  },
  gameOver() {
    return gs.humans.every(
      x => x === bd.humanGoal || x === bd.humanDead
    );
  },
  nSaved() {
    return gs.humans.filter(
      x => x === bd.humanGoal
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

const nSavedFreq =
    new Array(bd.nHumanPieces + 1).fill(0);
for (const result of results) nSavedFreq[result]++;
const freqOutputHead = nSavedFreq.map((e, i) => {
  const digits = Math.ceil(Math.log10(e + 1));
  return i.toString().padStart(Math.max(2, digits));
});
const freqOutputBody =
    nSavedFreq.map(x => x.toString().padStart(2));
console.log(freqOutputHead.join(' '));
console.log(freqOutputBody.join(' '));

const nSavedSum = results.reduce((a, e) => a + e);
const nSavedSumSq =
    results.reduce((a, e) => a + e ** 2, 0);
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
