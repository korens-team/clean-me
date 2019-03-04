#!/usr/bin/env node

/* eslint-disable no-console */ 

import chalk from "chalk";
import figlet from "figlet";
import fs from "fs";
import codegen from "escodegen";
import { parse } from "esprima";

import {
  NAMING_CONVENTIONS,
  NO_FLAG_ARGS,
  NO_SIDE_EFFECTS,
  NO_MAGIC_NUMBERS,
  ENCAPSULATE_CONDITIONS
} from "./rules/consts/rulesEnum";
import noFlagArgs from "./rules/noFlagArgs";
import sideEffects from "./rules/sideEffects";
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
          ast = parse(code, {
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
        case NO_MAGIC_NUMBERS:
          ast = magicNumbers.apply(ast);
          deltas.push(...magicNumbers.getAllDeltas());
          break;

        case NAMING_CONVENTIONS:
          ast = namingConventions.apply(ast);
          deltas.push(...namingConventions.getAllDeltas());
          break;

        case NO_FLAG_ARGS:
          ast = noFlagArgs.apply(ast);
          deltas.push(...noFlagArgs.getAllDeltas());
          break;

        case NO_SIDE_EFFECTS:
          ast = sideEffects.apply(ast);
          deltas.push(...sideEffects.getAllDeltas());
          break;

        case ENCAPSULATE_CONDITIONS:
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
