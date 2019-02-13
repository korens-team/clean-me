const estraverse = require("estraverse")

class NoPromiseRule {
    static apply(ast) {
        estraverse.traverse(ast, {
            enter: (node) => {

            }
        })
    }
}

module.exports = NoPromiseRule