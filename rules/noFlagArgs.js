const codegen = require("escodegen")
const estraverse = require("estraverse")
const recast = require('recast')
const b = recast.types.builders

class noFlagArgs {
    
    static apply(syntaxTree) {
        this.getAllFlaggedFunctions(syntaxTree)
        this.functions.forEach((f, index) =>{
            recast.visit(syntaxTree, 
                {
                    visitFunctionDeclaration: function (path) {
                        let currentNode = path.node
                        if (currentNode.loc.start.line === f.node.loc.start.line &&
                            currentNode.loc.start.column === f.node.loc.start.column) {                                
                                
                                const flaggedFunc = b.functionDeclaration({
                                    type: "Identifier",
                                    name: currentNode.id.name + f.flags[index].name
                                }, f.flags[index].flaggedPartParams, f.flags[index].flaggedPart)

                                const unflaggedFunc = b.functionDeclaration({
                                    type: "Identifier",
                                    name: currentNode.id.name
                                }, f.flags[index].unflaggedPartParams, f.flags[index].unflaggedPart)

                                path.insertBefore(flaggedFunc)
                                path.insertBefore(unflaggedFunc)
                                return false
                            }                        

                        this.traverse(path)
                    }
                })
        })
        console.log(recast.prettyPrint(syntaxTree).code)
    }

    static buildUnflaggedFunctionsFromFlaggedFunction(node) {

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
                                    name: subnode.test.name || subnode.test.argument.name,
                                    flaggedPart: subnode.consequent,
                                    unflaggedPart: subnode.alternate,
                                    flaggedPartParams: params.filter((par) => this.isVariableBeingUsedUnderNode(par.name, subnode.consequent)),
                                    unflaggedPartParams: params.filter((par) => this.isVariableBeingUsedUnderNode(par.name, subnode.alternate))
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