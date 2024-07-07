// https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func: Function) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        return [];
    return result;
}

function getFunctionBody(func: Function) {
    var fnStr = func.toString();

    if (fnStr.indexOf('{') == -1) {
        return fnStr.split("=>")[1].trim();
    }

    var start = fnStr.indexOf('{') + 1;
    var end = fnStr.lastIndexOf('}');
    return fnStr.substring(start, end).trim();
}

(<any>window).RaisinUUIDs = {};

export class Raisin {
    body: string[];
    params: string[];

    /**
     * Initialises a new Raisin.
     *
     * @param {function} func - The function.
     */
    constructor(func: Function) {
        this.body = getFunctionBody(func).split("\n");
        this.params = getParamNames(func);
    }

    /**
     * Inserts the specified code at the given line.
     *
     * @param {number} line - The line number to insert the code.
     * @param {string|function} code - The code to insert. If a function, a decorator is added.
     * @param {boolean} [replace=false] - Whether to replace the existing code at the line.
     * @return {this}
     */
    insert(line: number, code: string | Function, replace = false): this {
        if (line < 0) {
            line = this.body.length + 1 + line;
        }

        if (typeof code === "string") {
            var inject = code;
        } else {
            var codeParams = getParamNames(code).join(",");
            var inject = `([${codeParams}] = ((${codeParams}) => {${getFunctionBody(code)};return [${codeParams}]}).call(this, ${codeParams}));`;
        }

        // console.log(inject)

        this.body.splice(line, replace ? 1 : 0, inject);

        return this;
    }

    /**
     * Inserts the specified code at the given line, based on a signature match.
     *
     * @param {string} signature - The signature to match in the code.
     * @param {string|function} code - The code to insert. If a function, a decorator is added.
     * @param {boolean} [entireLine=true] - Whether to replace the entire line or just the matched signature.
     * @param {boolean} [replaceLine=false] - Whether to replace the existing code at the line.
     * @return {this}
     */
    insertPerSignature(signature: string, code: string | Function, entireLine = true, replaceLine = false): this {
        for (var i in this.body) {
            if (this.body[i].match(signature)) {
                if (entireLine)
                    this.insert(i + replaceLine ? 0 : 1, code, replaceLine);
                else
                    this.body[i] = this.body[i].replace(signature, <string>code);
            }
        }

        return this;
    }

    /**
     * Runs the function code through a transpiler.
     *
     * @param {function} transpiler - The transpiler function to use.
     * @return {this}
     */
    transpile(transpiler: Function): this {
        this.body = transpiler(this.body);
        return this;
    }

    /**
     * Compiles the function body and parameters into a new function.
     *
     * @return {function} The compiled function.
     */
    compile() {
        return new Function(...this.params, this.body.join("\n"))
    }
}

export class ModRaisin extends Raisin {
    modID: string

    constructor(modID: string, func: Function) {
        super(func);
        this.modID = modID;
    }

    insert(line: number, code: string | Function, replace?: boolean): this {
        if (line < 0) {
            line = this.body.length + 1 + line;
        }

        if (typeof code === "string") {
            var inject = code;
        } else {
            var codeParams = getParamNames(code).join(",");
            var inject = `if (window.MacadamiaModList['${this.modID}'].enabled) ([${codeParams}] = ((${codeParams}) => {${getFunctionBody(code)};return [${codeParams}]}).call(this, ${codeParams}));`;
        }

        // console.log(inject)

        this.body.splice(line, replace ? 1 : 0, inject);

        return this;
    }

    transpile(transpiler: Function): this {
        this.body = ["if (window.MacadamiaModList['" + this.modID + "'].enabled) {", ...transpiler(this.body), "else {", ...this.body, "}"];
        return this;
    }
}