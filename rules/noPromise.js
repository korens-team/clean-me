const estraverse = require("estraverse")

class NoPromiseRule {
    static apply(ast) {
        estraverse.traverse(ast, {
            enter: (node, parent) => {
                if (node && node.name) {
                    console.log('node:');
                    console.log(node);
                }
            }
        })
    }
}

module.exports = NoPromiseRule