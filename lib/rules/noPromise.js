const estraverse = require("estraverse");

const funcsNames = [];
const deltas = [];
const deltaDescEnum = {
  resolve: 'Using of resolve in promise. Return the value instead.',
  reject: 'Using of reject in promise. Throw an error instead.',
  async: 'Use async function instead of Promise and when invoking functions with the "await" keyword.',
  await: 'Use await <func name> when resolving async function.',
  then: 'Using "then" is old fashioned, we should prevent callback hells.'
};

class NoPromiseRule {
  static getAllDeltas() {
    return deltas;
  }

  static checkIfContainsAwait(noder) {
    let hasAwait = false;
    estraverse.traverse(noder, {
      enter: function (node, parent) {
        if (node.type === "AwaitExpression") {
          hasAwait = true;
          this.break();
        }
      }
    });
    return hasAwait;
  }

  static addAsync(ast) {
    ast = estraverse.replace(ast, {
      enter: (node, parent) => {
        if (node.type === 'FunctionDeclaration' && this.checkIfContainsAwait(node)) {
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

  static replaceThens(noder) {
    noder = estraverse.replace(noder, {
      enter: (node, parent) => {
        if (node && node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee && node.expression.callee.property && node.expression.callee.property.name === 'then') {
          let newVarDec = node.expression.arguments[0].params[0];
          let newLogicNode = node.expression.arguments[0].body.body;
          let varDevNode = {
            type: "VariableDeclaration",
            declarations: [{
              type: "VariableDeclarator",
              id: newVarDec,
              init: node.expression.callee.object
            }],
            kind: "const"
          };
          parent.body.splice(parent.body.indexOf(node) + 1, 0, ...newLogicNode);
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

  static mainLogic(ast) {
    // flags etc
    var lastNodefunc;
    var isPromiseFunc;
    var indexOfPromiseBody;
    var promiseBody; // functions

    var addAwaitToPromise = this.addAwaitToPromiseBody;
    var insrtPromiseBodyToMain = this.insertPromiseBodyToMainBody; // traverse and check conditions

    var result = estraverse.replace(ast, {
      enter: function (node, parent) {
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
            let returnStatement = {
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
            let throwStatement = {
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
      leave: function (node, parent) {
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
            let awaitStatement = {
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

  static addAwaitToPromiseBody(promiseBody) {
    var result = [];
    promiseBody.forEach(element => {
      var obj = estraverse.replace(element, {
        enter: function (node, parent) {},
        leave: function (node, parent) {
          if (node.type == 'CallExpression') {
            let awaitStatement = {
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

  static insertPromiseBodyToMainBody(body, index, promiseBody) {
    var result = [];

    for (var i = 0; i < index; i++) {
      result.push(body[i]);
    }

    promiseBody.forEach(element => {
      result.push(element);
    });

    for (var i = index + 1; i < body.length; i++) {
      result.push(body[i]);
    }

    return result;
  }

  static apply(ast) {
    ast = this.mainLogic(ast);
    ast = this.replaceThens(ast);
    return this.addAsync(ast);
  }

}

module.exports = NoPromiseRule;