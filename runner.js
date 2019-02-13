const fs = require('fs');
const esprima = require("esprima")
const codegen = require("escodegen")
const estraverse = require("estraverse")

const run = (filePath) => {
    const code = fs.readFileSync(filePath, 'utf8')

    const ast = esprima.parse(code)
    const afterCode = codegen.generate(ast)

    estraverse.traverse(ast, {
        enter: (node) => {
            console.log(node)
        }
    })    
}

const getAllTypes = (filePath) => {
    const code = fs.readFileSync(filePath, 'utf8')

    const ast = esprima.parse(code)
    const afterCode = codegen.generate(ast)

    const types = []
    estraverse.traverse(ast, {
        enter: (node) => {
            if (node.type && !types.includes(node.type)) {
                types.push(node.type)
            }
        }
    })    

    console.log(types)
}

module.exports = {
    run: run,
    getAllTypes: getAllTypes
}