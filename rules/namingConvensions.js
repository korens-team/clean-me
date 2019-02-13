const estraverse = require("estraverse")

class NamingConvensions {
    static apply(syntaxTree) {
        estraverse.traverse(syntaxTree, {
            enter: (node) => {
                console.log(node)
            }
        });
    };
}

module.exports = NamingConvensions;

