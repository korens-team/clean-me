const estraverse = require("estraverse")

class SideEffectRule {
    static apply = (ast) => {
        const functions = getFunctionsWithParams(ast)
        const globals = getGlobalVariables(ast)
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
                    let varName = node.declarations[0].id.name
                    globals.push(varName)
                }
            }
        })

        return globals
    }

    getFunctionsWithParams = (ast) => {
        const functions = []
        estraverse.traverse(ast, {
            enter: (node, parent) => {
                if(node.type === "FunctionDeclaration") {
                    let params = node.params.map((p) => p.name)
                    let func = {
                        name: node.id.name,
                        params: params
                    }

                    functions.push(func)
                }
            }
        })

        return functions
    }
}

module.exports = SideEffectRule