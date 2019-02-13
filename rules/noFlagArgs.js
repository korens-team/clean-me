const codegen = require("escodegen")
const estraverse = require("estraverse")
const recast = require('recast')
const b = recast.types.builders

class noFlagArgs {
    
    static apply(syntaxTree) {
        this.getAllFlaggedFunctions(syntaxTree)
        this.functions.forEach((f) =>{            
            recast.visit(syntaxTree, 
                {
                    visitFunctionDeclaration: function (path) {
                        let currentNode = path.node
                        if (currentNode.loc && 
                            currentNode.loc.start.line === f.node.loc.start.line &&
                            currentNode.loc.start.column === f.node.loc.start.column) {
                                
                                f.newFlaggedFuncName = f.node.id.name + f.flags[0].name
                                const flaggedFunc = b.functionDeclaration({
                                    type: "Identifier",
                                    name: currentNode.id.name + f.flags[0].name
                                }, f.flags[0].flaggedPartParams, f.flags[0].flaggedPart)

                                f.newUnflaggedFuncName = f.node.id.name                                
                                const unflaggedFunc = b.functionDeclaration({
                                    type: "Identifier",
                                    name: currentNode.id.name
                                }, f.flags[0].unflaggedPartParams, f.flags[0].unflaggedPart)

                                path.insertBefore(flaggedFunc)
                                path.insertBefore(unflaggedFunc)                                
                                return false
                            }                        

                        this.traverse(path)
                    }
                })           

                syntaxTree = estraverse.replace(syntaxTree, {
                    enter: function (node) {
                        if (node.type === "FunctionDeclaration" &&
                        f.node.id.name === node.id.name &&
                        node.loc !== null) {
                            this.remove()
                        }
                    }
                })
        })
        
        this.replaceCalls(syntaxTree)

        console.log(recast.prettyPrint(syntaxTree).code)
        return syntaxTree 
    }
    
    static replaceCalls(syntaxTree) {
        this.functions.forEach((f) => {
            syntaxTree = estraverse.replace(syntaxTree, {
                enter: function(node) {
                    if (node.loc && node.type === 'CallExpression' && node.callee.name === f.node.id.name) {
                        let newNode = {
                            "type": "IfStatement",
                            "test": node.arguments[f.flags[0].index],
                            "consequent": {
                                "type": "BlockStatement",
                                "body": [{
                                    "type": "ExpressionStatement",
                                    "expression": {
                                        "type": "CallExpression",
                                        "callee": {
                                            "type": "Identifier",
                                            "name": f.newFlaggedFuncName
                                        },
                                        "arguments": node.arguments.filter((arg, index) => f.flags[0].flaggedPartOriginalParamsIndexes.includes(index))
                                    }
                                }]
                            },
                            "alternate": {
                                "type": "BlockStatement",
                                "body": [{
                                    "type": "ExpressionStatement",
                                    "expression": {
                                        "type": "CallExpression",
                                        "callee": {
                                            "type": "Identifier",
                                            "name": f.newUnflaggedFuncName
                                        },
                                        "arguments": node.arguments.filter((arg, index) => f.flags[0].unflaggedPartOriginalParamsIndexes.includes(index))
                                    }
                                }]
                            }
                        }

                        return newNode
                    }
                }
            })
        })
    }

    static getAllFlaggedFunctions(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node) => {
                if (node.type === "FunctionDeclaration") {
                    const flags = this.findFlags(node)
                    if (flags.length) {
                        this.functions.push({
                            node,
                            flags
                        })
                    }
                }
            }
        })
    }

    static findFlags(node) {
        let flags = []        
        let params = node.params

        // there is only if under the function declaration
        if (node.body.body.length <= 1) {
            estraverse.traverse(node, {
                enter: (subnode) => {
                    // Check if its a function with an if statement that only includes
                    // the param in a check or unary check (!)                    
                    if (node.body.body.length <= 1 &&
                        ((subnode.type === 'IfStatement' && 
                    subnode.test.type === 'Identifier' && 
                        params.find(param => param.name === subnode.test.name)) || (
                            subnode.type === 'IfStatement' &&
                            subnode.test.type === 'UnaryExpression' && 
                            subnode.test.argument.type === "Identifier" &&
                            params.find(param => param.name === subnode.test.argument.name)
                        ))) {
                            // Check if there is no other usage of this variable
                            if (!this.isVariableBeingUsedUnderNode(subnode.test.name || subnode.test.argument.name, subnode.consequent)) {
                                flags.push({
                                    index: params.findIndex((p) => p.name === (subnode.test.name || subnode.test.argument.name)),
                                    name: subnode.test.name || subnode.test.argument.name,
                                    flaggedPart: subnode.consequent,
                                    unflaggedPart: subnode.alternate,
                                    flaggedPartParams: params.filter((par) => this.isVariableBeingUsedUnderNode(par.name, subnode.consequent)),
                                    unflaggedPartParams: params.filter((par) => this.isVariableBeingUsedUnderNode(par.name, subnode.alternate)),
                                    flaggedPartOriginalParamsIndexes: params.map((par, index) => {if(this.isVariableBeingUsedUnderNode(par.name, subnode.consequent)){return index}}),
                                    unflaggedPartOriginalParamsIndexes: params.map((par, index) => {if(this.isVariableBeingUsedUnderNode(par.name, subnode.alternate)){return index}})
                                })
                                estraverse.VisitorOption.Break
                            }
                        }
                }
            })        
    }
        return flags
    
    }    

    static isVariableBeingUsedUnderNode(variableName, node) {
        // return JSON.stringify(node).includes(`"name":"${variable}"`)
        let isVarUnderNode = false
        estraverse.traverse(node, {
            enter: (subnode) => {
                if (subnode.type === "Identifier" && subnode.name === variableName) {
                    isVarUnderNode = true
                    estraverse.VisitorOption.Break
                }
            }
        })

        return isVarUnderNode
    }
}

noFlagArgs.functions = []

module.exports = noFlagArgs