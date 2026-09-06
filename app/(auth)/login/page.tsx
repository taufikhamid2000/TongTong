import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // startDemo (a plain server action, no form state) reports failure by
  // redirecting back here with ?error=… — surfaced as a generic apology
  // rather than echoing the raw Supabase message.
  const initialError = error ? "The demo is unavailable right now. Please try again." : undefined;

  return <LoginForm initialError={initialError} />;
}
