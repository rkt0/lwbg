import {
  qjs, ael, ce, fromTemplate,
} from './utility.js';
import {anim} from './animation.js';

export const message = {
  suppress: false,
  show(templateId, append) {
    if (this.suppress) return;
    const node = fromTemplate(templateId);
    if (append && element.dataset.appendable === '') {
      element.append(ce('br'), node);
    } else element.replaceChildren(node);
    if (append) element.dataset.appendable = '';
    element.classList.remove('being-hidden');
    anim.slide(element, 1, anim.time.messageSlide);
  },
  hide() {
    if (element.style.display === 'none') return;
    if (anim.isAnimated(element)) return;
    element.classList.add('being-hidden');
    delete element.dataset.appendable;
    anim.slide(element, 0, anim.time.messageSlide);
  },
};

const element = qjs('gameplay-message');

ael(element, 'mousedown', () => message.hide());
