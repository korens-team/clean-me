# CleamME
### Use clean me to refactor your code with some famous clean code principle.
__*`The project still in development`*__

CleanMe will use the rules you pick to refactor when activate,
all the rules suppose to help you maintain on cleaner and better code.

**Rules:**
- namingConventions: check if your code follow the names convantions (such as camel case for variables).  
    *in:*
    ```javascript
    let FirstName = "ofir"; 
    ```
    *out:*
    ```javascript
    let firstName = "ofir"; 
    ```
- noFlagsArgs: check if your code contains flag function.  
   *in:*
    ```javascript
    function susu(a, b, c, d, isTemporary) {
        if (isTemporary) {
            console.log(a)
            console.log(c)
            console.log(d)
        } else {
            console.log(b)
        }
    }
    const temp = false;
    susu(1, 2, 3, 4, temp)
    ```
    *out:*
    ```javascript
    function susuisTemporary(a, c, d) {
        console.log(a);
        console.log(c);
        console.log(d);
    }
    function susu(b) {
        console.log(b);
    }
    const temp = false;
    if (temp) {
        susuisTemporary(1, 3, 4);
    } else {
        susu(2);
    };
    ```
- noSideEffects: check if your code contains functions with side effects.  
   *in:*
    ```javascript
    function eliav(b) {
        const a = 111
        console.log(a)
        b = b + 1
    }

    let b = 1
    eliav(b)
    ```
    *out:*
    ```javascript
    function eliav(b) {
        const a = 111;
        console.log(a);
        return b + 1;
    }
    let b = 1;
    b = eliav(b); 
    ```
- noMagicNumbers: check if your code contains literals that can be conts variables.  
    *in:*
    ```javascript
    r = () => {
        return 7
    }
    ```
    *out:*
    ```javascript
    r = () => {
        const VAR_0 = 7;
        return VAR_0;
    };
    ```
- encapsulateConditions: check if your code contains complex conditions that can be seperate to varible.  
    *in:*
    ```javascript
    let a = 5;
    let b = 7;
    let c = 8;
    const f = true;
    
    if(a > b && b ==10 && c < a || f){
        console.log(c);
    }
    ```
    *out:*
    ```javascript
    let a = 5;
    let b = 7;
    let c = 8;
    const f = true;
    const checkGraterABEqualsB10SmallerCAF = a > b && b == 10 && c < a || f;
    if (checkGraterABEqualsB10SmallerCAF) {
        console.log(c);
    }
    ```

**How to use CleanMe:**
you can use CleanMe through the cleam-me CLI
*for example:*
> clean-me -f example.js noMagicNumbers

and the output will be how you can make your code better.

you also can put output file that generate new file all the recommended fixes,
and use as many rules as want at a time.
> clean-me -f example.js -o out.js noMagicNumbers encapsulateConditions