const estraverse = require("estraverse")

const IfStatement_type = "IfStatement";
const LogicalExpression_type = "LogicalExpression";

class EncapsulateConditions {
    static apply(syntaxTree) {
        let logicStatementsArray = [];

        estraverse.traverse(syntaxTree, {
            enter: (node) => {
                if(node.type == IfStatement_type && node.test.type == LogicalExpression_type){
                    logicStatementsArray.push(node.test);
                }
            }
        });
    }
}

module.exports = EncapsulateConditions;