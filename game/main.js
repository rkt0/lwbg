import {qda} from './utility.js';
import {initializeFront} from './pregame.js';
import './initialize-gameplay.js';
import './initialize-hud.js';
import './key-bindings.js';

initializeFront();
for (const element of qda('dormant')) {
  element.style.display = 'none';
}
document.body.style.display = 'block';
