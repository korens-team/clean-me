const estraverse = require("estraverse")

class SideEffectRule {
    apply = (ast) => {
        const functions = []
        estraverse.traverse(ast, {
            enter: (node) => {

            }
        })
    }

    getGlobalVariables = (ast) => {
        const globals = []
        estraverse.traverse(ast, {
            enter: (node, parent) => {
                if(parent.type === "Program" && node.type === "VariableDeclaration") {
                    
                }
            }
        })
    }
}

module.exports = { 
    SideEffectRule: { 
        apply 
    } 
}