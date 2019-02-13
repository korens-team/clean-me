const estraverse = require("estraverse")
const chalk = require("chalk");
const _ = require('lodash');

const VariableDeclaration_type = "VariableDeclaration";
const VariableDeclarator_type = "VariableDeclarator";
const Identifier_type = "Identifier";

const CamelCase_Regex = /^[a-z]+([A-Z][a-z0-9]+)*$/;
const SnakeCase_Regex = /^[A-Z]+(_[A-Z0-9]+)*/;

class NamingConventions {
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
                    declerationsArray[index].value = node.init.value;
                    declerationsArray[index].column = node.loc.start.column;
                    index++;
                }
            }
        });

        declerationsArray.forEach((declerationObj)=>{
            if(!CamelCase_Regex.test(declerationObj.name)){
                if(!(!isNaN(declerationObj.value) && declerationObj.kind == "const" && SnakeCase_Regex.test(declerationObj.name))){
                    console.log(chalk.red("Use camelCase for vars declerations, row: " + declerationObj.row + " value: " + declerationObj.name));
                    declerationObj.newName = _.camelCase(declerationObj.name);
                    console.log(declerationObj.newName);
                }
            }

            if(!isNaN(declerationObj.value) && declerationObj.kind == "const" && !SnakeCase_Regex.test(declerationObj.name)){
                console.log(chalk.red("use SNAKE_CASE for const numbers, row: " + declerationObj.row + " value: " + declerationObj.name));
                declerationObj.newName = _.snakeCase(declerationObj.name).toUpperCase();
                console.log(declerationObj.newName);
            }
        });

        const newTree = estraverse.replace(syntaxTree, {
            enter: (node) => {
                if(node.type == VariableDeclarator_type){
                    const newNode = declerationsArray.find((declerationObj) => {
                        return declerationObj.row == node.loc.start.line &&
                            declerationObj.column == node.loc.start.column;
                    });

                    if(newNode && newNode.newName){
                        node.id.name = newNode.newName;
                    
                        return node;
                    }
                } else {
                    if(node.type == Identifier_type){
                        const newNode = declerationsArray.find((declerationObj) => {
                            return declerationObj.name == node.name;
                        });

                        if(newNode && newNode.newName){
                            node.name = newNode.newName;
                            
                            return node;
                        }
                    }
                }
            }
        });

        return newTree;
    };
}

module.exports = NamingConventions;