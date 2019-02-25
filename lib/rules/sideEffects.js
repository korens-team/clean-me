"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var estraverse = require("estraverse");

var recast = require('recast');

var builders = recast.types.builders;
var deltas = [];

var SideEffectRule =
/*#__PURE__*/
function () {
  function SideEffectRule() {
    _classCallCheck(this, SideEffectRule);
  }

  _createClass(SideEffectRule, null, [{
    key: "apply",
    value: function apply(ast) {
      var _this = this;

      var functions = this.getFunctionsWithParams(ast);
      var problematicFunctions = this.getProblematicFunctions(ast, functions);
      var problematicFunctionsNames = problematicFunctions.map(function (p) {
        return p.name;
      });
      var newAst = estraverse.replace(ast, {
        enter: function enter(node, parent) {
          var nodeToReplaceFunction;
          var funcIndex;

          if (node.type === "FunctionDeclaration") {
            funcIndex = problematicFunctionsNames.indexOf(node.id.name);

            if (funcIndex !== -1) {
              var func = problematicFunctions[funcIndex];
              nodeToReplaceFunction = _this.replaceParamAssigment(func);
              return nodeToReplaceFunction;
            }
          } else if (node.type === "ExpressionStatement" && node.expression.type === "CallExpression") {
            var funcCallName = node.expression.callee.name;
            funcIndex = problematicFunctionsNames.indexOf(funcCallName);

            if (funcIndex !== -1) {
              var _func = problematicFunctions[funcIndex];
              nodeToReplaceFunction = _this.replaceFunctionCall(_func, node);
              return nodeToReplaceFunction;
            }
          }
        }
      });
      return newAst;
    }
  }, {
    key: "getAllDeltas",
    value: function getAllDeltas() {
      return deltas;
    }
  }]);

  return SideEffectRule;
}();

SideEffectRule.getFunctionsWithParams = function (ast) {
  var functions = [];
  estraverse.traverse(ast, {
    enter: function enter(node) {
      if (node.type === "FunctionDeclaration") {
        var params = node.params.map(function (p) {
          return p.name;
        });
        var func = {
          name: node.id.name,
          params: params
        };
        functions.push(func);
      }
    }
  });
  return functions;
};

SideEffectRule.getProblematicFunctions = function (ast, functions) {
  var _this2 = this;

  var funcNames = functions.map(function (f) {
    return f.name;
  });
  var problematicFunctions = [];
  estraverse.traverse(ast, {
    enter: function enter(node) {
      if (node.type && node.type === "FunctionDeclaration") {
        var index = funcNames.indexOf(node.id.name);

        if (index !== -1) {
          var problematicParams = _this2.getProblematicParams(node, functions[index]);

          problematicFunctions.push({
            name: node.id.name,
            node: node,
            problems: problematicParams
          });
        }
      }
    }
  });
  return problematicFunctions;
};

SideEffectRule.getProblematicParams = function (functionNode, func) {
  var params = [];
  estraverse.traverse(functionNode, {
    enter: function enter(node) {
      if (node.type && node.expression && node.expression.left && node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression" && func.params.includes(node.expression.left.name)) {
        params.push(
        /*{
        name: node.expression.left.name,
        value: node.expression.right.value,
        type: node.expression.right.type
        }*/
        node.expression);
        deltas.push({
          start: node.loc.start.line,
          end: node.loc.end.line,
          description: "Variable is assigned but is a parameter of a function"
        });
      }
    }
  });
  return params;
};

SideEffectRule.replaceParamAssigment = function (func) {
  var paramsLength = func.problems.length;
  var didReplaceMultiple = false;
  var newAst = estraverse.replace(func.node, {
    enter: function enter(node) {
      var nodeToReplaceExpression;

      if (node.type && node.expression && node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression") {
        var paramIndex = func.problems.map(function (p) {
          return p.left.name;
        }).indexOf(node.expression.left.name);

        if (paramIndex !== -1) {
          if (paramsLength == 1) {
            var param = func.problems[paramIndex];
            nodeToReplaceExpression = {
              "type": "ReturnStatement",
              "argument": param.right
            };
            return nodeToReplaceExpression;
          }
        }
      }
      /*if (paramsLength > 1 && !didReplaceMultiple) {
          body = this.replaceMultipleParamAssignment(func)       
          nodeToReplaceExpression = node
          nodeToReplaceExpression.body.body = [body]
          didReplaceMultiple = true
          return nodeToReplaceExpression
      }*/

    }
  });
  return newAst;
};

SideEffectRule.replaceFunctionCall = function (func, node) {
  var funcName = func.name;
  var paramsLength = func.problems.length;
  nodeToReplace = paramsLength === 1 ? this.generateSingleParamFunctionCall(func, node) : node; //: this.generateMultipleParamsFunctionCall(func, node)

  if (paramsLength === 1) {
    this.generateSingleParamFunctionCall(func, node);
  }

  return nodeToReplace;
};

SideEffectRule.replaceMultipleParamAssignment = function (func) {
  var nodeToReplace = {
    "type": "ReturnStatement",
    "argument": {
      "type": "ObjectExpression",
      "properties": []
    }
  };
  func.problems.forEach(function (param) {
    var paramNode = {
      "type": "Property",
      "key": {
        "type": "Identifier",
        "name": param.name
      },
      "computed": false,
      "value": {
        "type": param.type,
        "value": param.value,
        "raw": param.value
      },
      "kind": "init",
      "method": false,
      "shorthand": false
    };
    nodeToReplace.argument.properties.push(paramNode);
  });
  return nodeToReplace;
};

SideEffectRule.generateSingleParamFunctionCall = function (func, node) {
  var funcName = func.name;
  var paramName = func.problems[0];
  var nodeToReplace = {
    "type": "ExpressionStatement",
    "expression": {
      "type": "AssignmentExpression",
      "operator": "=",
      "left": {
        "type": "Identifier",
        "name": paramName.left.name
      },
      "right": node.expression
    }
  };
  return nodeToReplace;
};

SideEffectRule.generateMultipleParamsFunctionCall = function (func, node) {
  var funcName = func.name;
  var nodeToReplace = {
    "type": "ExpressionStatement",
    "expression": {
      "type": "AssignmentExpression",
      "operator": "=",
      "left": {
        "type": "ObjectPattern",
        "properties": []
      },
      "right": node.expression
    }
  };
  func.problems.forEach(function (param) {
    var paramNode = {
      "type": "Property",
      "key": {
        "type": "Identifier",
        "name": param
      },
      "computed": false,
      "value": {
        "type": "Identifier",
        "name": param
      },
      "kind": "init",
      "method": false,
      "shorthand": true
    };
    nodeToReplace.expression.left.properties.push(paramNode);
  });
  return nodeToReplace;
};

module.exports = SideEffectRule;