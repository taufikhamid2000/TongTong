import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";

export const getAllNeighborhoods = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("neighborhoods")
    .select("id, name, address")
    .order("name", { ascending: true });

  return data ?? [];
});

export const getNeighborhood = cache(async (neighborhoodId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("neighborhoods")
    .select("id, name, address")
    .eq("id", neighborhoodId)
    .maybeSingle();

  return data;
});

// Open, still-bookable trips on any active route that stops at this
// neighborhood. Two queries rather than one deeply nested embed: routes
// are filtered by status first, then trip instances by route + open +
// not-yet-cut-off, which keeps each query's filters on a single level.
export const getBookableTripsForNeighborhood = cache(async (neighborhoodId: string) => {
  const supabase = await createClient();

  const { data: stops } = await supabase
    .from("route_stops")
    .select(
      "pickup_note, routes!inner(id, name, destination_name, status, operators(name))"
    )
    .eq("neighborhood_id", neighborhoodId)
    .eq("routes.status", "active");

  type RouteInfo = {
    id: string;
    name: string;
    destination_name: string;
    operators: { name: string } | null;
  };
  type Stop = { pickup_note: string | null; routes: RouteInfo | null };

  const typedStops = (stops ?? []) as unknown as Stop[];
  const routeIds = typedStops.map((s) => s.routes?.id).filter(Boolean) as string[];

  if (routeIds.length === 0) return [];

  const { data: trips } = await supabase
    .from("trip_instances")
    .select(
      "id, route_id, service_date, departure_at, booking_cutoff_at, status, total_cost, min_riders, max_riders, bookings(seat_count, status)"
    )
    .in("route_id", routeIds)
    .eq("status", "open")
    .gt("booking_cutoff_at", new Date().toISOString())
    .order("departure_at", { ascending: true });

  return (trips ?? []).map((trip) => {
    const stop = typedStops.find((s) => s.routes?.id === trip.route_id);
    const bookings =
      (trip as unknown as { bookings: { seat_count: number; status: string }[] })
        .bookings ?? [];
    const bookedSeats = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.seat_count, 0);

    return {
      ...trip,
      bookedSeats,
      seatsLeft: trip.max_riders - bookedSeats,
      route: stop?.routes ?? null,
      pickupNote: stop?.pickup_note ?? null,
      // Locked-at-cutoff pricing: nothing is charged until booking closes,
      // this is only an illustrative "at least this much per rider" floor
      // assuming no one else joins — more riders can only bring it down.
      estimatedPricePerRider: trip.total_cost / Math.max(bookedSeats, trip.min_riders, 1),
    };
  });
});

export const getMyBookings = cache(async () => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, seat_count, status, price_charged, created_at, trip_instances(id, service_date, departure_at, status, total_cost, price_per_rider, routes(name, destination_name)), payments(id, amount, status, paid_at)"
    )
    .eq("rider_id", session.userId)
    .order("created_at", { ascending: false });

  return data ?? [];
});
