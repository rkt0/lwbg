const scriptFiles = [
  'utility.js',
  'debug.js',
  'prngs.js',
  'logic.js',
  'ai.js',
  'animation.js',
  'pieces.js',
  'game-objects.js',
  'functions-gameplay.js',
  'functions-ui.js',
  'initialize-gameplay.js',
  'initialize-ui.js',
  'auto-save.js',
  'key-bindings.js',
  'music.js',
  'sfx.js',
  'edit-mode.js',
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
async function loadAll() {
  await loadModule('jquery.js');
  await loadModule('utility.js', [
    'deepCopy', 'isNull', 'sequence',
    'arrayMinus', 'arraySum', 'arrayCumSum',
    'rollDie', 'shuffle',
    'cssInt', 'cssIntWH',
    'base64', 'base256',
  ]);
  await loadModule('debug.js', 'debug');
  await loadModule('prngs.js', 'prng');
  await loadModule('logic.js', ['bd', 'dice']);
  await loadModule('ai.js', 'ai');
  await loadModule('animation.js', 'anim');
  await loadModule('pieces.js', 'pieces');
  await loadModule('music.js', 'music');
  await loadModule('sfx.js', 'sfx');
  await loadModule('game-objects.js', [
    'gs', 'mv', 'zd', 'pl',
  ]);
  await loadModule('functions-ui.js', 'ui');
  await loadModule('functions-gameplay.js', 'gp');
  await loadModule('auto-save.js');
  await loadModule('edit-mode.js');
  await loadModule('initialize-gameplay.js');
  await loadModule('initialize-ui.js');
  await loadModule('key-bindings.js');
  for (const src of scriptFiles) {
    if (filesLoadedAsModules.includes(src)) continue;
    await loadScript(src);
  }
}

loadAll();
