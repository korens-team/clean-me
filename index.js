#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const fs =  require('fs'); 
const esprima = require("esprima")

const rulesEnum = require('./rulesEnum')
const noFlagArgs = require('./rules/noFlagArgs')
const sideEffects = require('./rules/sideEffects')
const noPromiseRule = require('./rules/noPromise')
const namingConventions = require('./rules/namingConventions')
const magicNumbers = require('./rules/magicNumbers')

const init = () => {
    console.log(
      chalk.green(
        figlet.textSync("CleanMe", {
          font: "alligator",
          horizontalLayout: "default",
          verticalLayout: "default"
        })
      )
    );
  }
  

const run = () => {
    init();
    let ast
    process.argv.forEach(function (val, index, array) {
        if(val == '-f'){
            const filePath = process.argv[index + 1];
            if(filePath){
              if (fs.existsSync(filePath)) {                     
                ast = esprima.parse(fs.readFileSync(filePath, 'utf-8'), {loc: true})
              } else{
                console.error("missing file input");
              }
            }
        } else {
          switch(val) {
            case(rulesEnum.noMagicNumbers):{
              magicNumbers.apply(ast)
              break
            }
            case(rulesEnum.namingConventions): {
                namingConventions.apply(ast)
                break
            }
            case(rulesEnum.noFlagArgs): {
              noFlagArgs.apply(ast)
              break
            }
            case(rulesEnum.noSideEffects): {
              sideEffects.apply(ast)
              break
            }
            case(rulesEnum.noPromise): {
              noPromiseRule.apply(ast)
              break
            }
          }
        }
      });
  };
  
  run();