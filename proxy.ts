import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  "/access",
  "/api/verify-access",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Family protected routes (need password)
const isFamilyProtectedRoute = createRouteMatcher([
  "/",
  "/create(.*)",
  "/room(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const hasFamilyAccess = req.cookies.get("family_access")?.value === "true";
  const { pathname } = req.nextUrl;

  // 1. CHECK FAMILY PASSWORD FIRST
  // If trying to access family route without password -> redirect to /access
  if (
    isFamilyProtectedRoute(req) &&
    !hasFamilyAccess &&
    pathname !== "/access"
  ) {
    const accessUrl = new URL("/access", req.url);
    return NextResponse.redirect(accessUrl);
  }

  // If on /access page but already has access -> redirect to home
  if (pathname === "/access" && hasFamilyAccess) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. THEN CHECK CLERK AUTH
  // If route is not public and user is not logged in -> redirect to sign-in
  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
