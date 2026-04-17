import {
  deepCopy, isNull, sequence,
  arrayMinus, arraySum, arrayCumSum,
  rollDie,
} from './utility.js';
import {bd, dice} from './logic.js';



// Container object for ai-related calculations
export const ai = {};



// AI control settings
// These are set to either false (manual control)
//   or an AI level function as described later

ai.control = {human: null, raptor: null};



// Calculate all possible (partial) move plans,
//   i.e., arrays of space numbers
// Note that a full move plan will be an array
//   of a piece number followed by one of these
//   (partial) move plan arrays

ai.allPlans = {human: {}, raptor: {}};

// Calculate all move plans for jump/enter
ai.allPlans.human['Jump'] = [];
for (let s = 0; s < bd.nHumanSpaces; s++) {
  const aiChoices = [];
  for (const c of bd.humanChoices.jump[s]) {
    aiChoices.push([s, c]);
  }
  ai.allPlans.human['Jump'][s] = aiChoices;
}
ai.allPlans.raptor['Enter'] = [];
for (let s = 0; s < bd.nRaptorSpaces; s++) {
  const aiChoices = [];
  for (const c of bd.raptorChoices.enter[s]) {
    aiChoices.push([s, c]);
  }
  ai.allPlans.raptor['Enter'][s] = aiChoices;
}

// Placeholder move plans for die roll of 0,
//   which serves as the base case for
//   calculating move plans recursively
{
  const plans0 =
      n => new Array(n).fill().map((e, i) => [[i]]);
  ai.allPlans.human[0] = plans0(bd.nHumanSpaces);
  ai.allPlans.raptor[0] = plans0(bd.nRaptorSpaces);
}

// Largest possible die rolls
{
  const largestN = arr => Math.max(...arr.filter(
    e => ! isNaN(parseInt(e))
  ));
  ai.maxN = {
    human:  largestN(dice.human.movement),
    raptor: largestN(dice.raptor.movement),
  };
}

// Calculate all move plans for all numeric die rolls
for (let n = 1; n <= ai.maxN.human; n++) {
  ai.allPlans.human[n] = [];
  for (let s = 0; s < bd.nHumanSpaces; s++) {
    ai.allPlans.human[n][s] = [];
    if (s === bd.humanGoal) continue;
    for (const plan of ai.allPlans.human[n - 1][s]) {
      const end = plan[plan.length - 1];
      if (bd.bldgHumanSpaces.includes(end)) {
        if (n > 1) {
          ai.allPlans.human[n][s].push(plan);
          continue;
        }
      }
      for (const c of bd.humanChoices.move[end]) {
        if (c === bd.humanStart) continue;
        if (plan.includes(c)) continue;
        ai.allPlans.human[n][s].push([...plan, c]);
      }
    }
  }
}
for (let n = 1; n <= ai.maxN.raptor; n++) {
  ai.allPlans.raptor[n] = [];
  for (let s = 0; s < bd.nRaptorSpaces; s++) {
    ai.allPlans.raptor[n][s] = [];
    for (const plan of ai.allPlans.raptor[n - 1][s]) {
      const end = plan[plan.length - 1];
      for (const c of bd.raptorChoices.move[end]) {
        if (plan.includes(c)) continue;
        ai.allPlans.raptor[n][s].push([...plan, c]);
      }
    }
  }
}

// Get all legal move plans in given game state
ai.legalPlans = gameState => {
  const {humans, raptors} = gameState;
  const result = [];
  if (['Jump', 'Enter'].includes(gameState.rollN)) {
    result.push([]);
  }
  if (gameState.turn === 'human') {
    for (let h = 0; h < humans.length; h++) {
      const loc = humans[h];
      const plans = deepCopy(
        ai.allPlans.human[gameState.rollN][loc]
      );
      for (const plan of plans) {
        const end = plan[plan.length - 1];
        if (! bd.bldgHumanSpaces.includes(end)) {
          if (humans.includes(end)) continue;
        }
        result.push([h, plan]);
      }
    }
  }
  if (gameState.turn === 'raptor') {
    for (let r = 0; r < raptors.length; r++) {
      const loc = raptors[r];
      const plans = deepCopy(
        ai.allPlans.raptor[gameState.rollN][loc]
      );
      for (const plan of plans) {
        if (plan.slice(1).some(
          s => raptors.includes(s)
        )) continue;
        result.push([r, plan]);
      }
    }
  }
  return result;
};



