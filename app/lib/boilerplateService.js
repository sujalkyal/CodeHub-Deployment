/**
 * Service to handle problem boilerplate generation, S3 upload, and DB persistence.
 *
 * Exports:
 *   - handleGeneration: Main function to process a problem, generate code, upload files, and persist to DB.
 *
 * Author: Sujal Kyal
 * Date: 25/07/2025
 */

import { uploadFile } from "../../utils/s3-client.js";
import { generatePythonBoilerplates } from "./templates/toPython.js";
import { generateJavaBoilerplates } from "./templates/toJava.js";
import { generateCppBoilerplates } from "./templates/toCpp.js";
import prisma from "../../utils/db.js";

/**
 * Main handler for problem generation, S3 upload, and DB persistence.
 * @param {Object} problemData - The problem data object.
 * @param {Object} inputOutputFile - The input/output file object (buffer, mimetype).
 * @returns {Promise<Object>} The created problem DB entry.
 */
export async function handleGeneration(problemData, inputOutputFile) {
  // 1. Clean up newlines in relevant fields
  [
    "structure",
    "inputFormat",
    "outputFormat",
    "constraints",
    "sampleInput",
    "sampleOutput",
  ].forEach((field) => {
    if (problemData[field]) {
      problemData[field] = problemData[field].replace(/\\n/g, "\n");
    }
  });
  console.log("[handleGeneration] Problem data received:", problemData);

  // 2. Create slug from title
  const slug = (problemData.title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  console.log(`[handleGeneration] Generated slug: ${slug}`);

  // 3. Upload input/output file to S3
  const inputOutputKey = `problems/${slug}/input_output.json`;
  console.log(
    `[handleGeneration] Uploading input/output file to S3 at key: ${inputOutputKey}`
  );
  await uploadFile({
    Bucket: process.env.BUCKET_NAME,
    Key: inputOutputKey,
    Body: inputOutputFile.buffer,
    ContentType: inputOutputFile.mimetype,
  });
  console.log("[handleGeneration] File uploaded to S3 successfully.");

  // 4. Generate boilerplate and full-boilerplate code for each language
  const structure = problemData.structure;
  console.log(
    "[handleGeneration] Generating boilerplates for structure:\n",
    structure
  );
  const cpp = generateCppBoilerplates(structure);
  const java = generateJavaBoilerplates(structure);
  const python = generatePythonBoilerplates(structure);
  console.log(
    "[handleGeneration] Boilerplates generated for C++, Java, Python."
  );

  // 5. Get language IDs from DB
  const languages = await prisma.language.findMany({
    where: { name: { in: ["C++", "Java", "Python"] } },
  });
  const langMap = {};
  languages.forEach((lang) => {
    langMap[lang.name.toLowerCase()] = lang;
  });
  console.log("[handleGeneration] Language map:", langMap);

  // 6. Create problem in database
  const problem = await prisma.problem.create({
    data: {
      title: problemData.title,
      slug,
      structure: problemData.structure,
      description: problemData.description,
      inputFormat: problemData.inputFormat,
      outputFormat: problemData.outputFormat,
      constraints: problemData.constraints,
      sampleInput: problemData.sampleInput,
      sampleOutput: problemData.sampleOutput,
      difficulty: problemData.difficulty,
    },
  });
  console.log(
    `[handleGeneration] Problem created in DB with id: ${problem.id}`
  );

  // 7. Create ProblemBoilerplate entry in database for each language
  const boilerplates = [
    {
      language: "c++",
      code: cpp.boilerplate,
      fullcode: cpp.fullBoilerplate,
    },
    {
      language: "java",
      code: java.boilerplate,
      fullcode: java.fullBoilerplate,
    },
    {
      language: "python",
      code: python.boilerplate,
      fullcode: python.fullBoilerplate,
    },
  ];
  for (const bp of boilerplates) {
    const lang = langMap[bp.language];
    if (lang) {
      await prisma.problemBoilerplate.create({
        data: {
          problemId: problem.id,
          languageId: lang.id,
          code: bp.code,
          fullcode: bp.fullcode,
        },
      });
      console.log(
        `[handleGeneration] Boilerplate for ${bp.language} saved to DB.`
      );
    } else {
      console.warn(
        `[handleGeneration] Language not found in DB: ${bp.language}`
      );
    }
  }

  // 8. Create ProblemTag entries in database for each tag
  for (const tagName of problemData.tags) {
    let tag = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
      console.log(`[handleGeneration] Created new tag: ${tagName}`);
    }
    await prisma.problemTag.create({
      data: {
        problemId: problem.id,
        tagId: tag.id,
      },
    });
    console.log(`[handleGeneration] Linked tag '${tagName}' to problem.`);
  }

  console.log(
    `[handleGeneration] Problem generation complete for slug: ${slug}`
  );
  return problem;
}
