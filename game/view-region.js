import {
  sleep, sqrtStep, absoluteBoundingRect, boundingBox,
} from './utility.js';
import {bd} from './board-topology.js';
import {gs, mv, pl} from './game-objects.js';
import {dom} from './dom.js';
import {scrollBetter} from './scroll.js';
import {tvMatte} from './tv-matte.js';
import {anim} from './animation.js';

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
  const elementOld = dom.trexSpace[gs.trex];
  const elementNew = gs.trex === 1 ?
    dom.humanSpace[bd.humanStart] :
    dom.trexSpace[gs.trex - 1];
  return boundingBox(
    pieceRegionOld, pieceRegionNew,
    absoluteBoundingRect(elementOld),
    absoluteBoundingRect(elementNew),
  );
};

export async function bringMoveIntoView() {
  const region = movePlanRegion();
  const padding = [216, 108];
  const [ph, pv] = padding;
  const target = {
    left: region.left - ph,
    right: region.right + ph,
    top: region.top - pv,
    bottom: region.bottom + pv,
  };
  const [wwm, whm] = tvMatte.windowWHMatted();
  const matte = tvMatte.current();
  if (target.right - target.left > wwm) {
    const midpoint = (target.left + target.right) / 2;
    target.left = midpoint - wwm / 2;
    target.right = midpoint + wwm / 2;
  }
  if (target.bottom - target.top > whm) {
    const midpoint = (target.top + target.bottom) / 2;
    target.top = midpoint - whm / 2;
    target.bottom = midpoint + whm / 2;
  }
  const current = {
    left: scrollX + matte.left,
    right: scrollX + matte.left + wwm,
    top: scrollY + matte.top,
    bottom: scrollY + matte.top + whm,
  };
  const location = {
    left: Math.min(target.left, current.left),
    top: Math.min(target.top, current.top),
  };
  if (target.right > current.right) {
    location.left = target.right - wwm;
  }
  if (target.bottom > current.bottom) {
    location.top = target.bottom - whm;
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
