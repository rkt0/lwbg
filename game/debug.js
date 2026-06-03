import {ce, cesvg, fromTemplate} from './utility.js';
import {dom} from './dom.js';

export const debug = {
  skipAutoSave: true,
  boardLabels: {
    humanSpace: false,
    raptorPoint: false,
    raptorSpace: false,
  },
  // Put raptor in every space
  raptorPlacement: {on: false, shape: 3, color: 3},
  // Speed up animations (set to false or number > 1)
  animationSpeed: false,
  // Cycle music starting at specified track
  music: {cycle: false, startAt: 0},
  makeLabels(kind, points) {
    const div = fromTemplate('debug-labels', true);
    div.classList.add(`${kind}-labels`);
    dom.sectionGameplay.append(div);
    const svg = cesvg('svg');
    div.append(svg);
    for (const [i, point] of points.entries()) {
      if (!point) continue;
      const [x, y] = point;
      const element = cesvg('text');
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      element.textContent = i;
      svg.append(element);
    }
  },
};
