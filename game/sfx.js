import {qjs, drawInteger} from './utility.js';
import {prng} from './prngs.js';
import {music} from './music.js';

class SoundEffect {
  constructor(key, freqWeight = 1) {
    this.src = `audio/sfx/${key}.mp3`;
    this.key = key;
    this.freqWeight = freqWeight;
  }
}

export const sfx = {
  element: qjs('sfx-player'),
  trexSounds: [
    new SoundEffect('trex-stomp'),
    new SoundEffect('trex-roar'),
  ],
  raptorSounds: [
    new SoundEffect('raptor-0', 1),
    new SoundEffect('raptor-1', 2),
    new SoundEffect('raptor-2', 1),
    new SoundEffect('raptor-3', 2),
    new SoundEffect('raptor-4', 2),
    new SoundEffect('raptor-5', 2),
    new SoundEffect('raptor-6', 2),
  ],
  play(soundKey) {
    if (!music.audioOn) return;
    this.element.src = sounds[soundKey].src;
    this.element.play();
  },
  raptor() {
    const {element} = this;
    if (element.src && !element.ended) return;
    const id = drawInteger(raptorWeights, prng.sfx);
    this.play(this.raptorSounds[id].key);
  },
};

const sounds = Object.fromEntries([
  ...sfx.trexSounds, ...sfx.raptorSounds,
].map(sound => [sound.key, sound]));
const raptorWeights =
  sfx.raptorSounds.map(sound => sound.freqWeight);
