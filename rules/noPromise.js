const estraverse = require("estraverse")
const codegen = require("escodegen")

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

    static getUsersNodes(noder) {
        let nodesToReturn = [];
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.property && node.callee.property.name === 'then') {
                    nodesToReturn.push(node);
                }
            }
        })

        return nodesToReturn
    }


    static ext(ast) {
        var lastNodefunc
        var ispromisefunc
        var indexOfPromiseBody
        var promiseBody
        var helperfunc = this.insertPromiseBodyToMainBody
        var result = estraverse.replace(ast, {
            enter: function (node, parent) {
                if(node.type === 'AwaitExpression') {
                    console.log(node);
                }
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
                        // console.log(indexOfPromiseBody);
                        // console.log(promiseBody);
                        node.body.body = helperfunc(node.body.body, indexOfPromiseBody, promiseBody)

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
        })

        //console.log(result);
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
        return this.ext(ast)
        let modifiedAst;

        /// Promise creator

        let promiseNodes
        let promiseContainingFunctionNode
        let promiseInnerBlockStatementNode
        let promiseFunctionCallsNodesInPromise
        let resolveNode
        let rejectNode

        let promiseCreatorArray = []
        let promiseCreatorArrayTemplate = {
            promiseContainingFunctionNode,
            promiseInnerBlockStatementNode,
            promiseFunctionCallsNodesInPromise,
            resolveNode,
            rejectNode,
        }

        // Array
        promiseNodes = this.getPromiseNodes(ast);

        // iterate through the array
        promiseNodes.forEach((promiseNode, index) => {

            console.log(`Going through promise #${index + 1}`);

            // console.log();

            promiseCreatorArrayTemplate.promiseContainingFunctionNode = this.getContainingFunctionNode(ast, promiseNode);

            //console.log(codegen.generate(promiseCreatorArrayTemplate.promiseContainingFunctionNode));
            // console.log('Containing function location', promiseContainingFunctionNode);

            // console.log();

            promiseCreatorArrayTemplate.promiseInnerBlockStatementNode = promiseNode.arguments[0].body;
            // console.log('Inner block statement node', promiseInnerBlockStatementNode);

            // console.log();

            // Array. type 'CallExpression' not resolve/reject
            promiseCreatorArrayTemplate.promiseFunctionCallsNodesInPromise = this.getFunctionCallsNodesInPromise(promiseNode);
            // console.log('Function calls location in the promise', promiseFunctionCallsLocationInPromise);

            // console.log();

            // resolve location inside the promise declaration
            promiseCreatorArrayTemplate.resolveNode = this.getResolveNode(promiseNode);
            //console.log('Resolve Node', promiseCreatorArrayTemplate.resolveNode);

            // console.log();

            // reject location inside the promise declaration
            promiseCreatorArrayTemplate.rejectNode = this.getRejectNode(promiseNode);
            // console.log('Reject location', rejectLocation);

            promiseCreatorArray[index] = promiseCreatorArrayTemplate

            // clean template
            promiseCreatorArrayTemplate = {
                promiseContainingFunctionNode,
                promiseInnerBlockStatementNode,
                promiseFunctionCallsNodesInPromise,
                resolveNode,
                rejectNode,
            }
        });

        //console.log(promiseCreatorArray);

        // promiseCreatorArray.forEach(promiseCreator => {
        //     estraverse.replace promiseCreator.promiseContainingFunctionNode
        // });

        /// Promise user

        let usersNodes // Array
        let userContainingFunctionNode
        let userFunctionToInvokeNode // the func invoked the promise. func name + args
        let userThenParamName
        let userInnerBlockStatementNode // the logic inside the then

        let promiseUserArray = []
        let promiseUserArrayTemplate = {
            userContainingFunctionNode,
            userFunctionToInvokeNode,
            userThenParamName,
            userInnerBlockStatementNode,
        }

        usersNodes = this.getUsersNodes(ast)

        usersNodes.forEach((usersNode, index) => {
            console.log(`Going through user #${index + 1}`);

            promiseUserArrayTemplate.userContainingFunctionNode = this.getContainingFunctionNode(ast, usersNode)
            //console.log(userContainingFunctionNode); // if undefined - global scope

            promiseUserArrayTemplate.userFunctionToInvokeNode = this.getUserFunctionToInvokeNode(usersNode)
            //console.log(userFunctionToInvokeNode);

            promiseUserArrayTemplate.userThenParamName = usersNode.arguments[0].params[0].name
            //console.log('then param name is:', userThenParamName);

            promiseUserArrayTemplate.userInnerBlockStatementNode = usersNode.arguments[0].body
            // console.log('user inner block statement node:', userInnerBlockStatementNode);

            promiseUserArray[index] = promiseUserArrayTemplate

            // clean template
            promiseUserArrayTemplate = {
                userContainingFunctionNode,
                userFunctionToInvokeNode,
                userThenParamName,
                userInnerBlockStatementNode,
            }
        });

        //console.log(promiseUserArray);



        return ast;
    }
}

module.exports = NoPromiseRule