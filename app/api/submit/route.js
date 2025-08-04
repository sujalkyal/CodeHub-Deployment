/**
 * @fileoverview API endpoint to submit code for a problem.
 * Route: /api/submit
 * Method: POST
 * 
 * Accepts user code, language, and problem slug, then:
 *  - Fetches test cases from S3
 *  - Wraps code with boilerplate
 *  - Creates a submission and result records
 *  - Dispatches jobs to Judge0 with webhook callback
 *  - Returns submission ID for polling
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@repo/db/client";
import axios from "axios";
import { downloadFile } from "@repo/s3-client/client";
import {auth } from '@clerk/nextjs/server'
import {getAvailableApiKey} from "../../../utils/rapidApiKeyManager"

// Zod schema for validating submission payload
const submissionSchema = z.object({
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

/**
 * Fetches test cases for a problem from S3.
 * @param {string} slug - Problem slug
 * @returns {Promise<Array>} - Array of test cases
 */
async function getTestCasesFromS3(slug) {
  const bucketName = process.env.BUCKET_NAME;
  const key = `problems/${slug}/input_output.json`;
  console.log(`Fetching test cases from S3: s3://${bucketName}/${key}`);

  try {
    const jsonString = await downloadFile({ Bucket: bucketName, Key: key });
    return JSON.parse(jsonString);
  } catch (error) {
    if (error.name === "NoSuchKey") {
      console.warn(`Test case file not found in S3 for slug: ${slug}`);
      return [];
    }
    console.error(`S3 Error fetching ${key}:`, error);
    throw new Error("Failed to fetch test cases from S3.");
  }
}

/**
 * POST /api/submit
 * Handles code submission for a problem.
 */
export async function POST(req) {
  try {

      const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Validate request body
    const body = await req.json();
    const parsedBody = submissionSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const {  problemSlug, languageId, code } = parsedBody.data;

    // Fetch problem
    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    console.log(`[POST] /api/submit - Problem found: ${problem.title}`);

    // Fetch boilerplate for language
    const boilerplate = await prisma.problemBoilerplate.findFirst({
      where: { problemId: problem.id, languageId },
    });
    if (!boilerplate || !boilerplate.fullcode || !boilerplate.code) {
      console.warn(`[POST] /api/submit - Boilerplate not found for problem: ${problemSlug}, language ID: ${languageId}`);
      return NextResponse.json({ error: "Boilerplate for this language not found." }, { status: 404 });
    }
    const finalCode = boilerplate.fullcode.replace(boilerplate.code, code);

    // Fetch test cases
    const testCases = await getTestCasesFromS3(problemSlug);
    if (testCases.length === 0) {
      return NextResponse.json({ error: "No test cases found" }, { status: 404 });
    }
    console.log(`[POST] /api/submit - Fetched ${testCases.length} test cases for problem: ${problemSlug}`);

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        languageId,
        code,
        statusId: 2, // Processing
        token: `submission-${Date.now()}`,
      },
    });
    console.log(`[POST] /api/submit - Created submission with ID: ${submission.id}`);

    // Create result records and dispatch jobs to Judge0
    const judge0Promises = testCases.map(async (testCase) => {
      const resultRecord = await prisma.submissionTestCaseResults.create({
        data: {
          submissionId: submission.id,
          passed: -1, // Processing
          statusId: null,
          statusDescription: null,
          stdout: null,
          stderr: null,
          compileOutput: null,
          message: null,
          time: null,
          memory: null,
        },
      });
      const callbackUrl = `${process.env.WEBHOOK_URL}?submissionTestCaseResultsId=${resultRecord.id}`;
      console.log(`[POST] /api/submit - Dispatching to Judge0 with callback: ${callbackUrl}`);
      const { key, host } = getAvailableApiKey();
      console.log(`[POST] /api/submit - Using Judge0 API key: ${key}`);
      return axios.post(
        `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
        {
          source_code: finalCode,
          language_id: languageId,
          stdin: testCase.input,
          expected_output: testCase.output,
          callback_url: callbackUrl,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": host,
            "x-rapidapi-key": key,
          },
        }
      );
    });

    Promise.all(judge0Promises).catch((err) => {
      console.error("[POST] /api/submit - Error dispatching to Judge0:", err.message);
    });

    // Respond with submission ID
    return NextResponse.json({ submissionId: submission.id }, { status: 202 });
  } catch (error) {
    console.error("[POST] /api/submit - Submission Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}