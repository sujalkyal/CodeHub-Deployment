
/**
 * toPython.js - Python Boilerplate Generator
 *
 * This script parses a problem structure and generates Python function/class boilerplate code
 * and a main block with robust input/output handling for competitive programming.
 *
 * Features:
 * - Parses function and class signatures from a structured description
 * - Maps types using mapping.json for Python
 * - Generates input code for all standard CP scenarios:
 *   - Multiple primitives (same/mixed types) from a single line
 *   - 1D and 2D lists (with n rows)
 *   - Fallbacks for custom/complex types
 * - Generates output code for primitives, 1D/2D lists
 * - Logs key steps for debugging and traceability
 *
 * Author: [Your Name]
 * Date: 2025-07-31
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingPath = path.join(__dirname, "mapping.json");
const typeMapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

function log(msg, ...args) {
  // Simple logger for debugging
  console.log(`[toPython] ${msg}`, ...args);
}

/**
 * Parses a structured problem description into functions and classes.
 * @param {string} structure - The problem structure string
 * @returns {{functions: Array, classes: Array}}
 */
function parseStructure(structure) {
  log('Parsing structure...');
  const lines = structure.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = { functions: [], classes: [] };
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith("Function:")) {
      const func = { name: lines[i].split(":")[1].trim(), inputs: [], outputType: null };
      i++;
      while (i < lines.length && (lines[i].startsWith("Input:") || lines[i].startsWith("Output:"))) {
        if (lines[i].startsWith("Input:")) {
          const inputStr = lines[i].replace("Input:", "").trim();
          if (inputStr) {
            inputStr.split(",").forEach(pair => {
              const [type, ...nameParts] = pair.trim().split(" ");
              func.inputs.push({ type, name: nameParts.join(" ") });
            });
          }
        } else if (lines[i].startsWith("Output:")) {
          func.outputType = lines[i].replace("Output:", "").trim();
        }
        i++;
      }
      result.functions.push(func);
      log('Parsed function:', func);
    } else if (lines[i].startsWith("Class:")) {
      const className = lines[i].split(":")[1].trim();
      i++;
      const methods = [];
      while (i < lines.length && lines[i].startsWith("Methods:")) {
        i++;
        while (i < lines.length && lines[i].startsWith("-")) {
          const methodLine = lines[i].replace("-", "").trim();
          const method = { name: methodLine, inputs: [], outputType: null };
          i++;
          while (i < lines.length && (lines[i].startsWith("Input:") || lines[i].startsWith("Output:"))) {
            if (lines[i].startsWith("Input:")) {
              const inputStr = lines[i].replace("Input:", "").trim();
              if (inputStr) {
                inputStr.split(",").forEach(pair => {
                  const [type, ...nameParts] = pair.trim().split(" ");
                  method.inputs.push({ type, name: nameParts.join(" ") });
                });
              }
            } else if (lines[i].startsWith("Output:")) {
              method.outputType = lines[i].replace("Output:", "").trim();
            }
            i++;
          }
          methods.push(method);
          log('Parsed method:', method);
        }
      }
      result.classes.push({ name: className, methods });
      log('Parsed class:', className);
    } else {
      i++;
    }
  }
  log('Parsing complete.');
  return result;
}

/**
 * Maps a type string to its Python equivalent using mapping.json.
 * @param {string} type
 * @returns {string}
 */
function mapType(type) {
  return typeMapping[type]?.python || type;
}

/**
 * Generates a Python function boilerplate.
 * @param {object} func
 * @returns {string}
 */
function generateFunctionBoilerplate(func) {
  log('Generating function boilerplate for', func.name);
  const args = func.inputs.map(inp => inp.name).join(", ");
  return `def ${func.name}(${args}):\n    # Write your code here\n    pass`;
}

/**
 * Generates a Python class boilerplate.
 * @param {object} cls
 * @returns {string}
 */
function generateClassBoilerplate(cls) {
  log('Generating class boilerplate for', cls.name);
  let code = `class ${cls.name}:`;
  if (cls.methods.length === 0) {
    code += `\n    pass`;
  } else {
    cls.methods.forEach(method => {
      const args = ["self"].concat(method.inputs.map(inp => inp.name)).join(", ");
      code += `\n    def ${method.name}(${args}):\n        # Write your code here\n        pass`;
    });
  }
  return code;
}

/**
 * Generates the combined boilerplate for all classes and functions.
 * @param {object} parsed
 * @returns {string}
 */
function generateBoilerplate(parsed) {
  log('Generating combined boilerplate...');
  let code = "";
  parsed.classes.forEach(cls => {
    code += generateClassBoilerplate(cls) + "\n\n";
  });
  parsed.functions.forEach(func => {
    code += generateFunctionBoilerplate(func) + "\n\n";
  });
  return code.trim();
}


// Generate input code for all arguments at once (space-separated)

/**
 * Generates Python input code for all arguments at once (space-separated).
 * Handles primitives, lists, and 2D lists.
 * @param {Array} inputs
 * @returns {string}
 */
