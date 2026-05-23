import {qs, ael} from './utility.js';
import {anim} from './animation.js';
import {autoSave} from './auto-save.js';
// Remember to change this
import './pregame.js';

// Animation time for menu fade
const aTime = anim.time.menuFade;

// // Add title screen click handler
// aelo('#title-container', 'mousedown', async () => {
//   onbeforeunload = () => '';
//   await anim.fade('#title-container', 0, aTime);
//   anim.fade('#start-container', 1, aTime);
//   music.next();
// });

// Start screen click handlers
// async function startNew() {
//   qs('#start-options').inert = true;
//   await anim.fade('#start-options', 0, aTime);
//   await showControl();
//   autoSave.begin();
// }
// async function loadSaved() {
//   qs('#start-options').inert = true;
//   await anim.fade('#start-options', 0, aTime);
//   ui.startMessage('load-introduction');
//   anim.fade('#start-message', 1, aTime);
//   aelo('#start-container', 'mousedown', () => {
//     selectFileToLoad();
//   });
// }
// async function loadOverwrite() {
//   const {fhLoad} = autoSave;
//   qs('#load-fork').inert = true;
//   const okAlready = await fhLoad.queryPermission({
//     mode: 'readwrite',
//   });
//   autoSave.fh = fhLoad;
//   ui.startMessage(`load-permission-${okAlready}`);
//   await anim.fade('#load-fork', 0, aTime);
//   await anim.fade('#start-message', 1, aTime);
//   aelo('#start-container', 'mousedown', () => {
//     autoSave.begin(fhLoad);
//   });
// }
async function loadNew() {
  const {fhLoad} = autoSave;
  qs('#load-fork').inert = true;
  await anim.fade('#load-fork', 0, aTime);
  autoSave.begin(fhLoad);
}
// async function selectFileToLoad() {
//   anim.fade('#start-message', 0, aTime);
//   let fh;
//   try {
//     [fh] = await showOpenFilePicker({
//       startIn: autoSave.defaultDirectory,
//     });
//   } catch {
//     ui.showStartOptions();
//     return;
//   }
//   const file = await fh.getFile();
//   const contents = await file.text();
//   const lines = contents.split('\n');
//   if (lines[0] !== 'LWBG' || lines[1] !== '0,0') {
//     ui.startMessage('load-invalid-file');
//     await anim.fade('#start-message', 1, aTime);
//     aelo('#start-container', 'mousedown', () => {
//       ui.showStartOptions();
//     });
//     return;
//   };
//   autoSave.fhLoad = fh;
//   await anim.fade('#load-fork', 1, aTime, {
//     display: '',
//   });
//   qs('#load-fork').inert = false;
// }

// Add start screen click handlers
ael('#start-container', 'mousedown', (e) => {
  const id = e.target.closest('button')?.id;
  if (id === 'start-new') null;
  // if (id === 'start-new') startNew();
  // else if (id === 'load-saved') loadSaved();
  // else if (id === 'load-overwrite') loadOverwrite();
  else if (id === 'load-new') loadNew();
});
