import {qda} from './utility.js';
import './initialize-sidebar.js';
import './initialize-gameplay.js';
import './key-bindings.js';

for (const element of qda('dormant')) {
  element.style.display = 'none';
}
document.body.style.display = 'block';
