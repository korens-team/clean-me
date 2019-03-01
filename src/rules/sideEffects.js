import estraverse from "estraverse";

import {
  ASSIGNMENT_EXPRESSION_TYPE,
  FUNCTION_DECLARATION_TYPE,
  IDENTIFIER_TYPE,
  CALL_EXPRESSION_TYPE,
  OBJECT_EXPRESSION_TYPE,
  EXPRESSION_STATEMENT_TYPE,
  PROPERTY_TYPE,
  RETURN_STATEMENT_TYPE
} from "./consts/types";

const deltas = [];

export default class SideEffectRule {
  static apply(ast) {
    const functions = this.getFunctionsWithParams(ast);
    const problematicFunctions = this.getProblematicFunctions(ast, functions);
    const problematicFunctionsNames = problematicFunctions.map(p => p.name);

    const newAst = estraverse.replace(ast, {
      enter: node => {
        let nodeToReplaceFunction;
        let funcIndex;
        if (node.type === FUNCTION_DECLARATION_TYPE) {
          funcIndex = problematicFunctionsNames.indexOf(node.id.name);
          if (funcIndex !== -1) {
            const func = problematicFunctions[funcIndex];
            nodeToReplaceFunction = this.replaceParamAssigment(func);
            return nodeToReplaceFunction;
          }
        } else if (
          node.type === EXPRESSION_STATEMENT_TYPE &&
          node.expression.type === CALL_EXPRESSION_TYPE
        ) {
          const funcCallName = node.expression.callee.name;
          funcIndex = problematicFunctionsNames.indexOf(funcCallName);
          if (funcIndex !== -1) {
            const func = problematicFunctions[funcIndex];
            nodeToReplaceFunction = this.replaceFunctionCall(func, node);
            return nodeToReplaceFunction;
          }
        }
      }
    });

    return newAst;
  }

  static getAllDeltas() {
    return deltas;
  }
}

SideEffectRule.getFunctionsWithParams = function(ast) {
  const functions = [];
  estraverse.traverse(ast, {
    enter: node => {
      if (node.type === FUNCTION_DECLARATION_TYPE) {
        let params = node.params.map(p => p.name);
        let func = {
          name: node.id.name,
          params: params
        };

        functions.push(func);
      }
    }
  });

  return functions;
};

SideEffectRule.getProblematicFunctions = function(ast, functions) {
  const funcNames = functions.map(f => f.name);
  const problematicFunctions = [];
  estraverse.traverse(ast, {
    enter: node => {
      if (node.type && node.type === FUNCTION_DECLARATION_TYPE) {
        const index = funcNames.indexOf(node.id.name);
        if (index !== -1) {
          let problematicParams = this.getProblematicParams(
            node,
            functions[index]
          );

          problematicFunctions.push({
            name: node.id.name,
            node: node,
            problems: problematicParams
          });
        }
      }
    }
  });

  return problematicFunctions;
};

SideEffectRule.getProblematicParams = function(functionNode, func) {
  let params = [];
  estraverse.traverse(functionNode, {
    enter: node => {
      if (
        node.type &&
        node.expression &&
        node.expression.left &&
        node.type === EXPRESSION_STATEMENT_TYPE &&
        node.expression.type === ASSIGNMENT_EXPRESSION_TYPE &&
        func.params.includes(node.expression.left.name)
      ) {
        params.push(node.expression);

        deltas.push({
          start: node.loc.start.line,
          end: node.loc.end.line,
          description: "Variable is assigned but is a parameter of a function"
        });
      }
    }
  });

  return params;
};

SideEffectRule.replaceParamAssigment = function(func) {
  const paramsLength = func.problems.length;

  const newAst = estraverse.replace(func.node, {
    enter: node => {
      let nodeToReplaceExpression;
      if (
        node.type &&
        node.expression &&
        node.type === EXPRESSION_STATEMENT_TYPE &&
        node.expression.type === ASSIGNMENT_EXPRESSION_TYPE
      ) {
        const paramIndex = func.problems
          .map(p => p.left.name)
          .indexOf(node.expression.left.name);
        if (paramIndex !== -1) {
          if (paramsLength == 1) {
            const param = func.problems[paramIndex];
            nodeToReplaceExpression = {
              type: RETURN_STATEMENT_TYPE,
              argument: param.right
            };

            return nodeToReplaceExpression;
          }
        }
      }

      /*if (paramsLength > 1 && !didReplaceMultiple) {
                body = this.replaceMultipleParamAssignment(func)       
                nodeToReplaceExpression = node
                nodeToReplaceExpression.body.body = [body]
                didReplaceMultiple = true
                return nodeToReplaceExpression
            }*/
    }
  });

  return newAst;
};

SideEffectRule.replaceFunctionCall = function(func, node) {
  const paramsLength = func.problems.length;

  let nodeToReplace =
    paramsLength === 1
      ? this.generateSingleParamFunctionCall(func, node)
      : node;
  //: this.generateMultipleParamsFunctionCall(func, node)

  if (paramsLength === 1) {
    this.generateSingleParamFunctionCall(func, node);
  }

  return nodeToReplace;
};

SideEffectRule.replaceMultipleParamAssignment = function(func) {
  let nodeToReplace = {
    type: RETURN_STATEMENT_TYPE,
    argument: {
      type: OBJECT_EXPRESSION_TYPE,
      properties: []
    }
  };

  func.problems.forEach(param => {
    let paramNode = {
      type: PROPERTY_TYPE,
      key: {
        type: IDENTIFIER_TYPE,
        name: param.name
      },
      computed: false,
      value: {
        type: param.type,
        value: param.value,
        raw: param.value
      },
      kind: "init",
      method: false,
      shorthand: false
    };

    nodeToReplace.argument.properties.push(paramNode);
  });

  return nodeToReplace;
};

SideEffectRule.generateSingleParamFunctionCall = function(func, node) {
  const paramName = func.problems[0];

  const nodeToReplace = {
    type: EXPRESSION_STATEMENT_TYPE,
    expression: {
      type: ASSIGNMENT_EXPRESSION_TYPE,
      operator: "=",
      left: {
        type: IDENTIFIER_TYPE,
        name: paramName.left.name
      },
      right: node.expression
    }
  };

  return nodeToReplace;
};

SideEffectRule.generateMultipleParamsFunctionCall = function(func, node) {
  const nodeToReplace = {
    type: EXPRESSION_STATEMENT_TYPE,
    expression: {
      type: ASSIGNMENT_EXPRESSION_TYPE,
      operator: "=",
      left: {
        type: "ObjectPattern",
        properties: []
      },
      right: node.expression
    }
  };

  func.problems.forEach(param => {
    let paramNode = {
      type: PROPERTY_TYPE,
      key: {
        type: IDENTIFIER_TYPE,
        name: param
      },
      computed: false,
      value: {
        type: IDENTIFIER_TYPE,
        name: param
      },
      kind: "init",
      method: false,
      shorthand: true
    };

    nodeToReplace.expression.left.properties.push(paramNode);
  });

  return nodeToReplace;
};