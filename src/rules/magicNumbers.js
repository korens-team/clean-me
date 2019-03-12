import estraverse from "estraverse";

import {
    BLOCK_STATEMENT_TYPE,
    PROGRAM_TYPE,
    FUNCTION_DECLARATION_TYPE,
    ARROW_FUNCTION_EXPRESSION_TYPE,
    VARIABLE_DECLARATION_TYPE,
    VARIABLE_DECLARATOR_TYPE,
    IDENTIFIER_TYPE,
    LITERAL_TYPE,
    PROPERTY_TYPE
  } from "./consts/types";

let varName = "VAR_0";
let varIndex = 0;
let deltas = [];

export default class magicNumbers {
  static apply(ast) {
    var parents = [];
    var lastVar;

    const getVarSuggestionFunc = this.getVarSuggestion;

    const result = estraverse.replace(ast, {
      enter: function(node, parent) {
        if (
          node.type == PROGRAM_TYPE ||
          (node.type == BLOCK_STATEMENT_TYPE &&
            (parent != undefined &&
              (parent.type == FUNCTION_DECLARATION_TYPE ||
                parent.type == ARROW_FUNCTION_EXPRESSION_TYPE)))
        ) {
          var p = {
            node: node,
            problems: []
          };
          parents.push(p);
        }
        if (
          parent &&
          (parent.type != VARIABLE_DECLARATOR_TYPE && parent.type != PROPERTY_TYPE) &&
          node.type == LITERAL_TYPE
        ) {
          lastVar = getVarSuggestionFunc();
          if (node.loc) {
            const delta = {
              start: node.loc.start.line,
              end: node.loc.end.line,
              description:
                "Magic numbers is a bad practice. You should always use constants instead of numbers in your code."
            };

            deltas.push(delta);
          }

          const obj = {
            name: lastVar,
            value: node.value
          };
          parents[parents.length - 1].problems.push(obj);

          return {
            type: IDENTIFIER_TYPE,
            name: lastVar
          };
        }
      },
      leave: function(node, parent) {
        if (
          node.type == PROGRAM_TYPE ||
          (node.type == BLOCK_STATEMENT_TYPE &&
            (parent != undefined &&
              (parent.type == FUNCTION_DECLARATION_TYPE ||
                parent.type == ARROW_FUNCTION_EXPRESSION_TYPE)))
        ) {
          var parentPop = parents.pop();

          parentPop.problems.reverse().forEach(function(problem) {
            var toAppend = {
              type: VARIABLE_DECLARATION_TYPE,
              declarations: [
                {
                  type: VARIABLE_DECLARATOR_TYPE,
                  id: {
                    type: IDENTIFIER_TYPE,
                    name: problem.name
                  },
                  init: {
                    type: LITERAL_TYPE,
                    value: problem.value,
                    raw: parseInt(problem.value)
                  }
                }
              ],
              kind: "const"
            };

            node.body = [toAppend].concat(node.body);
          });

          return node;
        }
      }
    });

    return result;
  }

  static getAllDeltas() {
    return deltas;
  }

  static getVarSuggestion() {
    varName = varName.substring(0, varName.length - 1) + varIndex.toString();
    varIndex++;

    return varName;
  }
}
