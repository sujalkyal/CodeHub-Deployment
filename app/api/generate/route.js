import { z } from "zod";
import { handleGeneration } from "../../lib/boilerplateService.js";
import { Readable } from "stream";
import busboy from "busboy";

// Schema to validate incoming JSON payload
const payloadSchema = z.object({
  title: z.string(),
  description: z.string(),
  structure: z.string(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  constraints: z.string(),
  sampleInput: z.string(),
  sampleOutput: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  tags: z.array(z.string()),
});

export async function POST(req) {
  try {
    const bb = busboy({ headers: req.headers });
    const bodyParts = {};

    const result = await new Promise((resolve, reject) => {
      const fileBuffers = {};

      bb.on("file", (name, file, info) => {
        const buffers = [];
        file.on("data", (data) => buffers.push(data));
        file.on("end", () => {
          fileBuffers[name] = {
            buffer: Buffer.concat(buffers),
            mimetype: info.mimeType,
          };
        });
      });

      bb.on("field", (name, val) => {
        bodyParts[name] = val;
      });

      bb.on("finish", () => {
        resolve({ fields: bodyParts, files: fileBuffers });
      });

      bb.on("error", reject);

      Readable.fromWeb(req.body).pipe(bb);
    });

    const jsonPayload = bodyParts["json"];
    if (!jsonPayload) {
      return Response.json({ error: "Missing JSON payload" }, { status: 400 });
    }

    let parsed;
    try {
      parsed = payloadSchema.parse(JSON.parse(jsonPayload));
    } catch (e) {
      console.error("[route] Invalid payload:", e);
      return Response.json(
        { error: "Invalid payload: " + e.message },
        { status: 400 }
      );
    }

    const inputOutputFile = result.files["input_output"];
    if (!inputOutputFile) {
      return Response.json(
        { error: "Input file is required." },
        { status: 400 }
      );
    }

    const created = await handleGeneration(parsed, inputOutputFile);
    return Response.json(
      { message: "Problem created", problemId: created.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[route] ❌ Error generating problem:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
