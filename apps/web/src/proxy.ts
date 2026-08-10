import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

/**
 * When Clerk keys are present, protect every dashboard route behind
 * sign-in. When they're not (fresh clone, no Clerk project yet), fall
 * through so the app is usable immediately with mock data.
 */
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!authEnabled) return NextResponse.next();

  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
  const isPublicRoute = createRouteMatcher(PUBLIC_PATHS.map((p) => `${p}(.*)`));

  const handler = clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  });

  return handler(req, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