// Various calculations that will be needed

// Calculate distance from goal for each human space
// This is actually redundant since we calculate
//   the distance between every pair of spaces below,
//   but we leave it here for convenience
{
  ai.humanGoalDistance =
      new Array(bd.nHumanSpaces).fill(null);
  ai.humanGoalDistance[bd.humanGoal] = 0;
  ai.humanGoalDistance[bd.humanDead] = Infinity;
  let d = 0;
  while(ai.humanGoalDistance.some(isNull)) {
    for (let s = 0; s < bd.nHumanSpaces; s++) {
      if (ai.humanGoalDistance[s] !== d) continue;
      for (const c of bd.humanChoices.move[s]) {
        if (
          isNull(ai.humanGoalDistance[c]) ||
          ai.humanGoalDistance[c] > d + 1
        ) {
          ai.humanGoalDistance[c] = d + 1;
        }
      }
    }
    d++;
  }
}

// Calculate distance between pairs of human spaces,
//   ignoring jumps
{
  ai.humanSpaceDistance = sequence(
    bd.nHumanSpaces
  ).map(
    x => sequence(bd.nHumanSpaces).map(y => null)
  );
  for (let i = 0; i < bd.nHumanSpaces; i++) {
    const dist = ai.humanSpaceDistance[i];
    if (i === bd.humanGoal || i === bd.humanDead) {
      dist.fill(Infinity);
    }
    dist[bd.humanStart] = Infinity;
    dist[bd.humanDead] = Infinity;
    dist[i] = 0;
    let d = 0;
    while (dist.some(isNull)) {
      for (let j = 0; j < bd.nHumanSpaces; j++) {
        if (j === bd.humanGoal) continue;
        if (dist[j] !== d) continue;
        for (const c of bd.humanChoices.move[j]) {
          if (isNull(dist[c]) || dist[c] > d + 1) {
            dist[c] = d + 1;
          }
        }
      }
      d++;
    }
  }
}

// Calculate distance between pairs of raptor spaces
// ai.raptorSpaceDistance.move counts distance via
//   ordinary moves, i.e., buildings are unreachable
// ai.raptorSpaceDistance.enter treats an enter move
//   as an ordinary move, i.e., buildings are
//   one move farther away than their entrances
// For all other destinations (second indices),
//   the two distances above coincide
{
  ai.raptorSpaceDistance = {};
  const oob = [];
  for (let s = 0; s < bd.nRaptorSpaces; s++) {
    if (! bd.raptorChoices.move[s].size) oob.push(s);
  }
  ai.raptorSpaceDistance.move = new Array(
    bd.nRaptorSpaces
  ).fill().map(
    x => new Array(bd.nRaptorSpaces).fill(null)
  );
  for (let i = 0; i < bd.nRaptorSpaces; i++) {
    const dist = ai.raptorSpaceDistance.move[i];
    if (oob.includes(i)) dist.fill(Infinity);
    const bldgs = bd.bldgRaptorSpaces;
    for (const j of bldgs) dist[j] = Infinity;
    dist[i] = 0;
    let d = 0;
    while (dist.some(isNull)) {
      for (let j = 0; j < bd.nRaptorSpaces; j++) {
        if (dist[j] !== d) continue;
        for (const c of bd.raptorChoices.move[j]) {
          if (isNull(dist[c]) || dist[c] > d + 1) {
            dist[c] = d + 1;
          }
        }
      }
      d++;
    }
  }
  ai.raptorSpaceDistance.enter =
      deepCopy(ai.raptorSpaceDistance.move);
  for (const entrance of bd.raptorEntrances) {
    for (let i = 0; i < bd.nRaptorSpaces; i++) {
      if (i === entrance[1]) continue;
      const dist = ai.raptorSpaceDistance.enter[i];
      dist[entrance[1]] = dist[entrance[0]] + 1;
    }
  }
  // Distances to/from out-of-bounds areas must be
  //   reset because deepCopy (based on JSON)
  //   does not handle Infinity properly
  for (const x of oob) {
    for (let i = 0; i < bd.nRaptorSpaces; i++) {
      ai.raptorSpaceDistance.enter[x][i] = Infinity;
      ai.raptorSpaceDistance.enter[i][x] = Infinity;
    }
    ai.raptorSpaceDistance.enter[x][x] = 0;
  }
}

