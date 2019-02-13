#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const path = require('path'); 
const fs =  require('fs'); 

const rulesEnum = require('./rulesEnum')

const init = () => {
    console.log(
      chalk.green(
        figlet.textSync("CleanMe", {
          font: "Ghost",
          horizontalLayout: "default",
          verticalLayout: "default"
        })
      )
    );
  }
  

const run = () => {
    init();

    process.argv.forEach(function (val, index, array) {
        if(val == '-f'){
            const filePath = process.argv[index + 1];
            if(filePath){
                if (fs.existsSync(filePath)) { 
                    
                } else{
                    console.error("missing file input");
                }
            }
        } else {
          switch(val) {
            case(rulesEnum.namingConventions): {
              console.log('haa')
            }
          }
        }
      });
  };
  
  run();