const estraverse = require("estraverse")
const chalk = require("chalk");
const _ = require('lodash');

const IfStatement_type = "IfStatement";
const LogicalExpression_type = "LogicalExpression";
const Identifier_type = "Identifier";
const BinaryExpression_type = "BinaryExpression";
const Literal_type = "Literal";

const operationsMap = {
    ">": "grater",
    "<": "smaller",
    "==": "equals",
    "===": "equals",
}

const codeErrors = [];

class EncapsulateConditions {
    static apply(syntaxTree) {
        let logicStatementsArray = [];
        let logicVars = [];

        estraverse.traverse(syntaxTree, {
            enter: (node,parent) => {
                if(node.type == IfStatement_type && node.test.type == LogicalExpression_type){
                    const subNames = this.getAllVarsInNodeNames(node.test);
                    if(node.loc.start){
                        logicStatementsArray.push({
                            "testLogic": node.test,
                            "ifNode": node,
                            "ifParent": parent,
                            "subVarsNames": subNames
                        });
                    }
                }
            }
        });

        logicStatementsArray.forEach((logicStatment) => {           
            console.log(chalk.red("Encapsulate complex if statments, row: " + logicStatment.ifNode.loc.start.line));            

            codeErrors.push({
                "start": logicStatment.ifNode.loc.start.line,
                "end":  logicStatment.ifNode.loc.end.line,
                "description": "Encapsulate complex if statments to const variable"
            })

            var toAppend = {
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": _.camelCase("check_" + logicStatment.subVarsNames.join("_"))
                        },
                        "init": logicStatment.testLogic
                    }
                ],
                "kind": "const"
            };

            logicVars.push(toAppend);            
        });

        
        const newTree = estraverse.replace(syntaxTree, {
            enter: (node,parent) => {
                if(node.loc.start){
                    if(node.type == IfStatement_type && node.test.type == LogicalExpression_type){
                        const statment = logicStatementsArray.find((logicStatmentNode) => {
                            return logicStatmentNode.ifNode.loc.start.line == node.loc.start.line &&
                            logicStatmentNode.ifNode.loc.start.column == node.loc.start.column;
                        });  
                        
                        if(statment){
                            const logic = logicVars.find((logicVar) => {
                                return logicVar.declarations[0].init == statment.testLogic;
                            }); 
                            if(logic){
                                node.test = {
                                    "type": "Identifier",
                                    "name": logic.declarations[0].id.name
                                };

                                parent.body.splice(parent.body.indexOf(node), 0, logic);
                            }
                        }
                    }  
                }                  
            }
        });

        return newTree;
    }

    static getAllVarsInNodeNames(node) {
        let varsNames = [];
        estraverse.traverse(node, {
            enter: (subnode) => {
                if (subnode.type == Identifier_type) {
                    varsNames.push(subnode.name);
                }
                if(subnode.type == BinaryExpression_type && subnode.operator){
                  varsNames.push(operationsMap[subnode.operator]);
                }
                if(subnode.type == Literal_type){
                    varsNames.push(subnode.value);
                }
            }
        });

        return varsNames;
    }

    static getAllDeltas() {
        return codeErrors;
    }
}

module.exports = EncapsulateConditions;