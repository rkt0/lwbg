import {ael, aelo, click} from './utility.js';
import {anim} from './animation.js';
import {music} from './music.js';
import {ui} from './functions-ui.js';
import {autoSave} from './auto-save.js';

// Animation times for menu fade
const aTime = anim.time.menuFade;

// Add title screen click handler
aelo('#title-container', 'mousedown', async () => {
  onbeforeunload = () => '';
  await anim.fade('#title-container', 0, aTime);
  anim.fade('#start-container', 1, aTime);
  music.next();
});

// Start screen click handlers
async function startNew() {
  ui.disableMenu('start-options');
  await anim.fade('#start-options', 0, aTime);
  ui.showControl();
}
async function loadSaved() {
  ui.disableMenu('start-options');
  await anim.fade('#start-options', 0, aTime);
  ui.startMessage('load-introduction');
  anim.fade('#start-message', 1, aTime);
  aelo('#start-container', 'mousedown', () => {
    selectFileToLoad();
  });
}
async function loadOverwrite() {
  const {fhLoad} = autoSave;
  ui.disableMenu('load-choose-save');
  const okAlready = await fhLoad.queryPermission({
    mode: 'readwrite',
  });
  autoSave.fh = fhLoad;
  ui.startMessage(`load-permission-${okAlready}`);
  await anim.fade('#load-choose-save', 0, aTime);
  await anim.fade('#start-message', 1, aTime);
  aelo('#start-container', 'mousedown', () => {
    autoSave.begin(fhLoad);
  });
}
async function loadNew() {
  const {fhLoad} = autoSave;
  ui.disableMenu('load-choose-save');
  await anim.fade('#load-choose-save', 0, aTime);
  autoSave.begin(fhLoad);
}
async function selectFileToLoad() {
  anim.fade('#start-message', 0, aTime);
  let fh;
  try {
    [fh] = await showOpenFilePicker({
      startIn: autoSave.defaultDirectory,
    });
  } catch {
    ui.showStartOptions();
    return;
  }
  const file = await fh.getFile();
  const contents = await file.text();
  const lines = contents.split('\n');
  if (lines[0] !== 'LWBG' || lines[1] !== '0,0') {
    ui.startMessage('load-invalid-file');
    await anim.fade('#start-message', 1, aTime);
    aelo('#start-container', 'mousedown', () => {
      ui.showStartOptions();
    });
    return;
  };
  autoSave.fhLoad = fh;
  await anim.fade('#load-choose-save', 1, aTime, {
    display: '',
  });
  ui.disableMenu('load-choose-save', false);
}

// Add start screen click handler
ael('#start-container', 'mousedown', (e) => {
  const id = e.target.closest('button')?.id;
  console.log(id);
  if (id === 'start-new') startNew();
  else if (id === 'load-saved') loadSaved();
  else if (id === 'load-overwrite') loadOverwrite();
  else if (id === 'load-new') loadNew();
  else if (id === 'start-toggle-audio') {
    music.toggle();
  }
});
