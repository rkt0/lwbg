import {closestData, ael} from './utility.js';
import {dom} from './dom.js';
import './initialize-board.js';
import {pieces} from './pieces.js';
import {message} from './message.js';
import {toggle} from './toggle.js';
import {gp} from './gameplay.js';
import {edit} from './edit-mode.js';
import {autoSave} from './auto-save.js';
import {
  clickHumanSpace, clickRaptorSpace, clickBuilding,
} from './click-board.js';
import {
  clickHumanPiece, clickRaptorPiece,
  clickEditKill, clickEditTrex,
} from './click-pieces.js';
import {moreMenu} from './more-menu.js';

// Make pieces
pieces.makeAll();
gp.adjustHumanPositions();

// Initialize objects
await gp.initializeObjects();
autoSave.clear();
edit.clear();

// Helper function to identify clicked element
function clicked(element, event) {
  return element.contains(event.target);
}

// Add gameplay click handlers
ael(dom.gameplay, 'mousedown', (e) => {
  const isEditBanner = clicked(edit.bannerElement, e);
  if (isEditBanner) return edit.handleBannerClick(e);
  const isMoreMenu = clicked(moreMenu.element, e);
  if (isMoreMenu) return moreMenu.handleClick(e);
  const isMessage = clicked(message.element, e);
  if (isMessage) return message.hide();
  const isToggle = clicked(toggle.areaElement, e);
  if (isToggle) return toggle.handleClick(e);
  const killData = closestData(e, 'kill');
  if (killData) return clickEditKill(+killData);
  const rpData = closestData(e, 'raptor-piece');
  if (rpData) return clickRaptorPiece(+rpData);
  const hpData = closestData(e, 'human-piece');
  if (hpData) return clickHumanPiece(+hpData);
  const tsData = closestData(e, 'trex-space');
  if (tsData) return clickEditTrex(+tsData, true);
  const tcData = closestData(e, 'trex-change');
  if (tcData) return clickEditTrex(+tcData);
  const bldgData = closestData(e, 'building');
  if (bldgData) return clickBuilding(+bldgData);
  const hsData = closestData(e, 'human-space');
  if (hsData) return clickHumanSpace(+hsData);
  const rsData = closestData(e, 'raptor-space');
  if (rsData) return clickRaptorSpace(+rsData);
});
