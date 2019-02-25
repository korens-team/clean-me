"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _types = require("./consts/types");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var estraverse = require("estraverse");

var _ = require("lodash");

var CamelCase_Regex = /^[a-z]+([A-Z][a-z0-9]+)*$/;
var SnakeCase_Regex = /^[A-Z]+(\_[A-Z0-9]+)*/;
var codeErrors = [];

var NamingConventions =
/*#__PURE__*/
function () {
  function NamingConventions() {
    _classCallCheck(this, NamingConventions);
  }

  _createClass(NamingConventions, null, [{
    key: "apply",
    value: function apply(syntaxTree) {
      var declerationsArray = [];
      var index = 0;
      estraverse.traverse(syntaxTree, {
        enter: function enter(node, parent) {
          if (node.loc) {
            if (node.type == _types.VARIABLE_DECLARATION_TYPE) {
              declerationsArray[index] = {
                kind: node.kind,
                row: node.loc.start.line
              };
            }

            if (node.type == _types.VARIABLE_DECLARATION_TYPE && node.id && node.id.name) {
              declerationsArray[index].name = node.id.name;
              declerationsArray[index].valueType = node.init.type;
              declerationsArray[index].column = node.loc.start.column;
              index++;
            }

            if (node.type == _types.FUNCTION_DECLARATION_TYPE) {
              declerationsArray[index] = {
                name: node.id.name,
                row: node.loc.start.line,
                column: node.loc.start.column,
                kind: _types.FUNCTION_DECLARATION_TYPE
              };
              index++;
            }

            if (node.type == _types.IDENTIFIER_TYPE && parent.type != _types.VARIABLE_DECLARATION_TYPE && parent.type != _types.FUNCTION_DECLARATION_TYPE && parent.type != _types.NEW_EXPRESSION_TYPE) {
              declerationsArray[index] = {
                name: node.name,
                row: node.loc.start.line,
                column: node.loc.start.column,
                kind: _types.IDENTIFIER_TYPE
              };
              index++;
            }
          }
        }
      });
      declerationsArray.forEach(function (declerationObj) {
        if (!CamelCase_Regex.test(declerationObj.name)) {
          if (!(declerationObj.valueType == _types.LITERAL_TYPE && declerationObj.kind == "const" && SnakeCase_Regex.test(declerationObj.name))) {
            // console.log(chalk.red("Use camelCase for vars declerations, row: " + declerationObj.row + " value: " + declerationObj.name));
            declerationObj.newName = _.camelCase(declerationObj.name); // console.log("Use " + declerationObj.newName + " instead");

            codeErrors.push({
              start: declerationObj.row,
              end: declerationObj.row,
              description: "This name not stand for common naming convention, should be camelCase"
            });
          }
        }

        if (declerationObj.valueType == _types.LITERAL_TYPE && declerationObj.kind == "const" && !SnakeCase_Regex.test(declerationObj.name.toLowerCase())) {
          // console.log(chalk.red("use SNAKE_CASE for const numbers, row: " + declerationObj.row + " value: " + declerationObj.name));
          declerationObj.newName = _.snakeCase(declerationObj.name).toUpperCase(); // console.log("Use " + declerationObj.newName + " instead");

          codeErrors.push({
            start: declerationObj.row,
            end: declerationObj.row,
            description: "This name not stand for common naming convention, consts should be SNAKE_CASE"
          });
        }
      });
      var newTree = estraverse.replace(syntaxTree, {
        enter: function enter(node) {
          if (node.loc && (node.type == _types.VARIABLE_DECLARATION_TYPE || node.type == _types.FUNCTION_DECLARATION_TYPE)) {
            var newNode = declerationsArray.find(function (declerationObj) {
              return declerationObj.row == node.loc.start.line && declerationObj.column == node.loc.start.column;
            });

            if (newNode && newNode.newName) {
              node.id.name = newNode.newName;
              return node;
            }
          } else if (node.type == _types.IDENTIFIER_TYPE || node.type == _types.CALL_EXPRESSION_TYPE) {
            var _newNode = declerationsArray.find(function (declerationObj) {
              return declerationObj.name == node.name;
            });

            if (_newNode && _newNode.newName) {
              node.name = _newNode.newName;
              return node;
            }
          } else if (node.type == _types.CALL_EXPRESSION_TYPE) {
            var _newNode2 = declerationsArray.find(function (declerationObj) {
              return declerationObj.name == node.callee.name;
            });

            if (_newNode2 && _newNode2.newName) {
              node.callee.name = _newNode2.newName;
              return node;
            }
          }
        }
      });
      return newTree;
    }
  }, {
    key: "getAllDeltas",
    value: function getAllDeltas() {
      return codeErrors;
    }
  }]);

  return NamingConventions;
}();

exports.default = NamingConventions;