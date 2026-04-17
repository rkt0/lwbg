import {rollDie} from './utility.js';
import {prng} from './prngs.js';
import {music} from './music.js';

export const sfx = {
  id: 'sfx-player',
  dir: 'audio/sfx',
};
sfx.sound = [
  new SoundEffect('trex-roar'),
  new SoundEffect('trex-stomp'),
  // Raptor sound freqWeight should be integer
  new SoundEffect('raptor-0', 1),
  new SoundEffect('raptor-1', 2),
  new SoundEffect('raptor-2', 1),
  new SoundEffect('raptor-3', 2),
  new SoundEffect('raptor-4', 2),
  new SoundEffect('raptor-5', 2),
  new SoundEffect('raptor-6', 2),
];

// SoundEffect constructor
function SoundEffect(title, freqWeight = 1) {
  this.src = `${sfx.dir}/${title}.mp3`;
  this.title = title;
  this.freqWeight = freqWeight;
}

// Play sounds
sfx.play = title => {
  if (! music.audioOn) return;
  const {src, volume} =
      sfx.sound.find(x => x.title === title);
  const el = $(`#${sfx.id}`).get(0);
  el.src = src;
  el.play();
};

// T-rex sounds
sfx.trexRoar  = () => sfx.play('trex-roar');
sfx.trexStomp = () => sfx.play('trex-stomp');

// Raptor sounds
sfx.raptorSounds = sfx.sound.filter(
  x => x.title.startsWith('raptor')
);
sfx.raptorIdArr = sfx.raptorSounds.map(x => {
  const id = x.title.split('-')[1];
  const arr = [];
  for (let i = 0; i < x.freqWeight; i++) arr.push(id);
  return arr;
}).flat();
sfx.raptor = () => {
  const el = $(`#${sfx.id}`).get(0);
  if (el.src && ! el.ended) return;
  const soundId = rollDie(sfx.raptorIdArr, prng.sfx);
  sfx.play(`raptor-${soundId}`);
  sfx.raptorAlreadyPlayed = true;
};

// To prevent raptor sounds from playing
//   more than once on same die roll, this indicator
//   is set to true when raptor sound is played
//   and checked to prevent sound from playing again
sfx.raptorAlreadyPlayed = false;

// Create audio element
sfx.makeElement = () => {
  $('<audio></audio>').attr('id', sfx.id)
    .appendTo('body');
};
