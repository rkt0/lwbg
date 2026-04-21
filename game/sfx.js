import {qs} from './utility.js';
import {rollDie} from './utility.js';
import {prng} from './prngs.js';
import {music} from './music.js';

class SoundEffect {
  constructor(title, freqWeight = 1) {
    this.src = `audio/sfx/${title}.mp3`;
    this.title = title;
    this.freqWeight = freqWeight;
  }
}

export const sfx = {
  element: qs('#sfx-player'),
  sounds: [
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
  ],
  play(title) {
    if (!music.audioOn) return;
    sfx.element.src =
      sfx.sounds.find(x => x.title === title).src;
    sfx.element.play();
  },
  trexRoar() {
    sfx.play('trex-roar');
  },
  trexStomp() {
    sfx.play('trex-stomp');
  },
  raptor() {
    if (sfx.element.src && ! sfx.element.ended) {
      return;
    }
    const id = rollDie(sfx.raptorIdArr, prng.sfx);
    sfx.play(`raptor-${id}`);
    sfx.raptorAlreadyPlayed = true;
  },
  // To prevent raptor sounds from playing
  // more than once on same die roll, this indicator
  // is set to true when raptor sound is played
  // and checked to prevent sound from playing again
  raptorAlreadyPlayed: false,
};

sfx.raptorSounds = sfx.sounds.filter(
  x => x.title.startsWith('raptor')
);
sfx.raptorIdArr = sfx.raptorSounds.map((x) => {
  const id = x.title.split('-')[1];
  const arr = [];
  for (let i = 0; i < x.freqWeight; i++) arr.push(id);
  return arr;
}).flat();
