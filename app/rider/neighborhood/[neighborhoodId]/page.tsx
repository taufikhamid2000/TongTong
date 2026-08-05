import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookableTripsForNeighborhood, getNeighborhood } from "@/lib/rider/dal";
import { BookingForm } from "./booking-form";

export default async function NeighborhoodTripsPage({
  params,
}: {
  params: Promise<{ neighborhoodId: string }>;
}) {
  const { neighborhoodId } = await params;
  const neighborhood = await getNeighborhood(neighborhoodId);
  if (!neighborhood) notFound();

  const trips = await getBookableTripsForNeighborhood(neighborhoodId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/rider" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          ← Choose a different neighborhood
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Shuttles from {neighborhood.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{neighborhood.address}</p>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No shuttles are open for booking from this neighborhood right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex flex-col gap-2 rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {trip.route?.name} → {trip.route?.destination_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(trip.departure_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Operated by {trip.route?.tongtong_operators?.name ?? "unknown"}
                {trip.pickupNote && ` · ${trip.pickupNote}`}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {trip.bookedSeats}/{trip.max_riders} seats booked · from RM{" "}
                {trip.estimatedPricePerRider.toFixed(2)}/rider — price locks and may drop
                once booking closes at {new Date(trip.booking_cutoff_at).toLocaleString()}
              </p>
              <BookingForm
                tripInstanceId={trip.id}
                neighborhoodId={neighborhoodId}
                seatsLeft={trip.seatsLeft}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
