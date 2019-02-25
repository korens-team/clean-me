#!/usr/bin/env node
"use strict";

var _chalk = _interopRequireDefault(require("chalk"));

var _figlet = _interopRequireDefault(require("figlet"));

var _fs = _interopRequireDefault(require("fs"));

var _escodegen = _interopRequireDefault(require("escodegen"));

var _rulesEnum = _interopRequireDefault(require("./rulesEnum"));

var _noFlagArgs = _interopRequireDefault(require("./rules/noFlagArgs"));

var _sideEffects = _interopRequireDefault(require("./rules/sideEffects"));

var _noPromise = _interopRequireDefault(require("./rules/noPromise"));

var _namingConventions = _interopRequireDefault(require("./rules/namingConventions"));

var _magicNumbers = _interopRequireDefault(require("./rules/magicNumbers"));

var _encapsulateConditions = _interopRequireDefault(require("./rules/encapsulateConditions"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var esprima = require("esprima");

var init = function init() {
  console.log(_chalk.default.green(_figlet.default.textSync("CleanMe", {
    font: "",
    horizontalLayout: "default",
    verticalLayout: "default"
  })));
};

var run = function run() {
  init();
  var ast;
  var code;
  var deltas = [];
  var outputFilePath;
  process.argv.forEach(function (val, index) {
    if (val == "-f") {
      var filePath = process.argv[index + 1];

      if (filePath) {
        if (_fs.default.existsSync(filePath)) {
          code = _fs.default.readFileSync(filePath, "utf-8");
          ast = esprima.parse(code, {
            raw: true,
            loc: true,
            range: true,
            comment: true,
            tokens: true
          });
        } else {
          console.error("missing file input");
          return;
        }
      }
    } else if (val == "-o") {
      outputFilePath = process.argv[index + 1];
    } else {
      switch (val) {
        case _rulesEnum.default.noMagicNumbers:
          ast = _magicNumbers.default.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(_magicNumbers.default.getAllDeltas()));
          break;

        case _rulesEnum.default.namingConventions:
          ast = _namingConventions.default.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(_namingConventions.default.getAllDeltas()));
          break;

        case _rulesEnum.default.noFlagArgs:
          ast = _noFlagArgs.default.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(_noFlagArgs.default.getAllDeltas()));
          break;

        case _rulesEnum.default.noSideEffects:
          ast = _sideEffects.default.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(_sideEffects.default.getAllDeltas()));
          break;

        case _rulesEnum.default.noPromise:
          ast = _noPromise.default.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(_noPromise.default.getAllDeltas()));
          break;

        case _rulesEnum.default.encapsulateConditions:
          ast = _encapsulateConditions.default.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(_encapsulateConditions.default.getAllDeltas()));
          break;
      }
    }
  });

  if (outputFilePath) {
    var afterCode = _escodegen.default.generate(ast);

    _fs.default.writeFile(outputFilePath, afterCode, function (err) {
      if (err) {
        return console.log(err);
      }

      console.log("Output file generated.");
    });
  }

  console.log(_chalk.default.red(deltas.reduce(function (newStr, str) {
    return newStr += JSON.stringify(str) + "\n";
  }, "")));
};

run();