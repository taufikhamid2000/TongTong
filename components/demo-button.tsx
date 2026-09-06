"use client";

import { startDemo } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/submit-button";

// "Try the demo — no account needed". A one-button form so the pending
// state comes for free from useFormStatus; startDemo signs in
// anonymously and redirects to /account.
export function DemoButton() {
  return (
    <form action={startDemo}>
      <SubmitButton
        pendingText="Starting demo…"
        className="w-full cursor-pointer rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Try the demo — no account needed
      </SubmitButton>
    </form>
  );
}
