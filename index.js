#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const path = require('path'); 
const fs =  require('fs'); 
const runner = require("./runner.js")

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

    process.argv.forEach(function (val, index, array) {
        if(val == '-f'){
            const filePath = process.argv[index + 1];
            if(filePath){
                if (fs.existsSync(filePath)) { 
                    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
                        if (!err) {
                            runner.run(filePath)
                        } else {
                            console.log(err);
                        }
                    });
                } else{
                    console.error("missing file input");
                }
            }
        }
      });
  };
  
  run();