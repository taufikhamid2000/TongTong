import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called on a schedule (see vercel.json) to lock trips whose booking
// window has closed — computing price_per_rider for trips that hit
// min_riders, cancelling the ones that didn't. Runs as the admin client
// since this is a system operation, not something any single operator
// or rider is authorized to trigger through RLS.
//
// Protected by CRON_SECRET rather than auth/RLS: Vercel Cron calls this
// as an anonymous HTTP request, so the shared secret is what proves the
// caller is the scheduler and not a public client hitting the route.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("tongtong_lock_due_trips");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
