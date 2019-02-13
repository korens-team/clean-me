const estraverse = require("estraverse")
const recast = require('recast')
const builders = recast.types.builders

const deltas = []
class SideEffectRule {
    static apply(ast) {
        const functions = this.getFunctionsWithParams(ast)
        const problematicFunctions = this.getProblematicFunctions(ast, functions)
        const problematicFunctionsNames = problematicFunctions.map((p) => p.name)

        const newAst = estraverse.replace(ast, {
            enter: (node, parent) => {
                let nodeToReplaceFunction
                let funcIndex
                if (node.type === "FunctionDeclaration") {
                    funcIndex = problematicFunctionsNames.indexOf(node.id.name)
                    if (funcIndex !== -1) {
                        const func = problematicFunctions[funcIndex]
                        nodeToReplaceFunction = this.replaceParamAssigment(func) 
                        return nodeToReplaceFunction
                    }                    
                } else if (node.type === "ExpressionStatement" && node.expression.type === "CallExpression") {
                    const funcCallName = node.expression.callee.name
                    funcIndex = problematicFunctionsNames.indexOf(funcCallName)
                    if (funcIndex !== -1) {
                        const func = problematicFunctions[funcIndex]
                        nodeToReplaceFunction = this.replaceFunctionCall(func, node)
                        return nodeToReplaceFunction
                    }
                }
            }
        })

        return newAst
    }

    static getAllDeltas() {
        return deltas
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
    let params = []
    estraverse.traverse(functionNode, {
        enter: (node) => {            
            if(node.type && node.expression && node.expression.left &&
                node.type === "ExpressionStatement" &&
                node.expression.type === "AssignmentExpression" &&
                func.params.includes(node.expression.left.name)) {

                params.push(/*{
                    name: node.expression.left.name,
                    value: node.expression.right.value,
                    type: node.expression.right.type
                }*/node.expression)

                deltas.push({
                    start: node.loc.start.line,
                    end: node.loc.end.line,
                    description: "Variable is assigned but is a parameter of a function"
                })
            }
        }
    })
    
    return params
}

SideEffectRule.replaceParamAssigment = function(func) {
    const paramsLength = func.problems.length
    let didReplaceMultiple = false
    const newAst = estraverse.replace(func.node, {
        enter: (node) => {
            let nodeToReplaceExpression
            if(node.type && node.expression &&
               node.type === "ExpressionStatement" &&
               node.expression.type === "AssignmentExpression") {

                const paramIndex = func.problems.map((p) => p.left.name).indexOf(node.expression.left.name)
                if (paramIndex !== -1) {
                    if (paramsLength == 1) {
                        const param = func.problems[paramIndex]
                        nodeToReplaceExpression = {
                            "type": "ReturnStatement",
                            "argument": param.right
                        }

                        return nodeToReplaceExpression
                    }     
                }
            }

            if (paramsLength > 1 && !didReplaceMultiple) {
                body = this.replaceMultipleParamAssignment(func)       
                nodeToReplaceExpression = node
                nodeToReplaceExpression.body.body = [body]
                didReplaceMultiple = true
                return nodeToReplaceExpression
            }
        }
    })

    return newAst
}

SideEffectRule.replaceFunctionCall = function(func, node) {
    const funcName = func.name
    const paramsLength = func.problems.length
    
    nodeToReplace = (paramsLength === 1) 
        ? this.generateSingleParamFunctionCall(func, node)
        : this.generateMultipleParamsFunctionCall(func, node)

    return nodeToReplace
}

SideEffectRule.replaceMultipleParamAssignment = function(func) {
    let nodeToReplace = {
        "type": "ReturnStatement",
        "argument": {
            "type": "ObjectExpression",
            "properties": [
                
            ]
        }
    }
        
    func.problems.forEach((param) => {
        let paramNode = {
            "type": "Property",
            "key": {
                "type": "Identifier",
                "name": param.name
            },
            "computed": false,
            "value": {
                "type": param.type,
                "value": param.value,
                "raw": param.value
            },
            "kind": "init",
            "method": false,
            "shorthand": false
        }

        nodeToReplace.argument.properties.push(paramNode)
    })

    return nodeToReplace
}

SideEffectRule.generateSingleParamFunctionCall = function(func, node) {
    const funcName = func.name
    const paramName = func.problems[0]
    
    const nodeToReplace = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": paramName.left.name
            },
            "right": node.expression
        }
    }

    return nodeToReplace
}

SideEffectRule.generateMultipleParamsFunctionCall = function(func, node) {
    const funcName = func.name
    const nodeToReplace = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "ObjectPattern",
                "properties": [

                ]
            },
            "right": node.expression
        }
    }

    func.problems.forEach((param) => {
        let paramNode = {
            "type": "Property",
            "key": {
                "type": "Identifier",
                "name": param
            },
            "computed": false,
            "value": {
                "type": "Identifier",
                "name": param
            },
            "kind": "init",
            "method": false,
            "shorthand": true
        }

        nodeToReplace.expression.left.properties.push(paramNode)
    })

    return nodeToReplace
}

module.exports = SideEffectRule