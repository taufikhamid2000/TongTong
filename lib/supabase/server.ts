import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// For use in Server Components/Actions/Route Handlers. Cookie writes are
// wrapped in try/catch because a Server Component can't set cookies —
// only a Server Action or Route Handler can. Middleware (see
// middleware.ts, once added) is what actually refreshes the session on
// every request; this silent catch just avoids crashing when called
// from a context that can't persist the refreshed token itself.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}
