const codegen = require("escodegen")
const estraverse = require("estraverse")

class noFlagArgs {
    static apply(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node, parent) => {
                console.log(node)
            }
        })    
    }


}

module.exports = noFlagArgs