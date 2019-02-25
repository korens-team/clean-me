"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var estraverse = require("estraverse");

var funcsNames = [];
var deltas = [];
var deltaDescEnum = {
  resolve: 'Using of resolve in promise. Return the value instead.',
  reject: 'Using of reject in promise. Throw an error instead.',
  async: 'Use async function instead of Promise and when invoking functions with the "await" keyword.',
  await: 'Use await <func name> when resolving async function.',
  then: 'Using "then" is old fashioned, we should prevent callback hells.'
};

var NoPromiseRule =
/*#__PURE__*/
function () {
  function NoPromiseRule() {
    _classCallCheck(this, NoPromiseRule);
  }

  _createClass(NoPromiseRule, null, [{
    key: "getAllDeltas",
    value: function getAllDeltas() {
      return deltas;
    }
  }, {
    key: "checkIfContainsAwait",
    value: function checkIfContainsAwait(noder) {
      var hasAwait = false;
      estraverse.traverse(noder, {
        enter: function enter(node, parent) {
          if (node.type === "AwaitExpression") {
            hasAwait = true;
            this.break();
          }
        }
      });
      return hasAwait;
    }
  }, {
    key: "addAsync",
    value: function addAsync(ast) {
      var _this = this;

      ast = estraverse.replace(ast, {
        enter: function enter(node, parent) {
          if (node.type === 'FunctionDeclaration' && _this.checkIfContainsAwait(node)) {
            node.async = true;
            deltas.push({
              start: node.loc.start.line,
              end: node.loc.end.line,
              description: deltaDescEnum.async
            });
          }
        }
      });
      return ast;
    }
  }, {
    key: "replaceThens",
    value: function replaceThens(noder) {
      noder = estraverse.replace(noder, {
        enter: function enter(node, parent) {
          if (node && node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee && node.expression.callee.property && node.expression.callee.property.name === 'then') {
            var _parent$body;

            var newVarDec = node.expression.arguments[0].params[0];
            var newLogicNode = node.expression.arguments[0].body.body;
            var varDevNode = {
              type: "VariableDeclaration",
              declarations: [{
                type: "VariableDeclarator",
                id: newVarDec,
                init: node.expression.callee.object
              }],
              kind: "const"
            };

            (_parent$body = parent.body).splice.apply(_parent$body, [parent.body.indexOf(node) + 1, 0].concat(_toConsumableArray(newLogicNode)));

            parent.body[parent.body.indexOf(node)] = varDevNode;
            deltas.push({
              start: node.loc.start.line,
              end: node.loc.end.line,
              description: deltaDescEnum.then
            });
          }
        }
      });
      return noder;
    }
  }, {
    key: "mainLogic",
    value: function mainLogic(ast) {
      // flags etc
      var lastNodefunc;
      var isPromiseFunc;
      var indexOfPromiseBody;
      var promiseBody; // functions

      var addAwaitToPromise = this.addAwaitToPromiseBody;
      var insrtPromiseBodyToMain = this.insertPromiseBodyToMainBody; // traverse and check conditions

      var result = estraverse.replace(ast, {
        enter: function enter(node, parent) {
          // get last node that is a function declaration
          if (node.type == 'FunctionDeclaration') {
            lastNodefunc = node;
          } // get the node that is a Promise declaration


          if (node.type == 'NewExpression' && node.callee.name == 'Promise') {
            isPromiseFunc = true; // index of promise body in the containing function body

            indexOfPromiseBody = lastNodefunc.body.body.indexOf(parent); // get the promise body                    

            promiseBody = node.arguments[0].body.body;
          } // handle 'resolve' situations, switch it to return statement
          else if (node && node.type === 'CallExpression' && node.callee && node.callee.name === 'resolve') {
              var returnStatement = {
                "type": "ReturnStatement",
                "argument": node.arguments[0]
              };
              deltas.push({
                start: node.loc.start.line,
                end: node.loc.end.line,
                description: deltaDescEnum.resolve
              });
              return returnStatement; // handle 'reject' situations, throw an error instead
            } else if (node && node.type === 'CallExpression' && node.callee && node.callee.name === 'reject') {
              var throwStatement = {
                "type": "ThrowStatement",
                "argument": {
                  "type": "NewExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "Error"
                  },
                  "arguments": node.arguments
                }
              };
              deltas.push({
                start: node.loc.start.line,
                end: node.loc.end.line,
                description: deltaDescEnum.reject
              });
              return throwStatement;
            }
        },
        leave: function leave(node, parent) {
          // check if the current node is the last function declaration node we saved
          if (JSON.stringify(node) == JSON.stringify(lastNodefunc)) {
            if (isPromiseFunc) {
              // change promise containing func to async
              node.async = true; // save the func name in order to check if should add await before invoking it

              if (node.id.name) {
                funcsNames.push(node.id.name);
              }

              promiseBody = addAwaitToPromise(promiseBody);
              node.body.body = insrtPromiseBodyToMain(node.body.body, indexOfPromiseBody, promiseBody); // back to init state

              isPromiseFunc = false;
              lastNodefunc = undefined;
              indexOfPromiseBody = undefined;
              promiseBody = undefined;
              deltas.push({
                start: node.loc.start.line,
                end: node.loc.end.line,
                description: deltaDescEnum.async
              });
              return node;
            }
          } // add await to promise function invokation


          if (node && node.type === 'CallExpression' && node.callee && node.callee.name !== 'resolve' && node.callee && node.callee.name !== 'reject' && node.callee.type !== 'MemberExpression' && parent.type !== 'AwaitExpression') {
            // if func name is in promise names list
            if (funcsNames.includes(node.callee.name)) {
              var awaitStatement = {
                "type": "AwaitExpression",
                "argument": {
                  "type": "CallExpression",
                  "callee": {
                    "type": node.callee.type,
                    "name": node.callee.name
                  },
                  "arguments": node.arguments
                }
              };
              deltas.push({
                start: node.loc.start.line,
                end: node.loc.end.line,
                description: deltaDescEnum.await
              });
              return awaitStatement;
            }
          }
        }
      });
      return result;
    }
  }, {
    key: "addAwaitToPromiseBody",
    value: function addAwaitToPromiseBody(promiseBody) {
      var result = [];
      promiseBody.forEach(function (element) {
        var obj = estraverse.replace(element, {
          enter: function enter(node, parent) {},
          leave: function leave(node, parent) {
            if (node.type == 'CallExpression') {
              var awaitStatement = {
                "type": "AwaitExpression",
                "argument": {
                  "type": "CallExpression",
                  "callee": {
                    "type": node.callee.type,
                    "name": node.callee.name
                  },
                  "arguments": node.arguments
                }
              };
              deltas.push({
                start: node.loc.start.line,
                end: node.loc.end.line,
                description: deltaDescEnum.await
              });
              return awaitStatement;
            }
          }
        });
        result.push(obj);
      });
      return result;
    }
  }, {
    key: "insertPromiseBodyToMainBody",
    value: function insertPromiseBodyToMainBody(body, index, promiseBody) {
      var result = [];

      for (var i = 0; i < index; i++) {
        result.push(body[i]);
      }

      promiseBody.forEach(function (element) {
        result.push(element);
      });

      for (var i = index + 1; i < body.length; i++) {
        result.push(body[i]);
      }

      return result;
    }
  }, {
    key: "apply",
    value: function apply(ast) {
      ast = this.mainLogic(ast);
      ast = this.replaceThens(ast);
      return this.addAsync(ast);
    }
  }]);

  return NoPromiseRule;
}();

module.exports = NoPromiseRule;