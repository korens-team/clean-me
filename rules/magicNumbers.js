const estraverse = require("estraverse")

class magicNumbers {
    static apply(ast) {
        estraverse.traverse(ast, {
            enter: (node, parent) => {
                /*console.log("node: " + node.type)
                if(parent)console.log("parent: " + parent.type)*/
                if(parent && parent.type != "VariableDeclarator" && node.type == "Literal"){
                    console.log(node)
                }
            }
        })    
    }


}

module.exports = magicNumbers