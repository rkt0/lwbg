'use strict';

function f0(x, y) {
  const u = x;
  const v = y;
  return u + v;
}

function f1(x, y) {
  const [u, v] = [x, y];
  return u + v;
}

function f2() {
  const u = 3;
  const v = 6;
  return u + v;
}

function f3() {
  const [u, v] = [3, 6];
  return u + v;
}

f0(2, 3);
f1(2, 3);
f2();
f3();