// Find raptor space containing each human space
ai.raptorSpaceOfHumanSpace =
    new Array(bd.nHumanSpaces);
for (let i = 0; i < bd.nHumanSpaces; i++) {
  const s = bd.humanSpacesInRaptorSpace.findIndex(
    x => x.includes(i)
  );
  ai.raptorSpaceOfHumanSpace[i] = s < 0 ? null : s;
}

// Calculate matrices of distances from each raptor
//   to each human based on input location arrays
// Game state given as argument so that function
//   can be used for hypothetical future game state;
//   it needs to have .raptors and .humans properties
ai.raptorHumanDistance = gameState => {
  const {raptors, humans} = gameState;
  const raptorSpacesOfHumans = humans.map(
    x => ai.raptorSpaceOfHumanSpace[x]
  );
  const dAll = ai.raptorSpaceDistance;
  const dm = raptors.map(x => humans.map(y => null));
  const de = deepCopy(dm);
  for (let r = 0; r < raptors.length; r++) {
    const rLoc = raptors[r];
    for (let h = 0; h < humans.length; h++) {
      const hLoc = raptorSpacesOfHumans[h];
      if (hLoc === null) {
        dm[r][h] = Infinity;
        de[r][h] = Infinity;
        continue;
      }
      dm[r][h] = dAll.move[rLoc][hLoc];
      de[r][h] = dAll.enter[rLoc][hLoc];
    }
  }
  return {move: dm, enter: de};
};



// Probability-related calculations based on dice

ai.prob = {};

// Probabilities associated with single die rolls
ai.prob.dice = {human: {}, raptor: {}, trex: {}}
for (const species of ['human', 'raptor']) {
  const dieM = dice[species].movement;
  const dieC = dice[species].continue;
  ai.prob.dice[species].pmf = [];
  const dieProb = (die, testFn) =>
      die.filter(testFn).length / die.length;
  for (let i = 0; i <= ai.maxN[species]; i++) {
    ai.prob.dice[species].pmf[i] = dieProb(
      dieM, x => (parseInt(x) || 0) === i
    );
  }
  ai.prob.dice[species].je = dieProb(
    dieM, x => x === 'Jump' || x === 'Enter'
  );
  ai.prob.dice[species].go = dieProb(
    dieC, x => x === 1
  );
}
{
  const die = dice.trex.movement;
  ai.prob.dice.trex.move = arraySum(die) / die.length;
} // T-rex die

