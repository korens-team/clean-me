const estraverse = require("estraverse")

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

    static getContainingFunctionLocation(ast, noder) {
        let containingFunctionLocation

        function recursion(ast, nodeToSearch) {
            estraverse.traverse(ast, {
                enter: (node, parent) => {
                    if (node && nodeToSearch && node.loc == nodeToSearch.loc) {                
                        if (node.type === 'FunctionDeclaration') {
                            containingFunctionLocation = node.loc
                        } else {
                            recursion(ast, parent)
                        }
                    }
                }
            })
        }

        estraverse.traverse(ast, {
            enter: (node, parent) => {
                if (node && noder && node.loc == noder.loc) {                    
                    recursion(ast, parent)
                }
            }
        })

        return containingFunctionLocation
    }

    static getFunctionCallsLocationInPromise(noder) {
        let functionsLocArray = [];
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name !== 'resolve' &&
                    node.callee && node.callee.name !== 'reject') {
                        functionsLocArray.push(node.callee.loc);
                }
            }
        })

        return functionsLocArray;
    }

    static getResolveLoc(noder) {
        let resolveLoc;
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name === 'resolve') {
                    
                    resolveLoc = node.callee.loc; 
                }
            }
        })

        return resolveLoc;
    }

    static getRejectLoc(noder) {
        let rejectLoc;
        estraverse.traverse(noder, {
            enter: (node, parent) => {
                if (node && node.type === 'CallExpression' &&
                    node.callee && node.callee.name === 'reject') {
                
                    rejectLoc = node.callee.loc;
                }
            }
        })

        return rejectLoc;
    }

    static apply(ast) {
        
        /// variables

        // Promise creator
        let promiseNodes
        let promiseContainingFunctionLocation
        let promiseInnerBlockStatementNode
        let promiseFunctionCallsLocationInPromise
        let resolveLocation
        let rejectLocation

        // Array
        promiseNodes = this.getPromiseNodes(ast);

        // iterate through the array
        promiseNodes.forEach((promiseNode, index) => {
            
            console.log(`Going through promise #${index + 1}`);
            
            console.log();

            promiseContainingFunctionLocation = this.getContainingFunctionLocation(ast, promiseNode);
            console.log('Containing function location', promiseContainingFunctionLocation);

            console.log();
            
            promiseInnerBlockStatementNode = promiseNode.arguments[0].body;
            console.log('Inner block statement node', promiseInnerBlockStatementNode);

            console.log();

            // Array. type 'CallExpression' not resolve/reject
            promiseFunctionCallsLocationInPromise = this.getFunctionCallsLocationInPromise(promiseNode);
            console.log('Function calls location in the promise', promiseFunctionCallsLocationInPromise);

            console.log();

            // resolve location inside the promise declaration
            resolveLocation = this.getResolveLoc(promiseInnerBlockStatementNode);
            console.log('Resolve location', resolveLocation);

            console.log();

            // reject location inside the promise declaration
            rejectLocation = this.getRejectLoc(promiseInnerBlockStatementNode);
            console.log('Reject location', rejectLocation);
        });

        // Promise user
        let userContainingFunctionLocation
        let userFunctionToInvoke // the func invoked the promise. func name + args
        let userThenParamName
        let userInnerBlockStatementNode // the logic inside the then

    }
}

module.exports = NoPromiseRule