import "server-only";
import { authEnabled } from "./auth";

const DEMO_USER_ID = "demo-user";

/** Resolves the current user id for data scoping (portfolio, etc.). Server-only. */
export async function getCurrentUserId(): Promise<string> {
  if (!authEnabled) return DEMO_USER_ID;

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId ?? DEMO_USER_ID;
}
