import { SignUp } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";

export default function SignUpPage() {
  if (!authEnabled) {
    return (
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Authentication isn&apos;t configured yet. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        and CLERK_SECRET_KEY in .env.local to enable sign-up.
      </p>
    );
  }
  return <SignUp />;
}
