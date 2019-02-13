const estraverse = require("estraverse")

class magicNumbers {
    static apply(ast) {
        estraverse.traverse(ast, {
            enter: (node, parent) => {
                console.log(node)
            }
        })    
    }


}

module.exports = magicNumbers