// Densities with respect to counting measure
//   (i.e., pmfs) of the distributions of the total
//   number of ordinary (not jump/enter) spaces moved
//   on a turn by humans, raptors, and trex
// For the particular dice used in the game,
//   the raptor and trex densities are available
//   in closed form, while the human density is not
// The particular raptor and trex densities are
//   made available as pmfForCode0
// For a more general approach, all densities are
//   precomputed as arrays via recurrence relations
//   that depend on the settings of the dice
// The distribution functions (i.e., cdfs) are also
//   computed since they will be used repeatedly
// We also compute the probability that a raptor can
//   enter a building by the end of the turn based on
//   the distance to the entrance of that building
// We also compute the probablity of a certain number
//   of humans being able to leave the start space
//   provided that the human player's focus is
//   solely on that purpose
ai.prob.turn = {};
for (const species of ['human', 'raptor']) {
  ai.prob.turn[species] = {pmf: []};
  const dArrForMax = species === 'human' ?
      ai.humanGoalDistance :
      ai.raptorSpaceDistance.move.flat();
  const maxD = 2 * Math.max(
    ...dArrForMax.filter(x => x < Infinity)
  );
  const {pmf: pmfD, go: pGo} = ai.prob.dice[species];
  const pmfT = ai.prob.turn[species].pmf;
  const pNot0Go = 1 - pmfD[0] * pGo;
  // rr is array of recurrence relation coefficients
  const rr = [0];
  for (let n = 0; n <= ai.maxN[species]; n++) {
    pmfT[n] = pmfD[n] * (1 - pGo) / pNot0Go;
    if (n) rr[n] = pmfD[n] * pGo / pNot0Go;
  }
  for (let x = 0; x <= maxD; x++) {
    pmfT[x] ??= 0;
    for (let i = 1; i <= ai.maxN[species]; i++) {
      pmfT[x] += (pmfT[x - i] ?? 0) * rr[i];
    }
  }
  pmfT.push(1 - arraySum(pmfT));
  ai.prob.turn[species].cdf = arrayCumSum(pmfT);
  // Raptor reach and enter probabilities
  if (species !== 'raptor') continue;
  const reach = [1];
  for (let x = 1; x <= maxD; x++) {
    reach[x] = 0;
    for (let i = 1; i <= ai.maxN.raptor; i++) {
      reach[x] += (reach[x - i] ?? 1) * rr[i];
    }
  }
  const pE = ai.prob.dice.raptor.je;
  ai.prob.turn.raptor.enter = reach.map(
    q => q * pE / (pE + (1 - pE) * (1 - pGo))
  );
}
{
  ai.prob.turn.trex = {pmf: []};
  const pmf = ai.prob.turn.trex.pmf;
  const pMove = ai.prob.dice.trex.move;
  const pGo = ai.prob.dice.raptor.go;
  const pNot0Go = 1 - (1 - pMove) * pGo;
  pmf[0] = (1 - pMove) * (1 - pGo) / pNot0Go;
  pmf[1] = pMove * (1 - pGo) / pNot0Go;
  for (let i = 1; i < bd.trexStart; i++) {
    pmf[i] ??= 0;
    pmf[i] += pmf[i - 1] * pMove * pGo / pNot0Go;
  }
  pmf.push(1 - arraySum(pmf));
  ai.prob.turn.trex.cdf = arrayCumSum(pmf);
} // T-rex turn pmf and cdf
{
  ai.prob.turn.human.evac = [];
  const pmf = ai.prob.turn.human.evac;
  const pMove = 1 - ai.prob.dice.human.pmf[0];
  const pGo = ai.prob.dice.human.go;
  const pNot0Go = 1 - (1 - pMove) * pGo;
  pmf[0] = (1 - pMove) * (1 - pGo) / pNot0Go;
  pmf[1] = pMove * (1 - pGo) / pNot0Go;
  for (let i = 1; i < bd.nHumanPieces; i++) {
    pmf[i] ??= 0;
    pmf[i] += pmf[i - 1] * pMove * pGo / pNot0Go;
  }
  pmf.push(1 - arraySum(pmf));
} // Human start space evacuation
{
  ai.prob.turn.raptor.pmfForCode0 = x => {
    if (! Number.isInteger(x)) return 0;
    if (x < 0) return 0;
    if (x === 0) return 1/11;
    const u = ((2 + Math.sqrt(15)) / 11) ** (x + 1);
    const v = ((2 - Math.sqrt(15)) / 11) ** (x + 1);
    return Math.sqrt(12/5) * (u - v);
  };
  ai.prob.turn.trex.pmfForCode0 = x => {
    if (! Number.isInteger(x)) return 0;
    if (x < 0) return 0;
    if (x === 0) return 1/3;
    return 4 / (3 ** (x + 1));
  }
} // Raptor and T-rex pmfs for Code 0



