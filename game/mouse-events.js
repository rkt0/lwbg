class CustomEvent extends Event {
  constructor(type, options = {}, data = {}) {
    super(type, options);
    Object.assign(this, data);
  }
}

const options = {bubbles: true, cancelable: true};
function createClickEvent(sourceMouseEvent) {
  let data = {};
  if (sourceMouseEvent) {
    const {clientX, clientY} = sourceMouseEvent;
    data = {clientX, clientY};
  }
  return new CustomEvent('clickstart', options, data);
}

export function click(element) {
  element.dispatchEvent(createClickEvent());
}

export function atClick(element, listener) {
  element.addEventListener('clickstart', listener);
}

export function waitForClick(element) {
  return new Promise((resolve) => {
    element.addEventListener('clickstart', resolve, {
      once: true,
    });
  });
}

const mainButton = 0;
document.addEventListener('mousedown', (e) => {
  if (e.button !== mainButton || !e.isTrusted) return;
  e.target.dispatchEvent(createClickEvent(e));
});
