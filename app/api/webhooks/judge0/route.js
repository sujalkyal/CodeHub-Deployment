import { z } from "zod";
import prisma from "../../../../utils/db.js";

// Zod schema to validate Judge0 callback (all relevant fields)
const judge0CallbackSchema = z.object({
  status: z.object({
    id: z.number(),
    description: z.string(),
  }),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compile_output: z.string().nullable(),
  message: z.string().nullable(),
  time: z.string().nullable(),
  memory: z.number().nullable(),
  token: z.string(),
});

// Only handle PUT requests
export async function PUT(req) {
  const { searchParams } = new URL(req.url);
  const submissionTestCaseResultsId = searchParams.get("submissionTestCaseResultsId");

  if (!submissionTestCaseResultsId) {
    console.error("[Webhook] Missing submissionTestCaseResultsId");
    return Response.json({ error: "Missing submissionTestCaseResultsId" }, { status: 400 });
  }

  const numericId = parseInt(submissionTestCaseResultsId, 10);
  if (isNaN(numericId)) {
    console.error("[Webhook] Invalid ID format:", submissionTestCaseResultsId);
    return Response.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = judge0CallbackSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[Webhook] Invalid Judge0 body:", parsed.error);
      return Response.json({ error: "Invalid callback body" }, { status: 400 });
    }

    const {
      status,
      stdout,
      stderr,
      compile_output,
      message,
      time,
      memory
    } = parsed.data;

    let passed = 0;
    if (status.id === 3) passed = 1;
    else if (status.id === 1 || status.id === 2) passed = -1;

    await prisma.submissionTestCaseResults.update({
      where: { id: numericId },
      data: {
        passed,
        statusId: status.id,
        statusDescription: status.description,
        stdout,
        stderr,
        compileOutput: compile_output,
        message,
        time,
        memory,
      },
    });

    console.log(`[Webhook] Processed: ID ${numericId}, Status: ${status.id} (${status.description})`);
    return Response.json({ message: "Webhook received successfully." });
  } catch (error) {
    console.error("[Webhook] Internal server error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
