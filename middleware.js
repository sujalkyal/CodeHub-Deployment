// middleware.ts or middleware.js
import { clerkMiddleware, auth, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/api/run(.*)',
  '/api/submit(.*)',
]);

export default clerkMiddleware(async (authInstance, req) => {
  if (isProtectedRoute(req)) {
    await authInstance.protect();
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/(api|trpc)(.*)',
  ],
};
