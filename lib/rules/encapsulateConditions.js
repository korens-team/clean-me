"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _estraverse = _interopRequireDefault(require("estraverse"));

var _lodash = _interopRequireDefault(require("lodash"));

var _types = require("./consts/types");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var operationsMap = {
  ">": "grater",
  "<": "smaller",
  "==": "equals",
  "===": "equals"
};
var codeErrors = [];

var EncapsulateConditions =
/*#__PURE__*/
function () {
  function EncapsulateConditions() {
    _classCallCheck(this, EncapsulateConditions);
  }

  _createClass(EncapsulateConditions, null, [{
    key: "apply",
    value: function apply(syntaxTree) {
      var _this = this;

      var logicStatementsArray = [];
      var logicVars = [];

      _estraverse.default.traverse(syntaxTree, {
        enter: function enter(node, parent) {
          if (node.type == _types.IF_STATEMENT_TYPE && node.test.type == _types.LOGICAL_EXPRESSION_TYPE) {
            var subNames = _this.getAllVarsInNodeNames(node.test);

            if (node.loc) {
              logicStatementsArray.push({
                testLogic: node.test,
                ifNode: node,
                ifParent: parent,
                subVarsNames: subNames
              });
            }
          }
        }
      });

      logicStatementsArray.forEach(function (logicStatment) {
        codeErrors.push({
          start: logicStatment.ifNode.loc.start.line,
          end: logicStatment.ifNode.loc.end.line,
          description: "Encapsulate complex if statments to const variable"
        });
        var toAppend = {
          type: "VariableDeclaration",
          declarations: [{
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: _lodash.default.camelCase("check_" + logicStatment.subVarsNames.join("_"))
            },
            init: logicStatment.testLogic
          }],
          kind: "const"
        };
        logicVars.push(toAppend);
      });

      var newTree = _estraverse.default.replace(syntaxTree, {
        enter: function enter(node, parent) {
          if (node.loc) {
            if (node.type == _types.IF_STATEMENT_TYPE && node.test.type == _types.LOGICAL_EXPRESSION_TYPE) {
              var statment = logicStatementsArray.find(function (logicStatmentNode) {
                return logicStatmentNode.ifNode.loc.start.line == node.loc.start.line && logicStatmentNode.ifNode.loc.start.column == node.loc.start.column;
              });

              if (statment) {
                var logic = logicVars.find(function (logicVar) {
                  return logicVar.declarations[0].init == statment.testLogic;
                });

                if (logic) {
                  node.test = {
                    type: "Identifier",
                    name: logic.declarations[0].id.name
                  };
                  parent.body.splice(parent.body.indexOf(node), 0, logic);
                }
              }
            }
          }
        }
      });

      return newTree;
    }
  }, {
    key: "getAllVarsInNodeNames",
    value: function getAllVarsInNodeNames(node) {
      var varsNames = [];

      _estraverse.default.traverse(node, {
        enter: function enter(subnode) {
          if (subnode.type == _types.IDENTIFIER_TYPE) {
            varsNames.push(subnode.name);
          }

          if (subnode.type == _types.BINARY_EXPRESSION_TYPE && subnode.operator) {
            varsNames.push(operationsMap[subnode.operator]);
          }

          if (subnode.type == _types.LITERAL_TYPE) {
            varsNames.push(subnode.value);
          }
        }
      });

      return varsNames;
    }
  }, {
    key: "getAllDeltas",
    value: function getAllDeltas() {
      return codeErrors;
    }
  }]);

  return EncapsulateConditions;
}();

exports.default = EncapsulateConditions;