import { generatePythonBoilerplates } from "./toPython.js";
import { generateJavaBoilerplates } from "./toJava.js";
import { generateCppBoilerplates } from "./toCpp.js";
import fs from "fs";
import path from "path";

// Read input structures from input_structures.json
const inputPath = path.resolve("./input_structures.json");
let structures = [];
try {
  const raw = fs.readFileSync(inputPath, "utf-8");
  structures = JSON.parse(raw);
} catch (err) {
  console.error("Error reading input_structures.json:", err);
  process.exit(1);
}

const results = [];

structures.forEach((structure, idx) => {
  const cpp_result = generateCppBoilerplates(structure);
  const java_result = generateJavaBoilerplates(structure);
  const python_result = generatePythonBoilerplates(structure);
  results.push({
    structure,
    cpp: {
      boilerplate: cpp_result.boilerplate,
      fullBoilerplate: cpp_result.fullBoilerplate
    },
    java: {
      boilerplate: java_result.boilerplate,
      fullBoilerplate: java_result.fullBoilerplate
    },
    python: {
      boilerplate: python_result.boilerplate,
      fullBoilerplate: python_result.fullBoilerplate
    }
  });
});

// Create output folder if not exists
const outputDir = path.resolve("./outputs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate a unique filename with timestamp
const fileName = `boilerplate_output_${Date.now()}.json`;
const filePath = path.join(outputDir, fileName);

// Write results to JSON file
fs.writeFileSync(filePath, JSON.stringify(results, null, 2), "utf-8");

console.log(`Results written to: ${filePath}`);