// Human progress functions
// These essentially provide a default probability
//   of a human reaching the goal from a certain
//   distance away, ignoring any current danger
// They are reasonable guesses, not rigorous facts
// Default is geometric with pStart = 1/6
ai.progress = {};
ai.progress.linear = (pStart, dToGo) => {
  if (dToGo === Infinity) return 0;
  const dStart = ai.humanGoalDistance[bd.humanStart];
  const fracToGo = dToGo / dStart;
  return Math.max(0, 1 - (1 - pStart) * fracToGo);
};
ai.progress.geometric = (pStart, dToGo) => {
  if (dToGo === Infinity) return 0;
  const dStart = ai.humanGoalDistance[bd.humanStart];
  const fracToGo = dToGo / dStart;
  return pStart ** fracToGo;
};
ai.progress.default = dToGo => {
  return ai.progress.geometric(1/6, dToGo);
}



// T-rex danger matrix
// This is a simplistic calculation of the number of
//   humans expected to be eaten by the T-rex
//   if the human player uses all available moves
//   to evacuate the starting space
// The .human and .trex properties indicate
//   which species is about to roll next
ai.trexDanger = {};
for (const species of ['human', 'trex']) {
  ai.trexDanger[species] = new Array(
    bd.nHumanPieces + 1
  ).fill().map(
    x => new Array(bd.trexStart + 1).fill()
  );
  for (let h = 0; h <= bd.nHumanPieces; h++) {
    ai.trexDanger[species][h][0] = h;
  }
  for (let d = 0; d <= bd.trexStart; d++) {
    ai.trexDanger[species][0][d] = 0;
  }
}
for (let h = 1; h <= bd.nHumanPieces; h++) {
  for (let d = 1; d <= bd.trexStart; d++) {
    const {trex: u, human: v} = ai.trexDanger;
    let A = 0;
    for (let x = 1; x <= d; x++) {
      const p = x < d ? ai.prob.turn.trex.pmf[x] :
          arraySum(ai.prob.turn.trex.pmf.slice(d));
      A += p * v[h][d - x];
    }
    let B = 0;
    for (let y = 1; y <= h; y++) {
      const q = y < h ? ai.prob.turn.human.evac[y] :
          arraySum(ai.prob.turn.human.evac.slice(h));
      B += q * u[h - y][d];
    }
    const p0 = ai.prob.turn.trex.pmf[0];
    const q0 = ai.prob.turn.human.evac[0];
    u[h][d] = (A + p0 * B) / (1 - p0 * q0);
    v[h][d] = (B + q0 * A) / (1 - p0 * q0);
  }
}



// Raptor danger matrix
// Probability that a raptor on a raptor space
//   can reach a human space in one turn
ai.raptorDanger = [];
{
  const rhd = ai.raptorHumanDistance({
    humans: sequence(bd.nHumanSpaces),
    raptors: sequence(bd.nRaptorSpaces),
  });
  const danger = ai.raptorDanger;
  for (let r = 0; r < bd.nRaptorSpaces; r++) {
    danger[r] = [];
    for (let h = 0; h < bd.nHumanSpaces; h++) {
      const dm = rhd.move[r][h];
      const de = rhd.enter[r][h];
      const {cdf, enter} = ai.prob.turn.raptor;
      danger[r][h] = dm === 0 ? 1 :
          dm < Infinity ? 1 - cdf[dm - 1] :
          de < Infinity ? enter[de - 1] : 0;
    }
  }
}



// AI evaluation functions
// These are used by the more sophisticated AI levels
//   to evaluate the result of each legal move
// Each takes a game state (s) and an object with
//   configuration settings (config)
//   and returns a quantitative assessment of
//   how good the game state is for the humans
// The config properties can include
//   .progressFn and .roundTo properties,
//   plus properties specific to that function

ai.evaluate = {};

// Human/raptor evaluation function
// Assumes that the next turn will be the dinosaurs
ai.evaluate.nextIsDino = (s, config) => {
  const hgd = s.humans.map(
    x => ai.humanGoalDistance[x]
  );
  const score = hgd.map(
    config?.progressFn ?? ai.progress.default
  );
  const nOnStart = s.humans.filter(
    x => x === bd.humanStart
  ).length;
  const trexDangerFactor = (
    ai.trexDanger.trex[nOnStart][s.trex] / nOnStart
  );
  for (let h = 0; h < s.humans.length; h++) {
    score[h] *= 1 - Math.max(...s.raptors.map(
      r => ai.raptorDanger[r][s.humans[h]]
    ));
    if (s.humans[h] === bd.humanStart) {
      score[h] *= 1 - trexDangerFactor;
    }
  }
  const raw = arraySum(score);
  const rt = config?.roundTo;
  return rt ? Math.round(raw / rt) * rt : raw;
};

