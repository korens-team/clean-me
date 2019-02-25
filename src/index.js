#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import fs from "fs";
import codegen from "escodegen";
const esprima  = require("esprima");

import rulesEnum from "./rulesEnum";
import noFlagArgs from "./rules/noFlagArgs";
import sideEffects from "./rules/sideEffects";
import noPromiseRule from "./rules/noPromise";
import namingConventions from "./rules/namingConventions";
import magicNumbers from "./rules/magicNumbers";
import encapsulateConditions from "./rules/encapsulateConditions";

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("CleanMe", {
        font: "",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
};

const run = () => {
  init();
  let ast;
  let code;
  let deltas = [];
  let outputFilePath;

  process.argv.forEach(function(val, index) {
    if (val == "-f") {
      const filePath = process.argv[index + 1];
      if (filePath) {
        if (fs.existsSync(filePath)) {
          code = fs.readFileSync(filePath, "utf-8");
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
        case rulesEnum.noMagicNumbers:
          ast = magicNumbers.apply(ast);
          deltas.push(...magicNumbers.getAllDeltas());
          break;

        case rulesEnum.namingConventions:
          ast = namingConventions.apply(ast);
          deltas.push(...namingConventions.getAllDeltas());
          break;

        case rulesEnum.noFlagArgs:
          ast = noFlagArgs.apply(ast);
          deltas.push(...noFlagArgs.getAllDeltas());
          break;

        case rulesEnum.noSideEffects:
          ast = sideEffects.apply(ast);
          deltas.push(...sideEffects.getAllDeltas());
          break;

        case rulesEnum.noPromise:
          ast = noPromiseRule.apply(ast);
          deltas.push(...noPromiseRule.getAllDeltas());
          break;

        case rulesEnum.encapsulateConditions:
          ast = encapsulateConditions.apply(ast);
          deltas.push(...encapsulateConditions.getAllDeltas());
          break;
      }
    }
  });

  if (outputFilePath) {
    const afterCode = codegen.generate(ast);

    fs.writeFile(outputFilePath, afterCode, function(err) {
      if (err) {
        return console.log(err);
      }

      console.log("Output file generated.");
    });
  }

  console.log(
    chalk.red(
      deltas.reduce((newStr, str) => (newStr += JSON.stringify(str) + "\n"), "")
    )
  );
};

run();
