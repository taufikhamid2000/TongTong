import { getMyBookings } from "@/lib/rider/dal";
import { cancelBooking, markPaymentPaid } from "@/lib/rider/actions";

type BookingRow = {
  id: string;
  seat_count: number;
  status: string;
  price_charged: number | null;
  tongtong_trip_instances: {
    id: string;
    service_date: string;
    departure_at: string;
    status: string;
    total_cost: number;
    price_per_rider: number | null;
    tongtong_routes: { name: string; destination_name: string } | null;
  } | null;
  tongtong_payments: { id: string; amount: number; status: string; paid_at: string | null }[];
};

export default async function MyBookingsPage() {
  const bookings = (await getMyBookings()) as unknown as BookingRow[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">Your bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You haven&apos;t booked a shuttle yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((booking) => {
            const trip = booking.tongtong_trip_instances;
            const payment = booking.tongtong_payments[0];
            return (
              <li
                key={booking.id}
                className="flex flex-col gap-2 rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {trip?.tongtong_routes?.name} → {trip?.tongtong_routes?.destination_name}
                  </p>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {trip ? new Date(trip.departure_at).toLocaleString() : "—"} ·{" "}
                  {booking.seat_count} seat{booking.seat_count > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {booking.price_charged != null
                    ? `RM ${booking.price_charged} charged`
                    : booking.status === "cancelled" && trip?.status === "cancelled"
                      ? "Trip didn't reach the minimum riders — not charged"
                      : booking.status === "cancelled"
                        ? "Cancelled — not charged"
                        : "Price locks once booking closes for this trip"}
                </p>
                {payment && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Payment:{" "}
                    <span className="font-medium">
                      {payment.status === "paid"
                        ? `paid ${new Date(payment.paid_at!).toLocaleDateString()}`
                        : payment.status}
                    </span>
                  </p>
                )}

                <div className="flex gap-2">
                  {booking.status === "pending" && trip?.status === "open" && (
                    <form action={cancelBooking.bind(null, booking.id)}>
                      <button
                        type="submit"
                        className="w-fit rounded-full border border-black/[.08] px-4 py-1.5 text-sm transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                      >
                        Cancel booking
                      </button>
                    </form>
                  )}

                  {payment?.status === "pending" && (
                    <form action={markPaymentPaid.bind(null, payment.id)}>
                      <button
                        type="submit"
                        className="w-fit rounded-full bg-foreground px-4 py-1.5 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                      >
                        Mark RM {payment.amount} as paid
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