// Human evaluation function
// Assumes that the humans have rolled GO and
//   will use their remaining moves to get
//   a particular piece (config.pieceToMove)
//   to its best reachable space
ai.evaluate.humanGo = (s, config) => {
  if (config?.pieceToMove === undefined) {
    return ai.evaluate.nextIsDino(s, config);
  }
  const hgd = ai.humanGoalDistance;
  const rd = s.raptors.map(r => ai.raptorDanger[r]);
  const spaceProgress = hgd.map(
    config?.progressFn ?? ai.progress.default
  );
  // No need to take into account T-rex danger in
  //   spaceScore below since the piece being moved
  //   will have already left the start space
  const spaceScore = spaceProgress.map(
    (e, i) => e * (1 - Math.max(...rd.map(x => x[i])))
  );
  const locCurrent = s.humans[config.pieceToMove];
  const hsd = ai.humanSpaceDistance[locCurrent];
  let score = 0;
  for (let d = 0; d <= hgd[locCurrent]; d++) {
    let locFinal = locCurrent;
    let best = spaceScore[locFinal];
    for (let h = 0; h < bd.nHumanSpaces; h++) {
      if (hsd[h] <= d && spaceScore[h] > best) {
        locFinal = h;
        best = spaceScore[h];
      }
    }
    const sFinal = deepCopy(s);
    sFinal.humans[config.pieceToMove] = locFinal;
    const prob = d < hgd[locCurrent] ?
        ai.prob.turn.human.pmf[d] :
        arraySum(ai.prob.turn.human.pmf.slice(d));
    score += (
      ai.evaluate.nextIsDino(sFinal, config) * prob
    );
  }
  return score;
};

// Raptor evaluation function
// Assumes that the raptors have rolled STOP and
//   have already eaten the best-placed humans,
//   with humans no longer in immediate danger
ai.evaluate.raptorStop = (s, config) => {
  const hgd = s.humans.map(
    x => ai.humanGoalDistance[x]
  );
  const score = hgd.map(
    config?.progressFn ?? ai.progress.default
  );
  // No need to take into account T-rex danger
  //   since raptors can't reach start space anyway
  const raw = arraySum(score);
  const rt = config?.roundTo;
  return rt ? Math.round(raw / rt) * rt : raw;
};



// AI decision functions
// Each takes a game state (s) and a prng (r)
//   and returns a plan of the form [piece, [moves]]
// These can be combined in various ways
//   (e.g., linear combinations) to form the actual
//   AI levels as selected from the menu
// Those in ai.decicion.component should be used
//   only as components of other decision functions
//   and not on their own

ai.decision = {human: {}, raptor: {}, component: {}};

// Human/raptor AI - choose randomly from all plans
ai.decision.human.randAll = (s, r) => {
  return rollDie(ai.legalPlans(s), r);
};
ai.decision.raptor.randAll = (s, r) => {
  return rollDie(ai.legalPlans(s), r);
};

// Human AI - choose randomly from all plans that
//   move any human closer to the goal
ai.decision.human.randForward = (s, r) => {
  const plans = ai.legalPlans(s);
  const okPlans = plans.filter(plan => {
    if (! plan.length) return false;
    const end = plan[1].length - 1;
    const d0 = ai.humanGoalDistance[plan[1][0]];
    const d1 = ai.humanGoalDistance[plan[1][end]];
    return d0 > d1;
  });
  return rollDie(okPlans.length ? okPlans : plans, r);
};

