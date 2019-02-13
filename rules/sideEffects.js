const estraverse = require("estraverse")

class SideEffectRule {
    static apply(ast) {
        const problems = []
        const functions = this.getFunctionsWithParams(ast)
        const globals = this.getGlobalVariables(ast)

        console.log("functions")
        console.log(functions)
        console.log("globals")
        console.log(globals)

        this.checkFunctionsProblems(ast, functions)
        this.checkGlobalVariablesProblems(ast, globals)
    }
}

SideEffectRule.getGlobalVariables = function(ast) {
    const globals = []
    estraverse.traverse(ast, {
        enter: (node, parent) => {
            if(parent && parent.type && node.type &&
               parent.type === "Program" && node.type === "VariableDeclaration") {
                let varName = node.declarations[0].id.name
                globals.push(varName)
            }
        }
    })

    return globals
}

SideEffectRule.getFunctionsWithParams = function(ast) {
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

SideEffectRule.checkFunctionsProblems = function(ast, functions) {
    const funcNames = functions.map((f) => f.name)
    estraverse.traverse(ast, {
        enter: (node, parent) => {
            if (node.type && node.type === "FunctionDeclaration") {
                const index = funcNames.indexOf(node) 
                if (index !== -1) {
                    let problems = this.checkNoSideEffectFunction(node, functions[index])
                    console.log("function: " + 
                                functions[index].name + 
                                " has these problems: " + 
                                problems)
                }                   
            }
        }
    })
}

SideEffectRule.checkNoSideEffectFunction = function(functionNode, func) {
    let problems = []
    estraverse.traverse(functionNode, {
        enter: (node, parent) => {
            if(node.type && node.expression && node.expression.left &&
               node.type === "ExpressionStatement" &&
               node.expression.type === "AssignmentExpression" &&
               func.params.includes(node.expression.left.name)) {

                let problem = "Var: " +
                              node.expression.left.name + 
                              " is assigned but is a parameter in the function: " + 
                              func.name

                problems.push(problem)
            }
        }
    })
    return problems
}

SideEffectRule.checkGlobalVariablesProblems = function(ast, globals) {
    
}

module.exports = SideEffectRule