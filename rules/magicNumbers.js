const estraverse = require("estraverse")
const codegen = require("escodegen")
class magicNumbers {

    static apply(ast) {
        
        var parents = []
        
        estraverse.traverse(ast, {
            enter: (node, parent) => {
          
                
              // console.log("node: " + node.type)
              // if(parent)console.log("parent: " + parent.type)
               
                if(node.type == "Program" || node.type == "BlockStatement"){
                    //parents.push(node.loc.start.line)
                }
                //if(parent)console.log("parent: " + parent.type)
                if(parent && parent.type != "VariableDeclarator" && node.type == "Literal"){
                 //  console.log(node)
                    //console.log(this.getVarSuggestion())
                    console.log("You have a magic number on row " + node.loc.start.line + " at column " + node.loc.start.column)
                }
            },
            leave: (node,parent) => {
                if(node.type == "Program" || node.type == "BlockStatement"){
                   // console.log(parents.pop())
                }
                
            }
        })
        this.replace(ast) 
        //console.log(codegen.generate(result))
       // console.log(parents)
    }

}

magicNumbers.v = "VAR_0"
magicNumbers.indx = 0



magicNumbers.replace = function(ast){
    var parents = []
     var varFuncCall = this.getVarSuggestion
     var lastVar
    result = estraverse.replace(ast,{
        enter: function(node,parent){
            var v = undefined
            if(node.type == "Program" || (node.type == "BlockStatement" && (parent != undefined && (parent.type == "FunctionDeclaration" || parent.type == "ArrowFunctionExpression")))){
                var p = {
                    node:node,
                    problems:[]
                }
                parents.push(p)
            }
            if(parent && parent.type != "VariableDeclarator" && node.type == "Literal"){
                //console.log(parents))
                lastVar = varFuncCall()
                obj = {
                    name:lastVar,
                    value:node.value
                }
                parents[parents.length - 1].problems.push(obj)

                return {
                    "type":"Identifier",
                    "name":lastVar
                }

            }
        },
        leave:function(node,parent){
            if(node.type == "Program" || (node.type == "BlockStatement" && (parent != undefined && (parent.type == "FunctionDeclaration" || parent.type == "ArrowFunctionExpression")))){
               var parentPop = parents.pop()

               parentPop.problems.reverse().forEach(function(problem){
                var toAppend = {
                    "type": "VariableDeclaration",
                    "declarations": [
                        {
                            "type": "VariableDeclarator",
                            "id": {
                                "type": "Identifier",
                                "name": problem.name
                            },
                            "init": {
                                "type": "Literal",
                                "value": problem.value,
                                "raw": parseInt(problem.value)
                            }
                        }
                    ],
                    "kind": "const"
                }
                //console.log(parentPop)
                node.body = [toAppend].concat(node.body)
               })

        return node
            }
        }
    })

   // console.log(result)
   console.log(codegen.generate(result))
   return result
}

magicNumbers.getVarSuggestion = function(){
    this.v = this.v.substring(0,this.v.length-1)  + this.indx.toString()
    this.indx++
    return this.v
}.bind(magicNumbers)


module.exports = magicNumbers