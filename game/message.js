import {qjs, ce} from './utility.js';
import {template} from './template.js';
import {anim} from './animation.js';

export const message = {
  element: qjs('message'),
  suppress: false,
  async show(templateId, append) {
    if (this.suppress) return;
    const node = template(templateId, true);
    const {appendable} = this.element.dataset;
    if (append && appendable === '') {
      this.element.append(ce('br'), node);
    } else this.element.replaceChildren(node);
    if (append) this.element.dataset.appendable = '';
    this.element.classList.remove('being-hidden');
    await anim.slide(this.element, 1, aTime);
    this.element.inert = false;
  },
  async hide() {
    if (this.element.style.display === 'none') return;
    if (anim.isAnimated(this.element)) return;
    this.element.inert = true;
    this.element.classList.add('being-hidden');
    delete this.element.dataset.appendable;
    await anim.slide(this.element, 0, aTime);
  },
};

const aTime = anim.time.messageSlide;