// Raptor AI - choose randomly from all plans that
//   decrease any raptor's distance to any human
ai.decision.raptor.randCloserAny = (s, r) => {
  const d0 = ai.raptorHumanDistance(s);
  const d0m = d0.move;
  const d0e = d0.enter;
  const plans = ai.legalPlans(s);
  const okPlans = plans.filter(plan => {
    if (! plan.length) return false;
    const sPlan = deepCopy(s);
    const [piece, moves] = plan;
    const end = moves[moves.length - 1];
    sPlan.raptors[piece] = end;
    const d1 = ai.raptorHumanDistance(sPlan);
    const d1m = d1.move;
    const d1e = d1.enter;
    const mDiff = arrayMinus(d1m[piece], d0m[piece]);
    const eDiff = arrayMinus(d1e[piece], d0e[piece]);
    // Note that Infinity - Infinity returns NaN,
    //   and NaN <= 0 returns false, so the approach
    //   below actually handles Infinity reasonably
    const isLE0 = x => x <= 0;
    return mDiff.some(isLE0) || eDiff.some(isLE0);
  });
  return rollDie(okPlans.length ? okPlans : plans, r);
};

// Raptor AI - choose randomly from all plans that
//   decrease any raptor's distance to closest human
ai.decision.raptor.randCloserMin = (s, r) => {
  const d0 = ai.raptorHumanDistance(s);
  const d0m = d0.move.map(x => Math.min(...x));
  const d0e = d0.enter.map(x => Math.min(...x));
  const plans = ai.legalPlans(s);
  const okPlans = plans.filter(plan => {
    if (! plan.length) return false;
    const sPlan = deepCopy(s);
    const [piece, moves] = plan;
    const end = moves[moves.length - 1];
    sPlan.raptors[piece] = end;
    const d1 = ai.raptorHumanDistance(sPlan);
    const d1m = d1.move.map(x => Math.min(...x));
    const d1e = d1.enter.map(x => Math.min(...x));
    const mCloser = d0m[piece] > d1m[piece];
    const eCloser = d0e[piece] > d1e[piece];
    return mCloser || eCloser;
  });
  return rollDie(okPlans.length ? okPlans : plans, r);
};

// Human AI - compute a simplistc danger value for
//   each legal plan and choose randomly from
//   plans with lowest danger value
ai.decision.human.randAvoidDanger = (s, r) => {
  const plans = ai.legalPlans(s);
  const danger = plans.map(plan => {
    let result = 0;
    const sPlan = deepCopy(s);
    if (plan.length) {
      const [piece, moves] = plan;
      const end = moves[moves.length - 1];
      sPlan.humans[piece] = end;
      const hgd0 = ai.humanGoalDistance[moves[0]];
      const hgd1 = ai.humanGoalDistance[end];
      if (hgd0 > hgd1) result--;
    }
    if (! s.rollGo) {
      const rhd = ai.raptorHumanDistance(sPlan).move;
      for (let h = 0; h < s.humans.length; h++) {
        const dist = Math.min(...rhd.map(x => x[h]));
        if (dist === 0) result += 4 * s.humans.length;
        if (dist === 1) result += 2;
      }
    }
    return result;
  });
  const minDanger = Math.min(...danger);
  const okPlans = plans.filter(
    (e, i) => danger[i] === minDanger
  );
  return rollDie(okPlans, r);
};

// AI component - evaluate and choose best plan
//   assuming that dinosaurs move next
//   using ai.evaluate.nextIsDino
ai.decision.component.nextIsDino = (s, r) => {
  const cfg = {roundTo: Math.sqrt(Number.EPSILON)};
  const plans = ai.legalPlans(s);
  const score = plans.map(plan => {
    const sPlan = deepCopy(s);
    if (plan.length) {
      const [piece, moves] = plan;
      const end = moves[moves.length - 1];
      sPlan[`${s.turn}s`][piece] = end;
      if (s.turn === 'raptor') {
        for (let h = 0; h < s.humans.length; h++) {
          const eaten = moves.includes(
            ai.raptorSpaceOfHumanSpace[s.humans[h]]
          );
          if (eaten) sPlan.humans[h] = bd.humanDead;
        }
      }
    }
    const ev = ai.evaluate.nextIsDino(sPlan, cfg);
    return ev * (s.turn === 'human' ? 1 : -1);
  });
  const bestScore = Math.max(...score);
  const bestPlans = plans.filter(
    (e, i) => score[i] === bestScore
  );
  return rollDie(bestPlans, r);
};

