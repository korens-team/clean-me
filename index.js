#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const path = require('path'); 
const fs =  require('fs'); 
const runner = require("./runner.js")
const esprima = require("esprima")

const rulesEnum = require('./rulesEnum')
const noFlagArgs = require('./rules/noFlagArgs')
const sideEffects = require('./rules/sideEffects')
const namingConvensions = require('./rules/namingConvensions')

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
                ast = esprima.parse(filePath)
              } else{
                console.error("missing file input");
              }
            }
        } else {
          switch(val) {
            case(rulesEnum.namingConventions): {
                namingConvensions.apply(ast)
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
          }
        }
      });
  };
  
  run();