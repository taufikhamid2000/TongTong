import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";

// A person can register more than one neighborhood (e.g. an admin who
// manages several blocks in the same condo, or several properties), so
// unlike operators this is a list, not a single record.
export const getMyNeighborhoods = cache(async () => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("tongtong_neighborhoods")
    .select("id, name, address, is_verified, created_at")
    .eq("admin_id", session.userId)
    .order("created_at", { ascending: false });

  return data ?? [];
});

// Loads a neighborhood the signed-in user administers, plus the routes
// currently serving it (read-only here — routes are managed by the
// operator, not the neighborhood admin).
export const getOwnedNeighborhoodDetail = cache(async (neighborhoodId: string) => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: neighborhood } = await supabase
    .from("tongtong_neighborhoods")
    .select("id, name, address, lat, lng, is_verified")
    .eq("id", neighborhoodId)
    .eq("admin_id", session.userId)
    .maybeSingle();

  if (!neighborhood) notFound();

  const { data: stops } = await supabase
    .from("tongtong_route_stops")
    .select(
      "id, stop_order, pickup_note, tongtong_routes(id, name, destination_name, status, tongtong_operators(name))"
    )
    .eq("neighborhood_id", neighborhoodId);

  return { neighborhood, stops: stops ?? [] };
});
