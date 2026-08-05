import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";

// The operator owned by the signed-in user, if they've completed
// operator onboarding. Null (not a redirect) so callers can render an
// onboarding form instead of a dead end.
export const getMyOperator = cache(async () => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("tongtong_operators")
    .select("id, name, contact_phone, contact_email, is_verified, created_at")
    .eq("owner_id", session.userId)
    .maybeSingle();

  return data;
});

export const getMyOperatorRoutes = cache(async () => {
  const operator = await getMyOperator();
  if (!operator) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("tongtong_routes")
    .select("id, name, destination_name, status, created_at")
    .eq("operator_id", operator.id)
    .order("created_at", { ascending: false });

  return data ?? [];
});

// Loads a route the signed-in user's operator owns, its stops, and its
// schedules. 404s (rather than redirecting) if the route doesn't exist
// or belongs to someone else — RLS would block the read either way, this
// just gives a clean not-found instead of an empty-looking page.
export const getOwnedRouteDetail = cache(async (routeId: string) => {
  const operator = await getMyOperator();
  if (!operator) notFound();

  const supabase = await createClient();

  const { data: route } = await supabase
    .from("tongtong_routes")
    .select("id, name, destination_name, destination_lat, destination_lng, status, operator_id")
    .eq("id", routeId)
    .eq("operator_id", operator.id)
    .maybeSingle();

  if (!route) notFound();

  const [{ data: stops }, { data: schedules }, { data: neighborhoods }, { data: tripInstances }] =
    await Promise.all([
      supabase
        .from("tongtong_route_stops")
        .select("id, stop_order, pickup_note, neighborhood_id, tongtong_neighborhoods(name, address)")
        .eq("route_id", routeId)
        .order("stop_order", { ascending: true }),
      supabase
        .from("tongtong_schedules")
        .select("id, days_of_week, departure_time, booking_cutoff_minutes, is_active")
        .eq("route_id", routeId)
        .order("departure_time", { ascending: true }),
      supabase
        .from("tongtong_neighborhoods")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase
        .from("tongtong_trip_instances")
        .select(
          "id, service_date, departure_at, booking_cutoff_at, status, total_cost, min_riders, max_riders, price_per_rider, tongtong_bookings(seat_count, status)"
        )
        .eq("route_id", routeId)
        .order("departure_at", { ascending: false }),
    ]);

  const tripInstancesWithCounts = (tripInstances ?? []).map((trip) => {
    const bookings =
      (trip as unknown as { tongtong_bookings: { seat_count: number; status: string }[] })
        .tongtong_bookings ?? [];
    const bookedSeats = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.seat_count, 0);
    return { ...trip, bookedSeats };
  });

  return {
    route,
    stops: stops ?? [],
    schedules: schedules ?? [],
    neighborhoods: neighborhoods ?? [],
    tripInstances: tripInstancesWithCounts,
  };
});
