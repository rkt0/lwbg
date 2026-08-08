export function template(id, asFragment) {
  if (!(id in cache)) {
    const element = document.getElementById(id);
    cache[id] = element?.content;
  }
  const node = cache[id]?.cloneNode(true);
  if (asFragment) return node;
  const nChildElements = node?.children.length ?? 0;
  if (nChildElements > 1) return [...node.children];
  return node?.firstElementChild;
}

const cache = {};
