import {qjs, rollDie} from './utility.js';
import {prng} from './prngs.js';
import {music} from './music.js';

class SoundEffect {
  constructor(title, freqWeight = 1) {
    this.src = `audio/sfx/${title}.mp3`;
    this.title = title;
    // freqWeight should be a positive integer
    this.freqWeight = freqWeight;
  }
}

export const sfx = {
  element: qjs('sfx-player'),
  trexRoar() {
    play(this.trexSounds.roar);
  },
  trexStomp() {
    play(this.trexSounds.stomp);
  },
  raptor() {
    const {element} = this;
    if (element.src && !element.ended) return;
    const id = rollDie(raptorIds, prng.sfx);
    play(this.raptorSounds[id]);
  },
  trexSounds: {
    stomp: new SoundEffect('trex-stomp'),
    roar: new SoundEffect('trex-roar'),
  },
  raptorSounds: [
    new SoundEffect('raptor-0', 1),
    new SoundEffect('raptor-1', 2),
    new SoundEffect('raptor-2', 1),
    new SoundEffect('raptor-3', 2),
    new SoundEffect('raptor-4', 2),
    new SoundEffect('raptor-5', 2),
    new SoundEffect('raptor-6', 2),
  ],
};

function play(sound) {
  if (!music.audioOn) return;
  sfx.element.src = sound.src;
  sfx.element.play();
};

const raptorIds = sfx.raptorSounds.flatMap((s, i) => {
  return Array(s.freqWeight).fill(i);
});