// AI component - evaluate and choose best plan
//   assuming that humans are moving and rolled GO
//   using ai.evaluate.humanGo
ai.decision.component.humanGo = (s, r) => {
  const cfg = {roundTo: Math.sqrt(Number.EPSILON)};
  const plans = ai.legalPlans(s);
  const score = plans.map(plan => {
    const sPlan = deepCopy(s);
    if (plan.length) {
      const [piece, moves] = plan;
      const end = moves[moves.length - 1];
      sPlan.humans[piece] = end;
      cfg.pieceToMove = piece;
    }
    return ai.evaluate.humanGo(sPlan, cfg);
  });
  const bestScore = Math.max(...score);
  const bestPlans = plans.filter(
    (e, i) => score[i] === bestScore
  );
  return rollDie(bestPlans, r);
};

// AI component - evaluate and choose best plan
//   assuming that raptors are moving and rolled STOP
//   using ai.evaluate.raptorStop
ai.decision.component.raptorStop = (s, r) => {
  const cfg = {roundTo: Math.sqrt(Number.EPSILON)};
  const plans = ai.legalPlans(s);
  const score = plans.map(plan => {
    const sPlan = deepCopy(s);
    if (plan.length) {
      const [piece, moves] = plan;
      const end = moves[moves.length - 1];
      sPlan.raptors[piece] = end;
      for (let h = 0; h < s.humans.length; h++) {
        const eaten = moves.includes(
          ai.raptorSpaceOfHumanSpace[s.humans[h]]
        );
        if (eaten) sPlan.humans[h] = bd.humanDead;
      }
    }
    return ai.evaluate.raptorStop(sPlan, cfg) * -1;
  });
  const bestScore = Math.max(...score);
  const bestPlans = plans.filter(
    (e, i) => score[i] === bestScore
  );
  return rollDie(bestPlans, r);
};

// Human AI - simple evaluation-based AI that
//   combines nextIsDino with humanGo
ai.decision.human.evalSimple = (s, r) => {
  const fn = s.rollGo ? 'humanGo' : 'nextIsDino';
  return ai.decision.component[fn](s, r);
};

// Raptor AI - simple evaluation-based AI that
//   combines nextIsDino with raptorStop
ai.decision.raptor.evalSimple = (s, r) => {
  const fn = s.rollGo ? 'nextIsDino' : 'raptorStop';
  return ai.decision.component[fn](s, r);
};



// Numeric AI levels for selection from menu
// These are distinct from the decision functions
//   (even when they do the same thing) since the
//   save codes are specifically for these levels
//   and not for the decision functions themselves

ai.level = {human: [], raptor: []};

ai.level.human[0] = (s, r) => {
  return ai.decision.human.randAll(s, r);
};
ai.level.human[1] = (s, r) => {
  return ai.decision.human.randForward(s, r);
};
ai.level.human[2] = (s, r) => {
  return ai.decision.human.randAvoidDanger(s, r);
};
ai.level.human[3] = (s, r) => {
  return ai.decision.human.evalSimple(s, r);
};

ai.level.raptor[0] = (s, r) => {
  return ai.decision.raptor.randAll(s, r);
};
ai.level.raptor[1] = (s, r) => {
  return ai.decision.raptor.randCloserAny(s, r);
};
ai.level.raptor[2] = (s, r) => {
  return ai.decision.raptor.randCloserMin(s, r);
};
ai.level.raptor[3] = (s, r) => {
  return ai.decision.raptor.evalSimple(s, r);
};

// Save codes
for (const species of ['human', 'raptor']) {
  const levels = ai.level[species];
  for (let i = 0; i < levels.length; i++) {
    levels[i].saveCode = `${i}`;
  }
}
ai.control.fullSaveCode = () => {
  const h = ai.control.human.saveCode ?? '$';
  const r = ai.control.raptor.saveCode ?? '$';
  return `%${h}%${r}`;
};



// Detect if script is running in simulation mode
//   (i.e., in node rather than in a broswer)
// If so, assign settings needed for simulation
//   to the global object
if(typeof global !== typeof void 0) {
  Object.assign(global, {ai});
}
