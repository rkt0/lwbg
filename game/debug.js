// Container object
export const debug = {};

// Skip autosave
debug.skipAutoSave = true;

// Speed up animations (set to false or number > 1)
debug.animationSpeed = false;

// Show board labels
debug.boardLabels = {
  humanSpace:  false,
  raptorPoint: false,
  raptorSpace: false,
};

// Put raptor in every space
debug.raptorPlacement = {
  on: false,
  shape: 3,
  color: 3,
};

// Cycle music starting at specified track
debug.music = {cycle: false, startAt: 0};
