const estraverse = require("estraverse")

const VariableDeclaration_type = "VariableDeclaration";
const VariableDeclarator_type = "VariableDeclarator";

class NamingConvensions {
    static apply(syntaxTree) {

        let declerationsArray = [];
        let index = 0;

        estraverse.traverse(syntaxTree, {
            enter: (node) => {
                if(node.type == VariableDeclaration_type){
                    declerationsArray[index] = {
                        "kind": node.kind,
                        "row": node.loc.start.line   
                    };
                }
                if(node.type == VariableDeclarator_type){
                    declerationsArray[index].name = node.id.name;
                    index++;
                }
            }
        });

        console.log(declerationsArray);
    };
}

module.exports = NamingConvensions;