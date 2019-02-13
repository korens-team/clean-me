const fs = require('fs');
const esprima = require("esprima")
const codegen = require("escodegen")
const estraverse = require("estraverse")

run = () => {
    fs.readFile('example.js', 'utf8', (err, contents) => {
        const ast = esprima.parse(contents)
        const code = codegen.generate(ast)

        estraverse.traverse(ast, {
            enter: (node) => {
                console.log(node)
            }
        })
    })   
}

run();