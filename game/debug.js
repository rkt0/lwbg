import {qs, cesvg} from './utility.js';

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
    const container = qs(`#${kind}-labels`);
    container.style.display = 'block';
    const svg = cesvg('svg');
    container.append(svg);
    for (const [i, [x, y]] of points.entries()) {
      const element = cesvg('text');
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      element.textContent = i;
      svg.append(element);
    }
  },
};
