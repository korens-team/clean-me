const codegen = require("escodegen")
const estraverse = require("estraverse")

class noFlagArgs {
    static apply(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node, parent) => {
                console.log("a")
            }
        })    
    }


}

module.exports = noFlagArgs