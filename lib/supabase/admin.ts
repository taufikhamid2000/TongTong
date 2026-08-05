import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses row-level security entirely. `server-only`
// makes it a build error to import this from a Client Component. Use only
// for operations a normal user's RLS policies must never allow (e.g.
// approving an operator's verification), not as a shortcut past RLS
// bugs elsewhere.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
