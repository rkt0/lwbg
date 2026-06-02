import {
  sleep, sqrtStep, windowWH,
  absoluteBoundingRect, boundingBox,
} from './utility.js';
import {scrollBetter} from './scroll.js';
import {dom} from './dom.js';
import {bd} from './board-topology.js';
import {anim} from './animation.js';
import {gs, mv, pl} from './game-objects.js';

function movePlanRegion() {
  if (gs.turn === 'trex') return trexMoveRegion();
  const corners = mv.plan.map(x => pl[gs.turn][x]);
  const [pw, ph] = pl[gs.turn].ps;
  const regions = corners.map(x => ({
    left: x[0], right: x[0] + pw,
    top: x[1], bottom: x[1] + ph,
  }));
  return boundingBox(...regions);
};
function trexMoveRegion() {
  const [oldL, oldT] = pl.trex[gs.trex];
  const [newL, newT] = pl.trex[gs.trex - 1];
  const [pw, ph] = pl.trex.ps;
  const pieceRegionOld = {
    left: oldL, right: oldL + pw,
    top: oldT, bottom: oldT + ph,
  };
  const pieceRegionNew = {
    left: newL, right: newL + pw,
    top: newT, bottom: newT + ph,
  };
  const spaceOld = `#trex-space-${gs.trex}`;
  const spaceOrElementNew = gs.trex === 1 ?
    dom.humanSpace[bd.humanStart] :
    `#trex-space-${gs.trex - 1}`;
  return boundingBox(
    pieceRegionOld, pieceRegionNew,
    absoluteBoundingRect(spaceOld),
    absoluteBoundingRect(spaceOrElementNew),
  );
};
export async function bringMoveIntoView() {
  const region = movePlanRegion();
  const padding = [216, 108];
  const [ww, wh] = windowWH();
  const [ph, pv] = padding;
  const current = {
    left: scrollX, right: scrollX + ww,
    top: scrollY, bottom: scrollY + wh,
  };
  const excess = [
    (region.right - region.left) - ww + ph * 2,
    (region.bottom - region.top) - wh + pv * 2,
  ].map(x => Math.max(x, 0));
  const target = {
    left: region.left - ph + excess[0] / 2,
    right: region.right + ph - excess[0] / 2,
    top: region.top - pv + excess[1] / 2,
    bottom: region.bottom + pv - excess[1] / 2,
  };
  const location = {
    left: Math.min(target.left, current.left),
    top: Math.min(target.top, current.top),
  };
  if (target.right > current.right) {
    location.left = target.right - ww;
  }
  if (target.bottom > current.bottom) {
    location.top = target.bottom - wh;
  }
  const distance = Math.hypot(
    location.left - current.left,
    location.top - current.top,
  );
  // Times will be reduced if distance to be scrolled 
  // is less than taperDistance
  const taperDistance = 648;
  const taper = sqrtStep(distance / taperDistance);
  const duration = anim.time.autoScroll * taper;
  await scrollBetter(location, duration);
  await sleep(anim.time.autoScrollDelay * taper);
}
