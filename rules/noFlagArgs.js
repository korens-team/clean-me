const codegen = require("escodegen")
const estraverse = require("estraverse")

class noFlagArgs {
    
    static apply(syntaxTree) {
        this.getAllFlaggedFunctions(syntaxTree)
        this.functions.forEach((f) =>{
             console.log(f)
        })
        // estraverse.traverse(syntaxTree, {
        //     enter: (node, parent) => {
        //         console.log(node)
        //     }
        // })
    }

    static getAllFlaggedFunctions(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node) => {
                if (this.isFunctionWithFlag(node)) {
                    this.functions.push(node)
                }
            }
        })
    }

    static isFunctionWithFlag(node) {
        let isWithFlag = false
        if (node.type === 'FunctionDeclaration') {
            let params = node.params.map((param) => param.name)
            estraverse.traverse(node, {
                enter: (subnode) => {
                    // Check if its a function with an if statement that only includes
                    // the param in a check or unary check (!)
                    if ((subnode.type === 'IfStatement' && 
                    subnode.test.type === 'Identifier' && 
                        params.includes(subnode.test.name)) || (
                            subnode.type === 'IfStatement' &&
                            subnode.test.type === 'UnaryExpression' && 
                            subnode.test.argument.type === "Identifier" &&
                            params.includes(subnode.test.argument.name)
                        )) {
                            // Check if there is no other usage of this variable
                            if (!this.isVariableBeingUsedUnderNode(subnode.test.name || subnode.test.argument.name, subnode.consequent)) {
                                isWithFlag = true
                                console.log(subnode.test.name)
                                estraverse.VisitorOption.Break
                            }                            
                        }
                }
            })
        }

        return isWithFlag
    }

    static isVariableBeingUsedUnderNode(variable, node) {
        return JSON.stringify(node).includes(`"name":"${variable}"`)
    }
}

noFlagArgs.functions = []
module.exports = noFlagArgs