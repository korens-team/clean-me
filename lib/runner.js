#!/usr/bin/env node
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var inquirer = require("inquirer");

var chalk = require("chalk");

var figlet = require("figlet");

var fs = require('fs');

var esprima = require("esprima");

var codegen = require("escodegen");

var rulesEnum = require('./rulesEnum');

var noFlagArgs = require('./rules/noFlagArgs');

var sideEffects = require('./rules/sideEffects');

var noPromiseRule = require('./rules/noPromise');

var namingConventions = require('./rules/namingConventions');

var magicNumbers = require('./rules/magicNumbers');

var encapsulateConditions = require('./rules/encapsulateConditions');

var deltas = [];
var afterCode = "";

var init = function init() {
  console.log(chalk.green(figlet.textSync("CleanMe", {
    font: "",
    horizontalLayout: "default",
    verticalLayout: "default"
  })));
};

var run = function run(filePath, options) {
  init();
  var ast;
  var code;

  if (filePath) {
    if (fs.existsSync(filePath)) {
      code = fs.readFileSync(filePath, 'utf-8');
      ast = esprima.parse(code, {
        raw: true,
        loc: true,
        range: true,
        comment: true,
        tokens: true
      });
    } else {
      console.error("missing file input");
    }
  }

  options.forEach(function (option) {
    switch (option) {
      case rulesEnum.noMagicNumbers:
        {
          ast = magicNumbers.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(magicNumbers.getAllDeltas()));
          break;
        }

      case rulesEnum.namingConventions:
        {
          ast = namingConventions.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(namingConventions.getAllDeltas()));
          break;
        }

      case rulesEnum.noFlagArgs:
        {
          ast = noFlagArgs.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(noFlagArgs.getAllDeltas()));
          break;
        }

      case rulesEnum.noSideEffects:
        {
          ast = sideEffects.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(sideEffects.getAllDeltas()));
          break;
        }

      case rulesEnum.noPromise:
        {
          ast = noPromiseRule.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(noPromiseRule.getAllDeltas()));
          break;
        }

      case rulesEnum.encapsulateConditions:
        {
          ast = encapsulateConditions.apply(ast);
          deltas.push.apply(deltas, _toConsumableArray(encapsulateConditions.getAllDeltas()));
          break;
        }
    }
  });
  afterCode = codegen.generate(ast, {
    /*format: {
       preserveBlankLines: true
     },
     //comment: true,
     sourceCode: code*/
  });
  fs.writeFile("after-file.js", afterCode, function (err) {
    if (err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });
};

var getDeltas = function getDeltas() {
  return deltas;
};

var getAfterCode = function getAfterCode() {
  return afterCode;
};

module.exports = {
  run: run,
  getDeltas: getDeltas,
  getAfterCode: getAfterCode
};