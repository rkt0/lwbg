import {
  qjs, ael, ce, fromTemplate,
} from './utility.js';
import {anim} from './animation.js';

export const message = {
  suppress: false,
  async show(templateId, append) {
    if (this.suppress) return;
    const node = fromTemplate(templateId);
    if (append && element.dataset.appendable === '') {
      element.append(ce('br'), node);
    } else element.replaceChildren(node);
    if (append) element.dataset.appendable = '';
    element.classList.remove('being-hidden');
    await anim.slide(element, 1, aTime);
    element.inert = false;
  },
  hide() {
    if (element.style.display === 'none') return;
    if (anim.isAnimated(element)) return;
    element.inert = true;
    element.classList.add('being-hidden');
    delete element.dataset.appendable;
    anim.slide(element, 0, aTime);
  },
};

const element = qjs('gameplay-message');
const aTime = anim.time.messageSlide;

ael(element, 'mousedown', () => message.hide());
