const chalk = require("chalk");
const {run, getDeltas} = require('./runner');

run("examples/example.js", ["-namingConventions", "-noMagicNumbers"]);

console.log(getDeltas());