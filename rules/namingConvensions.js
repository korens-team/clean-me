const fs = require('fs');
const esprima = require("esprima")
const codegen = require("escodegen")
const estraverse = require("estraverse")

class NamingConvensions {
    static apply (syntaxTree) {
        const code = fs.readFileSync(filePath, 'utf8')
        
        const ast = esprima.parse(code)
        NamingConvensions.apply(ast)

        estraverse.traverse(ast, {
            enter: (node) => {
                console.log(node)
            }
        });
    };
}

module.exports = {NamingConvensions};

