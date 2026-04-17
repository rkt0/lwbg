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
  // for (const namedExport of [].concat(namedExports)) {
  //   globalThis[namedExport] = contents[namedExport];
  // }
  // filesLoadedAsModules.push(src);
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
    // await loadScript(src);
  }
}

loadAll();


// utility.js
// adds to global namespace: utility functions

// debug.js
//   adds to global namespace: debug (data only)

// prngs.js
//   adds to global namespace: prng (data only)

// logic.js
//   adds to global namespace: bd (data only)
//   adds to global namespace: dice (data only)

// ai.js
//   adds to global namespace: ai
//     ai methods use: bd, dice

// animation.js
//   adds to global namespace: anim (data only)
//     anim data uses: debug

// pieces.js
//   adds to global namespace: pieces
//     pieces methods use: debug, prng, bd

// music.js
//   adds to global namespace: music
//     music methods use: debug, prng

// sfx.js
//   adds to global namespace: sfx
//     sfx methods use: prng, music

// functions-gameplay.js
//   adds to global namespace: gp
//     gp methods use: bd, ai, anim, ui, gs, mv, pl,
//                     sfx

// functions-ui.js
//   adds to global namespace: ui
//     ui methods use: anim, zd

// initialize-gameplay.js
//   adds to global namespace: gs (data only)
//   adds to global namespace: mv (data only)
//   adds to global namespace: zd (data only)
//   executes initialization of gameplay objects
//   executes autoSave.clear()
//   executes edit.clear()
//   executes setting of gp save function
//   executes creation of gameplay container element
//   adds to global namespace: pl (data only)
//   executes creation of board elements and listeners
//   executes piece layout adjustments
//   executes svg bottom chop
//   executes creation of pieces
//   executes insertion of piece images
//   executes initialization of view at start of game

// initialize-ui.js
//   executes creation of title screen
//   executes creation of start screen
//   executes creation of save clarification screen
//   executes creation of player control screen
//   executes creation of more menu
//   executes creation of manual save help screen
//   executes creation of confirm quit screen
//   executes creation of gameplay menu container
//   executes creation of zoom/turn/roll displays
//   executes creation of buttons
//   executes positioning of gameplay menu items
//   executes creation of dice
//   executes setup of beforeunload listener
//   executes creation of message
//   executes creation of game over display
//   executes creation of edit mode controls
//   executes creation of CSS variables for dice
//   executes creation of music audio element
//   executes creation of sfx audio element
//   executes creation of display matte
//   executes creation of audio toggle button
//   executes creation of audio toggle icons

// auto-save.js
//   adds to global namespace: autoSave
//     autoSave methods use: debug, ai, anim, pieces, 
//                           gp, ui, gs

// key-bindings.js
//   executes setup of keyboard listener

// edit-mode.js
//   adds to global namespace: edit
//     edit methods use: bd, dice, ai, anim, gp, ui,
//                       gs, autoSave
