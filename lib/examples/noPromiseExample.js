function abc() {
  return 'bla';
}

function abd() {}

function prms(num) {
  var ad = 4;
  ab();
  var a = ad();
  return new Promise(function (resolve, reject) {
    const ab = abc();

    if (num == 1) {
      resolve('hey');
    } else {
      reject('error');
    }
  });
  var z = 9;
}

function prmsNew(num) {
  return new Promise(function (resolve, reject) {
    const ab = abc();
    abd();

    if (num == 1) {
      resolve('hey');
    } else {
      reject('error');
    }
  });
}

prms(1).then(function (value) {
  console.log(value);
});

function bla() {
  prms(1).then(function (value) {
    console.log(value);
  });
}

bla();

async function bla2() {
  try {
    console.log((await prms(1)));
  } catch (err) {
    console.error(err);
  }

  abd();
}

module.exports = prms;