"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function abc() {
  return 'bla';
}

function abd() {}

function prms(num) {
  var ad = 4;
  ab();
  var a = ad();
  return new Promise(function (resolve, reject) {
    var ab = abc();

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
    var ab = abc();
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

function bla2() {
  return _bla.apply(this, arguments);
}

function _bla() {
  _bla = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.t0 = console;
            _context.next = 4;
            return prms(1);

          case 4:
            _context.t1 = _context.sent;

            _context.t0.log.call(_context.t0, _context.t1);

            _context.next = 11;
            break;

          case 8:
            _context.prev = 8;
            _context.t2 = _context["catch"](0);
            console.error(_context.t2);

          case 11:
            abd();

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 8]]);
  }));
  return _bla.apply(this, arguments);
}

module.exports = prms;