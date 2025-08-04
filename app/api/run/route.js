
/**
 * @fileoverview API endpoint to run code against sample test cases for a problem.
 * Route: /api/run
 * Method: POST
 *
 * - Fetches sample test cases from S3
 * - Wraps code with boilerplate
 * - Creates a temporary submission and result records
 * - Dispatches jobs to Judge0 with webhook callback
 * - Returns run ID and test case map for polling
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import axios from 'axios';
import prisma from "@repo/db/client";
import { downloadFile } from "@repo/s3-client/client";
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import {getAvailableApiKey} from "../../../utils/rapidApiKeyManager"
const runSchema = z.object({
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

// Fetch test cases from S3
async function getTestCasesFromS3(slug) {
  const bucketName = process.env.BUCKET_NAME;
  const key = `problems/${slug}/input_output.json`;
  console.log(`[Run API] Fetching test cases from S3: s3://${bucketName}/${key}`);
  try {
    const jsonString = await downloadFile({ Bucket: bucketName, Key: key });
    return JSON.parse(jsonString);
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.warn(`[Run API] Test case file not found in S3 for slug: ${slug}`);
      return [];
    }
    console.error(`[Run API] S3 Error fetching ${key}:`, error);
    throw new Error('Failed to fetch test cases from S3.');
  }
}

export async function POST(req) {
  try {

    const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
    console.log("[Run API] Received POST /api/run request");
    // --- Parse and validate request ---
    const body = await req.json();
    console.log("[Run API] Request body:", body);
    const parsedBody = runSchema.safeParse(body);
    if (!parsedBody.success) {
      console.warn("[Run API] Invalid request body:", parsedBody.error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const {  problemSlug, languageId, code } = parsedBody.data;

    // --- Fetch problem and boilerplate ---
    console.log(`[Run API] Fetching problem for slug: ${problemSlug}`);
    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) {
      console.warn(`[Run API] Problem not found for slug: ${problemSlug}`);
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    console.log(`[Run API] Fetching boilerplate for problemId: ${problem.id}, languageId: ${languageId}`);
    const boilerplate = await prisma.problemBoilerplate.findFirst({
      where: { problemId: problem.id, languageId },
    });
    if (!boilerplate || !boilerplate.fullcode || !boilerplate.code) {
      console.warn(`[Run API] Boilerplate not found for problem: ${problemSlug}, language ID: ${languageId}`);
      return NextResponse.json({ error: 'Boilerplate for this language not found.' }, { status: 404 });
    }
    const finalCode = boilerplate.fullcode.replace(boilerplate.code, code);
    console.log(`[Run API] Using boilerplate for language ID ${languageId}`);
    console.log(`[Run API] Final code: ${finalCode}`);

    // --- Fetch sample test cases ---
    console.log(`[Run API] Fetching test cases for problemSlug: ${problemSlug}`);
    const allTestCases = await getTestCasesFromS3(problemSlug);
    const sampleTestCases = allTestCases.slice(0, 1);
    console.log(`[Run API] Sample test cases count: ${sampleTestCases.length}`);
    if (sampleTestCases.length === 0) {
      console.warn(`[Run API] No sample test cases found for problemSlug: ${problemSlug}`);
      return NextResponse.json({ error: 'No sample test cases found' }, { status: 404 });
    }

    // --- Create a temporary Submission record ---
    console.log(`[Run API] Creating submission record for userId: ${userId}, problemId: ${problem.id}, languageId: ${languageId}`);
    const runSession = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        languageId,
        code,
        statusId: 2, // "Processing"
        token: `run-${Date.now()}`,
      },
    });
    console.log(`[Run API] Created submission with id: ${runSession.id}`);

    // --- Create submissionTestCaseResults records and prepare test case map ---
    const testCaseMap = [];
    const judge0Promises = [];
    for (const testCase of sampleTestCases) {
      console.log(`[Run API] Creating submissionTestCaseResults for submissionId: ${runSession.id}`);
      const resultRecord = await prisma.submissionTestCaseResults.create({
        data: {
          submissionId: runSession.id,
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
      console.log(`[Run API] Created submissionTestCaseResults with id: ${resultRecord.id}`);
      testCaseMap.push({
        submissionTestCaseResultsId: resultRecord.id,
        input: testCase.input,
        output: testCase.output,
      });
      const callbackUrl = `${process.env.WEBHOOK_URL}?submissionTestCaseResultsId=${resultRecord.id}`;
      console.log(`[Run API] Dispatching to Judge0 for submissionTestCaseResultsId: ${resultRecord.id}`);
      const { key, host } = getAvailableApiKey();
      console.log(`[POST] /api/submit - Using Judge0 API key: ${key}`);
      judge0Promises.push(
        axios.post(
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
        )
      );
    }

    // --- Dispatch all jobs to Judge0 ---
    Promise.all(judge0Promises)
      .then(() => console.log("[Run API] All Judge0 jobs dispatched successfully."))
      .catch(err => console.error("[Run API] Error dispatching to Judge0:", err));

    // --- Return runId and test case map ---
    console.log(`[Run API] Returning runId: ${runSession.id} and ${testCaseMap.length} test cases`);
    return NextResponse.json({
      runId: runSession.id,
      testCases: testCaseMap,
    }, { status: 202 });

  } catch (error) {
    console.error('[Run API] Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}