import { createBrowserClient } from "@supabase/ssr";

// For use in Client Components. Reads the anon key only — safe to bundle,
// row-level security policies (see supabase/migrations) are what actually
// restrict what this client can read/write, not secrecy of the key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
