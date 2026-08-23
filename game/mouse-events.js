function createClickEvent() {
  return new Event('clickstart', {
    bubbles: true, cancelable: true,
  });
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
  e.target.dispatchEvent(createClickEvent());
});
