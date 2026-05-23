import {qs, ael, ce, fromTemplate} from './utility.js';
import {anim} from './animation.js';

export const message = {
  show(templateId, append) {
    const node = fromTemplate(templateId);
    const previousWasAppendable =
      container.classList.contains('appendable');
    if (append && previousWasAppendable) {
      content.append(ce('br'), node);
    } else content.replaceChildren(node);
    if (append) container.classList.add('appendable');
    content.style.visibility = 'visible';
    anim.slide(container, 1, anim.time.messageSlide);
  },
  hide() {
    if (container.style.display === 'none') return;
    if (anim.isAnimated(container)) return;
    content.style.visibility = 'hidden';
    hider.style.display = 'none';
    container.classList.remove('appendable');
    anim.slide(container, 0, anim.time.messageSlide);
  },
};

const container = qs('#message-container');
const content = qs('.content', container);
const hider = qs('.hider', container);

function mouseover(inbound) {
  if (anim.isAnimated(container)) return;
  content.style.visibility =
    inbound ? 'hidden' : 'visible';
  hider.style.display = inbound ? 'flex' : 'none';
}

ael(container, 'mousedown', () => {
  message.hide();
});
ael(container, 'mouseenter', () => {
  mouseover(true);
});
ael(container, 'mouseleave', () => {
  mouseover(false);
});