function generateInputsBlock(inputs) {
  if (inputs.length === 0) return "";
  const primitives = ["int", "str", "bool", "float"];
  let primitiveVars = [];
  let primitiveTypes = [];
  let arrayInfos = [];
  for (let i = 0; i < inputs.length; i++) {
    const type = mapType(inputs[i].type);
    if (primitives.includes(type)) {
      primitiveVars.push(inputs[i].name);
      primitiveTypes.push(type);
    } else if (type.startsWith("List[")) {
      arrayInfos.push({ idx: i, type, name: inputs[i].name });
    }
  }
  let codeLines = [];
  // Read all primitives in one line, using correct type
  if (primitiveVars.length > 0) {
    let typeMap = { int: "int", str: "str", float: "float", bool: "bool" };
    let mapTypeStr = primitiveTypes.every(t => t === primitiveTypes[0]) ? typeMap[primitiveTypes[0]] : "str";
    if (primitiveTypes.every(t => t === "int")) mapTypeStr = "int";
    else if (primitiveTypes.every(t => t === "float")) mapTypeStr = "float";
    else if (primitiveTypes.every(t => t === "bool")) mapTypeStr = "bool";
    else if (primitiveTypes.every(t => t === "str")) mapTypeStr = "str";
    codeLines.push(`    ${primitiveVars.join(", ")} = map(${mapTypeStr}, input().split())`);
  }
  // For each array, use last primitive(s) before it as size(s)
  for (let info of arrayInfos) {
    const { idx, type, name } = info;
    if (type.startsWith("List[List[")) {
      // 2D array: last two primitives before this array
      let dimVars = [];
      let found = 0;
      for (let j = idx - 1; j >= 0 && found < 2; j--) {
        if (primitives.includes(mapType(inputs[j].type))) {
          dimVars.unshift(inputs[j].name);
          found++;
        }
      }
      const innerTypeMatch = type.match(/List\[List\[(.*?)\]\]/);
      let innerType = innerTypeMatch ? innerTypeMatch[1] : "int";
      if (["string", "str"].includes(innerType)) innerType = "str";
      if (["integer", "int"].includes(innerType)) innerType = "int";
      if (["float"].includes(innerType)) innerType = "float";
      if (["bool", "boolean"].includes(innerType)) innerType = "bool";
      codeLines.push(`    ${name} = [list(map(${innerType}, input().split())) for _ in range(${dimVars[0]})]  # Assumes ${dimVars[0]} rows`);
    } else if (type.startsWith("List[")) {
      // 1D array: last primitive before this array
      let dimVar = null;
      for (let j = idx - 1; j >= 0; j--) {
        if (primitives.includes(mapType(inputs[j].type))) {
          dimVar = inputs[j].name;
          break;
        }
      }
      const innerTypeMatch = type.match(/List\[(.*?)\]/);
      let innerType = innerTypeMatch ? innerTypeMatch[1] : "int";
      if (["string", "str"].includes(innerType)) innerType = "str";
      if (["integer", "int"].includes(innerType)) innerType = "int";
      if (["float"].includes(innerType)) innerType = "float";
      if (["bool", "boolean"].includes(innerType)) innerType = "bool";
      codeLines.push(`    ${name} = list(map(${innerType}, input().split()))`);
    }
  }
  return codeLines.join("\n");
}

/**
 * Generates Python output code for the given output type.
 * @param {string} outputType
 * @returns {string}
 */
function generateOutputCode(outputType) {
  const type = mapType(outputType);
  if (["int", "str", "bool", "float"].includes(type)) {
    log('Generating output for primitive type:', type);
    return `    print(result)`;
  } else if (type.startsWith("List[List[")) {
    log('Generating output for 2D list:', type);
    return `    for row in result:\n        print(*row)`;
  } else if (type.startsWith("List[")) {
    log('Generating output for 1D list:', type);
    return `    print(*result)`;
  } else {
    log('Generating output for custom/unknown type:', type);
    return `    print(result)  # TODO: Add custom print logic`;
  }
}


/**
 * Generates the full Python boilerplate including imports, main block, and I/O.
 * @param {object} parsed
 * @returns {string}
 */
function generateFullBoilerplate(parsed) {
  log('Generating full boilerplate...');
  let code = "# Imports\n";
  code += "import sys\n\n";
  code += generateBoilerplate(parsed) + "\n\n";
  code += "if __name__ == '__main__':\n";
  let mainFunc = parsed.functions[0] || (parsed.classes[0]?.methods[0]);
  if (mainFunc) {
    code += generateInputsBlock(mainFunc.inputs) + "\n";
    let call;
    if (parsed.functions[0]) {
      call = `${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
      code += `    result = ${call}\n`;
      code += generateOutputCode(mainFunc.outputType) + "\n";
    } else {
      code += `    obj = ${parsed.classes[0].name}()\n`;
      call = `obj.${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
      code += `    result = ${call}\n`;
      code += generateOutputCode(mainFunc.outputType) + "\n";
    }
  }
  log('Full boilerplate generated.');
  return code;
}


/**
 * Main export: generates Python boilerplate and full code for a given structure.
 * @param {string} structure
 * @returns {{boilerplate: string, fullBoilerplate: string}}
 */
export function generatePythonBoilerplates(structure) {
  log('Generating Python boilerplates...');
  const parsed = parseStructure(structure);
  const boilerplate = generateBoilerplate(parsed);
  const fullBoilerplate = generateFullBoilerplate(parsed);
  log('Boilerplate and full code generated.');
  return { boilerplate, fullBoilerplate };
}
