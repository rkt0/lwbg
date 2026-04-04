'use strict';

function y() {
  console.log('Yep');
}

function n() {
  console.log('Nope');
}

global.y = y;
global.n = n;



const q = {};
q.w = () => console.log(0);
q.e = () => console.log(1);

global.q = q;
