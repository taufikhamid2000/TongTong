import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the auth token on every request — Server Components can't
// write cookies (see lib/supabase/server.ts's catch), so without this
// running in middleware, sessions would silently expire instead of
// refreshing.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Touches the session so an expired token gets refreshed — the return
  // value is unused here on purpose; each route decides its own auth
  // requirement rather than middleware enforcing one globally.
  await supabase.auth.getUser();

  return response;
}
