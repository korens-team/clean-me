const estraverse = require("estraverse")
const codegen = require("escodegen")

const funcsNames = []

class NoPromiseRule {

    static getPromiseNodes(noder) {
        let nodesToReturn = [];
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'NewExpression' &&
                    node.callee && node.callee.name === 'Promise') {
                    nodesToReturn.push(node);
                }
            }
        })

        return nodesToReturn
    }

    static replaceThens(noder) {        
        noder = estraverse.replace(noder, {
            enter: (node, parent) => {
                if (node && node.type=== 'ExpressionStatement' &&
                    node.expression.type === 'CallExpression' &&
                    node.expression.callee && node.expression.callee.property && node.expression.callee.property.name === 'then') {
                    let newVarDec = node.expression.arguments[0].params[0]
                    let newLogicNode = node.expression.arguments[0].body.body
                    
                    let varDevNode = {
                        type: "VariableDeclaration",
                        declarations: [
                            {
                                type: "VariableDeclarator",
                                id: newVarDec,
                                init: node.expression.callee.object
                            }                            
                        ],
                        kind: "const"
                    }
                    
                    parent.body.splice(parent.body.indexOf(node) + 1, 0, ...newLogicNode)                    
                    parent.body[parent.body.indexOf(node)] = varDevNode
                }                
            }
        })

        return noder
    }


    static ext(ast) {
        var lastNodefunc
        var ispromisefunc
        var indexOfPromiseBody
        var promiseBody
        var addAwaitToPromise = this.addAwaitToPromiseBody
        var insrtPromiseBodyToMain = this.insertPromiseBodyToMainBody
        var result = estraverse.replace(ast, {
            enter: function (node, parent) {
                // if(node.type === 'AwaitExpression') {
                //     console.log(node);
                // }
                // change promise containing func to async
                if (node.type == 'FunctionDeclaration') {
                    lastNodefunc = node
                }
                if (node.type == 'NewExpression' && node.callee.name == 'Promise') {
                    ispromisefunc = true
                    indexOfPromiseBody = lastNodefunc.body.body.indexOf(parent);
                    promiseBody = node.arguments[0].body.body
                }
                // resolve
                else if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name === 'resolve') {
                    let returnStatement = {
                        "type": "ReturnStatement",
                        "argument": {
                            "type": node.arguments[0].type,
                            "value": node.arguments[0].value,
                            "raw": node.arguments[0].raw
                        }
                    }

                    return returnStatement
                // reject
                } else if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name === 'reject') {
                    
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
                    }

                    return throwStatement 
                }
            },
            leave: function (node, parent) {
                if (JSON.stringify(node) == JSON.stringify(lastNodefunc)) {
                    if (ispromisefunc) {
                        // change promise containing func to async
                        node.async = true
                        if(node.id.name) {
                            funcsNames.push(node.id.name)
                        }
                        
                        // console.log(indexOfPromiseBody);
                        // console.log(promiseBody);
                        promiseBody = addAwaitToPromise(promiseBody)
                        node.body.body = insrtPromiseBodyToMain(node.body.body, indexOfPromiseBody, promiseBody)

                        ispromisefunc = false
                        lastNodefunc = undefined
                        indexOfPromiseBody = undefined
                        promiseBody = undefined

                        return node
                    }
                }
                // func calls in the promise, add await
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name !== 'resolve' &&
                    node.callee && node.callee.name !== 'reject' &&
                    node.callee.type !== 'MemberExpression' && parent.type !== 'AwaitExpression') {
                    
                    //console.log(parent);
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
                        }
                        // console.log(node.callee.type);
                        // console.log(node.callee.name);
                        // console.log(node.arguments);
                        return awaitStatement
                        //console.log(awaitStatement);
                    }            
                }    
            }
        })

        //console.log(result);
        return result
    }


    static addAwaitToPromiseBody(promiseBody) {
        var result = []
        promiseBody.forEach(element => {
            var obj = estraverse.replace(element, {
                enter: function(node, parent) {

                },
                leave: function(node, parent) {
                    if(node.type == 'CallExpression') {
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
                        }
                        return awaitStatement
                    }
                }
            })
            console.log(element);
            result.push(obj)
        });

        return result
    }

    static insertPromiseBodyToMainBody(body, index, promiseBody) {
        
        var result = []
        for (var i = 0; i < index; i++) {
            result.push(body[i])
        }

        promiseBody.forEach(element => {
            result.push(element)
        });

        for (var i = index + 1; i < body.length; i++){
            result.push(body[i])
        }
        
        return result;
    }

    static getContainingFunctionNode(ast, noder) {
        let containingFunctionLocation

        let result

        function recursion(ast, nodeToSearch) {
            let result2 = estraverse.replace(ast, {
                enter: (node, parent) => {
                    if (node && nodeToSearch && node.loc == nodeToSearch.loc) {
                        node.async = 'true'
                        return node
                    } else {
                        recursion(ast, parent)
                    }
                }
            })

            return result2
            // estraverse.traverse(ast, {
            //     enter: (node, parent) => {
            //         if (node && nodeToSearch && node.loc == nodeToSearch.loc) {                
            //             if (node.type === 'FunctionDeclaration') {
            //                 containingFunctionLocation = node
            //                 console.log('ASYNC', node.async);
            //             } else {
            //                 recursion(ast, parent)
            //             }
            //         }
            //     }
            // })
        }

        estraverse.traverse(ast, {
            enter: (node, parent) => {
                if (node && noder && node.loc == noder.loc) {
                    result = recursion(ast, parent)
                }
            }
        })
        return result
        //return containingFunctionLocation
    }

    static getFunctionCallsNodesInPromise(noder) {
        let functionsLocArray = [];
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name !== 'resolve' &&
                    node.callee && node.callee.name !== 'reject') {
                    functionsLocArray.push(node);
                }
            }
        })

        return functionsLocArray;
    }

    static getResolveNode(noder) {
        let resolveNode;
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name === 'resolve') {
                    resolveNode = node;
                }
            }
        })

        return resolveNode;
    }

    static getRejectNode(noder) {
        let rejectNode;
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name === 'reject') {

                    rejectNode = node;
                }
            }
        })

        return rejectNode;
    }

    static getUserFunctionToInvokeNode(noder) {
        let nodeToRet
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.object && node.callee.object.type === 'CallExpression') {

                    nodeToRet = node.callee.object
                }
            }
        })

        return nodeToRet;
    }

    static apply(ast) {
        ast = this.ext(ast)
        return this.replaceThens(ast)        
    }
}

module.exports = NoPromiseRule