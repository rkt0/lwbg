'use strict';

const pieces = {
  human: {
    feature: {
      shoes: sequence(bd.nHumanPieces),
      pants: sequence(bd.nHumanPieces),
      skin:  sequence(bd.nHumanPieces),
      shirt: sequence(bd.nHumanPieces),
      hat:   sequence(bd.nHumanPieces),
      under: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
    },
    shadow: {
      hat: [
        'bc', 'bc', 'bc', 'bc', 'bc', 'bc',
        'cb', 'cb', 'cb', 'cb', 'cb', 'cb',
      ],
    },
  },
  raptor: {
    feature: {
      shape: sequence(bd.nRaptorPieces),
      color: sequence(bd.nRaptorPieces),
    },
  },
  removeImgs() {
    $('.human-component:not(.dead-marker)').remove();
    $('.raptor-component').remove();
    $('.trex-component').remove();
  },
  addAllHumanImgs() {
    const hFeature = this.human.feature;
    const hShadow = this.human.shadow;
    const hKeys = Object.keys(hFeature).sort();
    for (let h = 0; h < gs.humans.length; h++) {
      for (const k of hKeys) {
        const n = hFeature[k][h];
        const imgStr = `img/human/${k}/${k}-${n}.png`;
        $('<img>').attr('src', imgStr)
          .addClass(`human-component ${k}`)
          .appendTo(`#human-piece-${h}`);
        const shadowSpecifier = hShadow[k] ?
          `_${hShadow[k][n]}` : '';
        const shadowStr = 'img/human/shadow/' +
          `shadow-${k}${shadowSpecifier}.png`;
        $('<img>').attr('src', shadowStr)
          .addClass('human-component shadow')
          .appendTo(`#human-piece-${h}`);
      }
    }
  },
  addRaptorImgs(piece, shape, color) {
    const imgStr =
      `img/raptor/raptor-${shape}-${color}.png`;
    $('<img>').attr('src', imgStr)
      .addClass('raptor-component base')
      .appendTo(`#raptor-piece-${piece}`);
    const shadowStr =
      `img/raptor/shadow-raptor-${shape}.png`;
    $('<img>').attr('src', shadowStr)
      .addClass('raptor-component shadow')
      .appendTo(`#raptor-piece-${piece}`);
  },
  addAllRaptorImgs() {
    const prf = this.raptor.feature;
    const drp = debug.raptorPlacement;
    const nRaptorPieces = $('.raptor-piece').length;
    for (let r = 0; r < nRaptorPieces; r++) {
      const shape = drp.on ? drp.shape : prf.shape[r];
      const color = drp.on ? drp.color : prf.color[r];
      this.addRaptorImgs(r, shape, color);
    }
  },
  addTrexImgs() {
    $('<img>').attr('src', 'img/trex/trex.png')
      .addClass('trex-component base')
      .appendTo('#trex-piece');
    $('<img>').attr('src', 'img/trex/shadow-trex.png')
      .addClass('trex-component shadow')
      .appendTo('#trex-piece');
  },
  addImgs() {
    this.addAllHumanImgs();
    this.addAllRaptorImgs();
    this.addTrexImgs();
  },
  shuffleFeatures() {
    const hf = this.human.feature;
    for (const a of Object.keys(hf)) {
      hf[a] = shuffle(hf[a], prng.pieces);
    }
    const rf = this.raptor.feature;
    for (const a of Object.keys(rf)) {
      rf[a] = shuffle(rf[a], prng.pieces);
    }
  },
};

