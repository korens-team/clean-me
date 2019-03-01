import estraverse from "estraverse";
import _ from "lodash";

import {
  VARIABLE_DECLARATION_TYPE,
  FUNCTION_DECLARATION_TYPE,
  IDENTIFIER_TYPE,
  CALL_EXPRESSION_TYPE,
  LITERAL_TYPE,
  NEW_EXPRESSION_TYPE
} from "./consts/types";

const CamelCase_Regex = /^[a-z]+([A-Z][a-z0-9]+)*$/;
const SnakeCase_Regex = /^[A-Z]+(\_[A-Z0-9]+)*/;

const codeErrors = [];

export default class NamingConventions {
  static apply(syntaxTree) {
    let declerationsArray = [];
    let index = 0;

    estraverse.traverse(syntaxTree, {
      enter: (node, parent) => {
        if (node.loc) {
          if (node.type == VARIABLE_DECLARATION_TYPE) {
            declerationsArray[index] = {
              kind: node.kind,
              row: node.loc.start.line
            };
          }
          if (node.type == VARIABLE_DECLARATION_TYPE && node.id && node.id.name) {
            declerationsArray[index].name = node.id.name;
            declerationsArray[index].valueType = node.init.type;
            declerationsArray[index].column = node.loc.start.column;
            index++;
          }
          if (node.type == FUNCTION_DECLARATION_TYPE) {
            declerationsArray[index] = {
              name: node.id.name,
              row: node.loc.start.line,
              column: node.loc.start.column,
              kind: FUNCTION_DECLARATION_TYPE
            };
            index++;
          }
          if (
            node.type == IDENTIFIER_TYPE &&
            parent.type != VARIABLE_DECLARATION_TYPE &&
            parent.type != FUNCTION_DECLARATION_TYPE &&
            parent.type != NEW_EXPRESSION_TYPE
          ) {
            declerationsArray[index] = {
              name: node.name,
              row: node.loc.start.line,
              column: node.loc.start.column,
              kind: IDENTIFIER_TYPE
            };
            index++;
          }
        }
      }
    });

    declerationsArray.forEach(declerationObj => {
      if (!CamelCase_Regex.test(declerationObj.name)) {
        if (
          !(
            declerationObj.valueType == LITERAL_TYPE &&
            declerationObj.kind == "const" &&
            SnakeCase_Regex.test(declerationObj.name)
          )
        ) {
          // console.log(chalk.red("Use camelCase for vars declerations, row: " + declerationObj.row + " value: " + declerationObj.name));
          declerationObj.newName = _.camelCase(declerationObj.name);
          // console.log("Use " + declerationObj.newName + " instead");
          codeErrors.push({
            start: declerationObj.row,
            end: declerationObj.row,
            description:
              "This name not stand for common naming convention, should be camelCase"
          });
        }
      }

      if (
        declerationObj.valueType == LITERAL_TYPE &&
        declerationObj.kind == "const" &&
        !SnakeCase_Regex.test(declerationObj.name.toLowerCase())
      ) {
        // console.log(chalk.red("use SNAKE_CASE for const numbers, row: " + declerationObj.row + " value: " + declerationObj.name));
        declerationObj.newName = _.snakeCase(declerationObj.name).toUpperCase();
        // console.log("Use " + declerationObj.newName + " instead");
        codeErrors.push({
          start: declerationObj.row,
          end: declerationObj.row,
          description:
            "This name not stand for common naming convention, consts should be SNAKE_CASE"
        });
      }
    });

    const newTree = estraverse.replace(syntaxTree, {
      enter: node => {
        if (
          node.loc &&
          (node.type == VARIABLE_DECLARATION_TYPE ||
            node.type == FUNCTION_DECLARATION_TYPE)
        ) {
          const newNode = declerationsArray.find(declerationObj => {
            return (
              declerationObj.row == node.loc.start.line &&
              declerationObj.column == node.loc.start.column
            );
          });

          if (newNode && newNode.newName) {
            node.id.name = newNode.newName;

            return node;
          }
        } else if (
          node.type == IDENTIFIER_TYPE ||
          node.type == CALL_EXPRESSION_TYPE
        ) {
          const newNode = declerationsArray.find(declerationObj => {
            return declerationObj.name == node.name;
          });

          if (newNode && newNode.newName) {
            node.name = newNode.newName;

            return node;
          }
        } else if (node.type == CALL_EXPRESSION_TYPE) {
          const newNode = declerationsArray.find(declerationObj => {
            return declerationObj.name == node.callee.name;
          });

          if (newNode && newNode.newName) {
            node.callee.name = newNode.newName;

            return node;
          }
        }
      }
    });

    return newTree;
  }

  static getAllDeltas() {
    return codeErrors;
  }
}