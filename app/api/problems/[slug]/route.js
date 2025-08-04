/**
 * @fileoverview API endpoint to fetch the complete details for a single problem.
 * Route: /api/problems/[slug]
 * Method: GET
 * 
 * Returns the full details for a problem identified by its unique slug,
 * including boilerplate code for each language.
 */

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

/**
 * GET /api/problems/[slug]
 * Fetches a single problem by slug, including all relevant details.
 */
export async function GET(req, context) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      console.warn('[GET] /api/problems/[slug] - Missing slug parameter');
      return NextResponse.json({ error: 'Problem slug is required' }, { status: 400 });
    }

    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        description: true,
        inputFormat: true,
        outputFormat: true,
        constraints: true,
        sampleInput: true,
        sampleOutput: true,
        difficulty: true,
        boilerplates: {
          select: {
            id: true,
            code: true,
            fullcode: true,
            language: {
              select: {
                id: true,
                name: true,
                judge0Id: true,
              }
            }
          }
        }
      }
    });

    if (!problem) {
      console.warn(`[GET] /api/problems/[slug] - Problem not found for slug: ${slug}`);
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    console.log(`[GET] /api/problems/[slug] - Returned problem with slug: ${slug}`);
    return NextResponse.json(problem, { status: 200 });

  } catch (error) {
    console.error('[GET] /api/problems/[slug] - Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}