const codegen = require("escodegen")
const estraverse = require("estraverse")

class noFlagArgs {
    static functions = []
    static apply(syntaxTree) {
        getAllFunctions(syntaxTree)
        estraverse.traverse(syntaxTree, {
            enter: (node, parent) => {
                console.log(node)
            }
        })
    }

    static getAllFunctions(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node, parent) => {
                if (node.type == 'FunctionDeclaration') {
                    functions.push(node)
                }
            }
        })
    }
}

module.exports = noFlagArgs