const estraverse = require("estraverse");

const codegen = require("escodegen");

const chalk = require("chalk");

class magicNumbers {
  static getAllDeltas() {
    return this.deltas;
  }

  static apply(ast) {
    return this.replace(ast);
  }

}

magicNumbers.v = "VAR_0";
magicNumbers.indx = 0;
magicNumbers.deltas = [];

magicNumbers.replace = function (ast) {
  var parents = [];
  var varFuncCall = this.getVarSuggestion;
  var lastVar;
  var deltas = this.deltas;
  result = estraverse.replace(ast, {
    enter: function (node, parent) {
      var v = undefined;

      if (node.type == "Program" || node.type == "BlockStatement" && parent != undefined && (parent.type == "FunctionDeclaration" || parent.type == "ArrowFunctionExpression")) {
        var p = {
          node: node,
          problems: []
        };
        parents.push(p);
      }

      if (parent && parent.type != "VariableDeclarator" && parent.type != "Property" && node.type == "Literal") {
        //console.log(parents))
        lastVar = varFuncCall();

        if (node.loc) {
          let delta = {
            start: node.loc.start.line,
            end: node.loc.end.line,
            description: "Magic numbers is a bad practice. You should always use constants instead of numbers in your code."
          };
          deltas.push(delta);
        }

        obj = {
          name: lastVar,
          value: node.value
        };
        parents[parents.length - 1].problems.push(obj);
        return {
          "type": "Identifier",
          "name": lastVar
        };
      }
    },
    leave: function (node, parent) {
      if (node.type == "Program" || node.type == "BlockStatement" && parent != undefined && (parent.type == "FunctionDeclaration" || parent.type == "ArrowFunctionExpression")) {
        var parentPop = parents.pop();
        parentPop.problems.reverse().forEach(function (problem) {
          var toAppend = {
            "type": "VariableDeclaration",
            "declarations": [{
              "type": "VariableDeclarator",
              "id": {
                "type": "Identifier",
                "name": problem.name
              },
              "init": {
                "type": "Literal",
                "value": problem.value,
                "raw": parseInt(problem.value)
              }
            }],
            "kind": "const" //console.log(parentPop)

          };
          node.body = [toAppend].concat(node.body);
        });
        return node;
      }
    }
  }); // console.log(result)
  // console.log(codegen.generate(result))

  return result;
};

magicNumbers.getVarSuggestion = function () {
  this.v = this.v.substring(0, this.v.length - 1) + this.indx.toString();
  this.indx++;
  return this.v;
}.bind(magicNumbers);

module.exports = magicNumbers;