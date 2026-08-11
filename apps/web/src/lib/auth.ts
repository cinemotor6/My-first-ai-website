/**
 * Client-safe auth flag. Only the NEXT_PUBLIC_ key is checked here so this
 * evaluates the same way on the client and the server (CLERK_SECRET_KEY is
 * server-only and would be undefined in client bundles). Both keys are
 * required together for Clerk to actually work — see .env.example.
 *
 * For server-only helpers (e.g. reading the current user id), see
 * lib/auth-server.ts — keeping it separate avoids pulling Clerk's server
 * SDK into client bundles like the Topbar.
 */
export const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
