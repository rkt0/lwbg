'use strict';

require('./test-sub.js');

y();
n();

q.w();
q.e();

global.r = 6;
console.log(`r = ${r}`);
console.log(`global.r = ${global.r}`);
r = 3;
console.log(`r = ${r}`);
console.log(`global.r = ${global.r}`);

const t = 36;
global.t = 64;
console.log(`t = ${t}`);
console.log(`global.t = ${global.t}`);

global.u = 'abc';
let u = 'def';
u = 'ghi';
console.log(`global.u = ${global.u}`);
console.log(`u = ${u}`);
