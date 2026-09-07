import {qjs, drawInteger} from './utility.js';
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
    const id = drawInteger(raptorWeights, prng.sfx);
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

const raptorWeights =
  sfx.raptorSounds.map(sound => sound.freqWeight);
