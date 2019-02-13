const fs = require('fs');
const esprima = require("esprima")
const codegen = require("escodegen")
const estraverse = require("estraverse")

const run = (filePath) => {
    const a = 5
    const code = fs.readFileSync(filePath, 'utf8')

    const ast = esprima.parse(code)
    const afterCode = codegen.generate(ast)

    estraverse.traverse(ast, {
        enter: (node) => {
            console.log(node)
        }
    })    
}

module.exports.run = run