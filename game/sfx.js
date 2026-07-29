import {qjs, rollDie} from './utility.js';
import {prng} from './prngs.js';
import {music} from './music.js';

export const sfx = {
  trexRoar() {
    play(trexSounds.roar);
  },
  trexStomp() {
    play(trexSounds.stomp);
  },
  raptor() {
    if (element.src && !element.ended) return;
    const id = rollDie(raptorIds, prng.sfx);
    play(raptorSounds[id]);
  },
};

const element = qjs('sfx-player');
function play(sound) {
  if (!music.audioOn) return;
  element.src = sound.src;
  element.play();
};

class SoundEffect {
  constructor(title, freqWeight = 1) {
    this.src = `audio/sfx/${title}.mp3`;
    this.title = title;
    // freqWeight should be a positive integer
    this.freqWeight = freqWeight;
  }
}
const trexSounds = {
  roar: new SoundEffect('trex-roar'),
  stomp: new SoundEffect('trex-stomp'),
};
const raptorSounds = [
  new SoundEffect('raptor-0', 1),
  new SoundEffect('raptor-1', 2),
  new SoundEffect('raptor-2', 1),
  new SoundEffect('raptor-3', 2),
  new SoundEffect('raptor-4', 2),
  new SoundEffect('raptor-5', 2),
  new SoundEffect('raptor-6', 2),
];
const raptorIds = raptorSounds.flatMap((sound, i) => {
  return Array(sound.freqWeight).fill(i);
});
