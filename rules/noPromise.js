const estraverse = require("estraverse")

class NoPromiseRule {
    

    static apply(ast) {
        console.log(ast);
        estraverse.traverse(ast, {
            enter: (node, parent) => {
                if (node && node.type == 'NewExpression' &&
                node.callee && node.callee.name == 'Promise') {
                    
                    console.log('node:');
                    console.log(node);
                    console.log('body:');
                    console.log(node.arguments[0].body);
                    console.log('promise relevant data to extract:');
                    console.log(node.arguments[0].loc);
                }
            }
        })
    }
}

module.exports = NoPromiseRule