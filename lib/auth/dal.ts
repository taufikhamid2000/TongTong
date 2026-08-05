import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Supabase already re-verifies the JWT against its servers on getUser(),
// so this is a "secure" check per the Next.js auth guide, not just an
// optimistic cookie read. cache() dedupes repeat calls within one render.
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { isAuth: true, userId: user.id, email: user.email };
});

export const getProfile = cache(async () => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("tongtong_profiles")
    .select("id, full_name, phone, created_at")
    .eq("id", session.userId)
    .single();

  return profile;
});
