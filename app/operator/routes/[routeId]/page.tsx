import { getOwnedRouteDetail } from "@/lib/operator/dal";
import { publishRoute } from "@/lib/operator/actions";
import { StopForm } from "./stop-form";
import { ScheduleForm } from "./schedule-form";
import { TripInstanceForm } from "./trip-instance-form";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  const { route, stops, schedules, neighborhoods, tripInstances } =
    await getOwnedRouteDetail(routeId);

  const usedNeighborhoodIds = new Set(stops.map((s) => s.neighborhood_id));
  const availableNeighborhoods = neighborhoods.filter((n) => !usedNeighborhoodIds.has(n.id));
  const nextOrder = stops.length > 0 ? Math.max(...stops.map((s) => s.stop_order)) + 1 : 1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{route.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            → {route.destination_name}
          </p>
        </div>
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          {route.status}
        </span>
      </div>

      {route.status === "draft" && (
        <div className="flex items-center justify-between rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This route is still a draft — riders can&apos;t see it until it&apos;s published.
          </p>
          <form action={publishRoute.bind(null, route.id)}>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Publish route
            </button>
          </form>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Pickup stops</h2>
        {stops.length > 0 && (
          <ol className="flex flex-col gap-2">
            {stops.map((stop) => (
              <li
                key={stop.id}
                className="flex items-center gap-3 rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
              >
                <span className="text-sm font-medium text-zinc-500">#{stop.stop_order}</span>
                <div>
                  <p className="font-medium">
                    {(stop as { tongtong_neighborhoods?: { name?: string } }).tongtong_neighborhoods
                      ?.name ?? "Unknown neighborhood"}
                  </p>
                  {stop.pickup_note && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{stop.pickup_note}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        <StopForm routeId={route.id} neighborhoods={availableNeighborhoods} nextOrder={nextOrder} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Schedules</h2>
        {schedules.length > 0 && (
          <ul className="flex flex-col gap-2">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
              >
                <p className="font-medium">
                  {schedule.departure_time} ·{" "}
                  {schedule.days_of_week
                    .slice()
                    .sort((a: number, b: number) => a - b)
                    .map((d: number) => DAY_LABELS[d])
                    .join(", ")}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Booking closes {schedule.booking_cutoff_minutes} min before departure
                </p>
              </li>
            ))}
          </ul>
        )}
        <ScheduleForm routeId={route.id} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Trips</h2>
        {tripInstances.length > 0 && (
          <ul className="flex flex-col gap-2">
            {tripInstances.map((trip) => (
              <li
                key={trip.id}
                className="rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {new Date(trip.departure_at).toLocaleString()}
                  </p>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {trip.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {trip.bookedSeats}/{trip.max_riders} seats booked (min {trip.min_riders}) · RM{" "}
                  {trip.total_cost} total
                  {trip.price_per_rider != null && ` · RM ${trip.price_per_rider}/rider locked`}
                </p>
              </li>
            ))}
          </ul>
        )}
        <TripInstanceForm routeId={route.id} schedules={schedules} />
      </section>
    </div>
  );
}
