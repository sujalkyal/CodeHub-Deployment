/**
 * @fileoverview API endpoint to poll the status and results of a code submission.
 * Route: /api/submit/[submitId]
 * Method: GET
 * 
 * The frontend calls this endpoint with a submission ID to check for the final result.
 * Returns processing status, or final result with test case details.
 */

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

/**
 * GET /api/submit/[submitId]
 * Polls the status and results of a submission.
 */
export async function GET(req, context) {
  try {
    const { submitId } = await context.params;
    const numericId = parseInt(submitId, 10);
    console.log(`[GET] /api/submit/${submitId} - Polling for submission ID: ${numericId}`);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    // Fetch the submission and its related test case results
    const submission = await prisma.submission.findUnique({
      where: { id: numericId },
      include: { results: true }, // 'results' is the relation to submissionTestCaseResults
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if all test cases have been processed (i.e., are no longer -1)
    const allFinished = submission.results.every((r) => r.passed !== -1);

    // Prepare detailed test case results for frontend
    const testCaseResults = submission.results.map(r => ({
      id: r.id,
      passed: r.passed,
      statusId: r.statusId,
      statusDescription: r.statusDescription,
      stdout: r.stdout,
      stderr: r.stderr,
      compileOutput: r.compileOutput,
      message: r.message,
      time: r.time,
      memory: r.memory,
    }));

    if (!allFinished) {
      const finishedCount = submission.results.filter(r => r.passed !== -1).length;
      return NextResponse.json({
        statusId: 2, // "Processing"
        message: 'Submission is still being processed.',
        finishedCount,
        totalTestCases: submission.results.length,
        testCaseResults,
      }, { status: 200 });
    }

    // If all results are in, aggregate the overall status
    let finalStatusId = 3; // Default to Accepted
    let finalStatusDescription = 'Accepted';
    // If any test case is not Accepted, use the first non-accepted status as the overall status
    const nonAccepted = submission.results.find(r => r.statusId !== 3);
    if (nonAccepted) {
      finalStatusId = nonAccepted.statusId;
      finalStatusDescription = nonAccepted.statusDescription;
    }

    // Update submission status if still processing
    let finalSubmission = submission;
    if (submission.statusId === 2) {
      finalSubmission = await prisma.submission.update({
        where: { id: numericId },
        data: { statusId: finalStatusId },
        include: { results: true },
      });
    }

    const passedCount = submission.results.filter(r => r.passed === 1).length;
    return NextResponse.json({
      ...finalSubmission,
      passedCount,
      totalTestCases: submission.results.length,
      statusId: finalStatusId,
      statusDescription: finalStatusDescription,
      testCaseResults,
    }, { status: 200 });

  } catch (error) {
    console.error('[GET] /api/submit/[submitId] - Polling Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}