"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _estraverse = _interopRequireDefault(require("estraverse"));

var _recast = _interopRequireDefault(require("recast"));

var _types = require("./consts/types");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var b = _recast.default.types.builders;

var noFlagArgs =
/*#__PURE__*/
function () {
  function noFlagArgs() {
    _classCallCheck(this, noFlagArgs);
  }

  _createClass(noFlagArgs, null, [{
    key: "getDescription",
    value: function getDescription() {
      return "This function uses flag arguments and should be splitted. Flag arguments are considered as a bad practice";
    }
  }, {
    key: "apply",
    value: function apply(syntaxTree) {
      this.getAllFlaggedFunctions(syntaxTree);
      this.functions.forEach(function (f) {
        _recast.default.visit(syntaxTree, {
          visitFunctionDeclaration: function visitFunctionDeclaration(path) {
            var currentNode = path.node;

            if (currentNode.loc && currentNode.loc.start.line === f.node.loc.start.line && currentNode.loc.start.column === f.node.loc.start.column) {
              f.newFlaggedFuncName = f.node.id.name + f.flags[0].name;
              var flaggedFunc = b.functionDeclaration({
                type: _types.IDENTIFIER_TYPE,
                name: currentNode.id.name + f.flags[0].name
              }, f.flags[0].flaggedPartParams, f.flags[0].flaggedPart);
              f.newUnflaggedFuncName = f.node.id.name;
              var unflaggedFunc = b.functionDeclaration({
                type: _types.IDENTIFIER_TYPE,
                name: currentNode.id.name
              }, f.flags[0].unflaggedPartParams, f.flags[0].unflaggedPart);
              path.insertBefore(flaggedFunc);
              path.insertBefore(unflaggedFunc);
              return false;
            }

            this.traverse(path);
          }
        });

        syntaxTree = _estraverse.default.replace(syntaxTree, {
          enter: function enter(node) {
            if (node.type === _types.FUNCTION_DECLARATION_TYPE && f.node.id.name === node.id.name && node.loc !== null) {
              this.remove();
            }
          }
        });
      });
      this.replaceCalls(syntaxTree);
      return syntaxTree;
    }
  }, {
    key: "getAllDeltas",
    value: function getAllDeltas() {
      var _this = this;

      var currentDeltas = [];
      this.functions.forEach(function (func) {
        currentDeltas.push({
          start: func.node.loc.start.line,
          end: func.node.loc.end.line,
          description: _this.getDescription()
        });
      });
      return currentDeltas;
    }
  }, {
    key: "replaceCalls",
    value: function replaceCalls(syntaxTree) {
      this.functions.forEach(function (f) {
        syntaxTree = _estraverse.default.replace(syntaxTree, {
          enter: function enter(node) {
            if (node.loc && node.type === _types.CALL_EXPRESSION_TYPE && node.callee.name === f.node.id.name) {
              var newNode = {
                type: _types.IF_STATEMENT_TYPE,
                test: node.arguments[f.flags[0].index],
                consequent: {
                  type: _types.BLOCK_STATEMENT_TYPE,
                  body: [{
                    type: _types.EXPRESSION_STATEMENT_TYPE,
                    expression: {
                      type: _types.CALL_EXPRESSION_TYPE,
                      callee: {
                        type: _types.IDENTIFIER_TYPE,
                        name: f.newFlaggedFuncName
                      },
                      arguments: node.arguments.filter(function (arg, index) {
                        return f.flags[0].flaggedPartOriginalParamsIndexes.includes(index);
                      })
                    }
                  }]
                },
                alternate: {
                  type: _types.BLOCK_STATEMENT_TYPE,
                  body: [{
                    type: _types.EXPRESSION_STATEMENT_TYPE,
                    expression: {
                      type: _types.CALL_EXPRESSION_TYPE,
                      callee: {
                        type: _types.IDENTIFIER_TYPE,
                        name: f.newUnflaggedFuncName
                      },
                      arguments: node.arguments.filter(function (arg, index) {
                        return f.flags[0].unflaggedPartOriginalParamsIndexes.includes(index);
                      })
                    }
                  }]
                }
              };
              return newNode;
            }
          }
        });
      });
    }
  }, {
    key: "getAllFlaggedFunctions",
    value: function getAllFlaggedFunctions(syntaxTree) {
      var _this2 = this;

      _estraverse.default.traverse(syntaxTree, {
        enter: function enter(node) {
          if (node.type === _types.FUNCTION_DECLARATION_TYPE) {
            var flags = _this2.findFlags(node);

            if (flags.length) {
              _this2.functions.push({
                node: node,
                flags: flags
              });
            }
          }
        }
      });
    }
  }, {
    key: "findFlags",
    value: function findFlags(node) {
      var _this3 = this;

      var flags = [];
      var params = node.params; // there is only if under the function declaration

      if (node.body.body.length <= 1) {
        _estraverse.default.traverse(node, {
          enter: function enter(subnode) {
            // Check if its a function with an if statement that only includes
            // the param in a check or unary check (!)
            if (node.body.body.length <= 1 && (subnode.type === _types.IF_STATEMENT_TYPE && subnode.test.type === _types.IDENTIFIER_TYPE && params.find(function (param) {
              return param.name === subnode.test.name;
            }) || subnode.type === _types.IF_STATEMENT_TYPE && subnode.test.type === _types.UNARY_EXPRESSION_TYPE && subnode.test.argument.type === _types.IDENTIFIER_TYPE && params.find(function (param) {
              return param.name === subnode.test.argument.name;
            }))) {
              // Check if there is no other usage of this variable
              if (!_this3.isVariableBeingUsedUnderNode(subnode.test.name || subnode.test.argument.name, subnode.consequent)) {
                flags.push({
                  index: params.findIndex(function (p) {
                    return p.name === (subnode.test.name || subnode.test.argument.name);
                  }),
                  name: subnode.test.name || subnode.test.argument.name,
                  flaggedPart: subnode.consequent,
                  unflaggedPart: subnode.alternate,
                  flaggedPartParams: params.filter(function (par) {
                    return _this3.isVariableBeingUsedUnderNode(par.name, subnode.consequent);
                  }),
                  unflaggedPartParams: params.filter(function (par) {
                    return _this3.isVariableBeingUsedUnderNode(par.name, subnode.alternate);
                  }),
                  flaggedPartOriginalParamsIndexes: params.map(function (par, index) {
                    if (_this3.isVariableBeingUsedUnderNode(par.name, subnode.consequent)) {
                      return index;
                    }
                  }),
                  unflaggedPartOriginalParamsIndexes: params.map(function (par, index) {
                    if (_this3.isVariableBeingUsedUnderNode(par.name, subnode.alternate)) {
                      return index;
                    }
                  })
                });
                _estraverse.default.VisitorOption.Break;
              }
            }
          }
        });
      }

      return flags;
    }
  }, {
    key: "isVariableBeingUsedUnderNode",
    value: function isVariableBeingUsedUnderNode(variableName, node) {
      // return JSON.stringify(node).includes(`"name":"${variable}"`)
      var isVarUnderNode = false;

      _estraverse.default.traverse(node, {
        enter: function enter(subnode) {
          if (subnode.type === _types.IDENTIFIER_TYPE && subnode.name === variableName) {
            isVarUnderNode = true;
            _estraverse.default.VisitorOption.Break;
          }
        }
      });

      return isVarUnderNode;
    }
  }]);

  return noFlagArgs;
}();

exports.default = noFlagArgs;
noFlagArgs.functions = [];