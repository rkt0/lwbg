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
    this.play(this.trexSound.roar);
  },
  trexStomp() {
    this.play(this.trexSound.stomp);
  },
  raptor() {
    const {element} = this;
    if (element.src && !element.ended) return;
    const id = drawInteger(raptorWeights, prng.sfx);
    this.play(this.raptorSounds[id]);
  },
  trexSound: {
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
  soundFromTitle: {},
  play(sound) {
    if (!music.audioOn) return;
    this.element.src = sound.src;
    this.element.play();
  },
};

const allSounds = [
  ...Object.values(sfx.trexSound),
  ...sfx.raptorSounds,
];
for (const sound of allSounds) {
  sfx.soundFromTitle[sound.title] = sound;
}
const raptorWeights =
  sfx.raptorSounds.map(sound => sound.freqWeight);
