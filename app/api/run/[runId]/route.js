/**
 * @fileoverview Polling endpoint for the "Run" feature.
 * Returns detailed Judge0 results for each test case in a run session.
 *
 * Route: /api/run/[runId]
 * Method: GET
 *
 * - Returns all Judge0 fields for each test case
 * - Returns status: 'Processing' or 'Completed'
 * - (Optional) Cleans up the run session after completion
 */

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

export async function GET(req, { params }) {
  try {
    const { runId } = await params;
    const numericId = parseInt(runId);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid Run ID' }, { status: 400 });
    }

    // Fetch all test case results for this run, including all Judge0 fields
    const results = await prisma.submissionTestCaseResults.findMany({
      where: { submissionId: numericId },
      select: {
        id: true,
        passed: true,
        statusId: true,
        statusDescription: true,
        stdout: true,
        stderr: true,
        compileOutput: true,
        message: true,
        time: true,
        memory: true,
      },
    });

    // If no results, treat as already cleaned up
    if (!results || results.length === 0) {
      return NextResponse.json({ status: 'Completed', results: [] }, { status: 200 });
    }

    // Prepare a user-friendly response for each test case
    const testCaseResults = results.map(r => ({
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

    // If all test cases are finished, clean up and return results
    const allFinished = results.length > 0 && results.every((r) => r.passed !== -1);
    if (allFinished) {
      // Always clean up after completion
      try {
        await prisma.submission.delete({ where: { id: numericId } });
        console.log(`[Run Poll] Cleaned up Run Session with ID: ${numericId}`);
      } catch (cleanupErr) {
        // If already deleted, ignore
        console.warn(`[Run Poll] Cleanup warning for Run ID ${numericId}:`, cleanupErr.message);
      }
      return NextResponse.json({
        status: 'Completed',
        results: testCaseResults,
      }, { status: 200 });
    }

    // If still processing, return partial results
    return NextResponse.json({
      status: 'Processing',
      results: testCaseResults,
    }, { status: 200 });

  } catch (error) {
    console.error('[Run Poll] Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
