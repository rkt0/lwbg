import {
  qjs, ael, ce, fromTemplate,
} from './utility.js';
import {anim} from './animation.js';

export const message = {
  show(templateId, append) {
    const node = fromTemplate(templateId);
    if (append && element.dataset.appendable === '') {
      content.append(ce('br'), node);
    } else content.replaceChildren(node);
    if (append) element.dataset.appendable = '';
    content.style.visibility = 'visible';
    anim.slide(element, 1, anim.time.messageSlide);
  },
  hide() {
    if (element.style.display === 'none') return;
    if (anim.isAnimated(element)) return;
    content.style.visibility = 'hidden';
    hider.style.display = 'none';
    delete element.dataset.appendable;
    anim.slide(element, 0, anim.time.messageSlide);
  },
};

const element = qjs('gameplay-message');
const content = qjs('content', element);
const hider = qjs('hider', element);

function mouseover(inbound) {
  if (anim.isAnimated(element)) return;
  content.style.visibility =
    inbound ? 'hidden' : 'visible';
  hider.style.display = inbound ? '' : 'none';
}

ael(element, 'mousedown', () => {
  message.hide();
});
ael(element, 'mouseenter', () => {
  mouseover(true);
});
ael(element, 'mouseleave', () => {
  mouseover(false);
});
