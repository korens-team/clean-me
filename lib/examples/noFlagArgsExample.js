"use strict";

function a(aaa, bbb, ccc) {
  console.log(aaa);
  console.log(bbb);
  console.log(ccc);
}

function b(a, b, isTemporary) {
  if (isTemporary) {
    console.log(a);
  } else {
    console.log(b);
  }
}

function susu(a, b, c, d, isTemporary) {
  if (isTemporary) {
    console.log(a);
    console.log(c);
    console.log(d);
  } else {
    console.log(b);
  }
}

var temp = false;
susu(1, 2, 3, 4, temp);

function lala(isApple) {
  if (isApple) {
    console.log(isApple);
  }
}

function d(lol, isWhat) {
  console.log(lol + " " + isWhat);
}

bdika(1, 5, true, 8);

function bdika(a, b, isKoren, c) {
  if (isKoren) {
    console(a + b);
  } else {
    console(c + b);
  }
}