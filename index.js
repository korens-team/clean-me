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
const noPromiseRule = require('./rules/noPromise')

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
              console.log('korenkorenkoren')
            }
            case(rulesEnum.noFlagArgs): {
              noFlagArgs.apply(ast)
            }
            case(rulesEnum.noSideEffects): {
              sideEffects.apply(ast)
            }
            case(rulesEnum.noPromise): {
              noPromiseRule.apply(ast)
            }
          }
        }
      });
  };
  
  run();