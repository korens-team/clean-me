#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const fs =  require('fs'); 
const esprima = require("esprima")
const codegen = require("escodegen")

const rulesEnum = require('./rulesEnum')
const noFlagArgs = require('./rules/noFlagArgs')
const sideEffects = require('./rules/sideEffects')
const noPromiseRule = require('./rules/noPromise')
const namingConventions = require('./rules/namingConventions')
const magicNumbers = require('./rules/magicNumbers')
const encapsulateConditions = require('./rules/encapsulateConditions')

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
  }

const run = () => {
    init();
    let ast
    let code;
    let deltas = [];
    process.argv.forEach(function (val, index, array) {
        if(val == '-f'){
            const filePath = process.argv[index + 1];
            if(filePath){
              if (fs.existsSync(filePath)) {
                code = fs.readFileSync(filePath, 'utf-8');                     
                ast = esprima.parse(code, {
                  raw: true,
                  loc: true,
                  range: true,
                  comment: true,
                  tokens: true
                })
              } else{
                console.error("missing file input");
              }
            }
        } else {
          switch(val) {
            case(rulesEnum.noMagicNumbers):{
              ast = magicNumbers.apply(ast)
              deltas.push(magicNumbers.getAllDeltas())
              break
            }
            case(rulesEnum.namingConventions): {
                ast = namingConventions.apply(ast)
                deltas.push(namingConventions.getAllDeltas())
                break
            }
            case(rulesEnum.noFlagArgs): {
              ast = noFlagArgs.apply(ast)
              deltas.push(noFlagArgs.getAllDeltas())
              break
            }
            case(rulesEnum.noSideEffects): {
              ast = sideEffects.apply(ast)
              deltas.push(sideEffects.getAllDeltas())
              break
            }
            case(rulesEnum.noPromise): {
              ast = noPromiseRule.apply(ast)
              break
            }
            case(rulesEnum.encapsulateConditions):{
              ast = encapsulateConditions.apply(ast)
              deltas.push(encapsulateConditions.getAllDeltas())
              break
            }
          }
        }
      });
      
      const afterCode = codegen.generate(ast, {
       /*format: {
          preserveBlankLines: true
        },
        //comment: true,
        sourceCode: code*/
      });

      fs.writeFile("after-file.js", afterCode, function(err) {     
        if(err) {
          return console.log(err);
        }
        
        console.log(deltas)
        console.log(afterCode)
        console.log("The file was saved!");
      });
  };
  
  run();