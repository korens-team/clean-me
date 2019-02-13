const estraverse = require("estraverse")
const recast = require('recast')
const builders = recast.types.builders

class SideEffectRule {
    static apply(ast) {
        const functions = this.getFunctionsWithParams(ast)

        //console.log("functions")
        //console.log(functions)
        //console.log(problematicFunctions)
        //console.log(problematicFunctions[1].problems)
        
        const isFunctionProblematic = this.isFunctionProblematic
        const problematicFunctions = this.getProblematicFunctions(ast, functions)
        const problematicFunctionsNames = problematicFunctions.map((p) => p.name)
        
        recast.visit(ast, {
            visitFunctionDeclaration: function(path) {
                let node = path.node

                if(isFunctionProblematic(problematicFunctionsNames, node)) {

                }

                this.traverse(path)
            }
        })
    }
}

SideEffectRule.getFunctionsWithParams = function(ast) {
    const functions = []
    estraverse.traverse(ast, {
        enter: (node) => {
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

SideEffectRule.getProblematicFunctions = function(ast, functions) {
    const funcNames = functions.map((f) => f.name)
    const problematicFunctions = []
    estraverse.traverse(ast, {
        enter: (node) => {
            if (node.type && node.type === "FunctionDeclaration") {
                const index = funcNames.indexOf(node.id.name) 
                if (index !== -1) {
                    let problematicParams = this.getProblematicParams(node, functions[index])                   

                    problematicFunctions.push({
                        name: node.id.name,
                        node: node,
                        problems: problematicParams
                    })                    
                }                   
            }
        }
    })

    return problematicFunctions
}

SideEffectRule.getProblematicParams = function(functionNode, func) {
    let problems = []
    let params = []
    estraverse.traverse(functionNode, {
        enter: (node) => {            
            if(node.type && node.expression && node.expression.left &&
               node.type === "ExpressionStatement" &&
               node.expression.type === "AssignmentExpression" &&
               func.params.includes(node.expression.left.name)) {

                let problem = node.expression.left.name + 
                              " is assigned but is a parameter in the function\n"

                problems.push(problem)

                params.push({
                    name: node.expression.left.name,
                    value: node.expression.right.value
                })
            }
        }
    })
    //console.log(problems)
    return params
}

SideEffectRule.isFunctionProblematic = function(arrProblematicFunctionName, functionNode) {
    return (arrProblematicFunctionName.includes(functionNode.id.name))
}

module.exports = SideEffectRule