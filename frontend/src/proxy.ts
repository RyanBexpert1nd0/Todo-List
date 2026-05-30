import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = !!(publishableKey && publishableKey.startsWith("pk_") && !publishableKey.includes("placeholder"));

// Define which routes are public (unprotected)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)"
]);

export default clerkMiddleware(async (auth, request) => {
  if (isClerkConfigured) {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|png|jpg|jpeg|webp|vector|coffeescript|jack|less|sass|scss|jpeg|gif|png|ico|xml|woff2|woff|ttf|svg|css|js)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
