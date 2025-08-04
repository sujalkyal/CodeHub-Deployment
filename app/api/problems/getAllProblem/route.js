/**
 * @fileoverview API endpoint to fetch a list of all coding problems.
 * Route: /api/problems/getAllProblem
 * Method: GET
 * 
 * Returns a list of problems with their id, title, slug, difficulty, and tags.
 * Intended for use on the main problems listing page.
 */

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

/**
 * GET /api/problems/getAllProblem
 * Fetches all problems from the database.
 */
export async function GET(req) {
  console.log('[GET] /api/problems/getAllProblem - Fetching all problems');
  try {
    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      }
    });

    const formattedProblems = problems.map(problem => ({
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      tags: problem.tags.map(pt => pt.tag.name),
    }));

    console.log(`[GET] /api/problems/getAllProblem - Returned ${formattedProblems.length} problems`);
    return NextResponse.json(formattedProblems, { status: 200 });

  } catch (error) {
    console.error('[GET] /api/problems/getAllProblem - Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}