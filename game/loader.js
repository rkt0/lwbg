const scriptFiles = [
 "debug.js",
 "utility.js",
 "prngs.js",
 "logic.js",
 "ai.js",
 "animation.js",
 "pieces.js",
 "functions-gameplay.js",
 "functions-ui.js",
 "initialize-gameplay.js",
 "initialize-ui.js",
 "auto-save.js",
 "key-bindings.js",
 "music.js",
 "sfx.js",
 "edit-mode.js",
];
const filesLoadedAsModules = [];

async function loadModule(src, namedExports = []) {
  const contents = await import(`./${src}`);
  for (const namedExport of [].concat(namedExports)) {
    globalThis[namedExport] = contents[namedExport];
  }
  filesLoadedAsModules.push(src);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
async function loadAllScripts() {
  for (const src of scriptFiles) {
    if (filesLoadedAsModules.includes(src)) continue;
    await loadScript(src);
  }
}

loadModule('jquery.js');
loadAllScripts();
