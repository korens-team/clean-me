const codegen = require("escodegen")
const estraverse = require("estraverse")

class noFlagArgs {
    
    static apply(syntaxTree) {
        this.getAllFunctions(syntaxTree)
        this.functions.forEach((f) => console.log(f.id.name)) 
        // estraverse.traverse(syntaxTree, {
        //     enter: (node, parent) => {
        //         console.log(node)
        //     }
        // })
    }

    static getAllFunctions(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node, parent) => {
                if (node.type == 'FunctionDeclaration') {
                    this.functions.push(node)
                }
            }
        })
    }
}

noFlagArgs.functions = []
module.exports = noFlagArgs