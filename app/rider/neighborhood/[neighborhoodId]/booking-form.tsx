"use client";

import { useActionState } from "react";
import { bookTrip } from "@/lib/rider/actions";

export function BookingForm({
  tripInstanceId,
  neighborhoodId,
  seatsLeft,
}: {
  tripInstanceId: string;
  neighborhoodId: string;
  seatsLeft: number;
}) {
  const [state, action, pending] = useActionState(
    bookTrip.bind(null, tripInstanceId, neighborhoodId),
    undefined
  );

  if (seatsLeft <= 0) {
    return <p className="text-sm text-zinc-500">Trip is full</p>;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        name="seatCount"
        type="number"
        min={1}
        max={Math.min(seatsLeft, 8)}
        defaultValue={1}
        className="w-16 rounded-md border border-black/[.08] px-2 py-1.5 text-sm dark:border-white/[.145]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Booking…" : "Book"}
      </button>
      {state?.errors?.seatCount && (
        <p className="text-sm text-red-600">{state.errors.seatCount[0]}</p>
      )}
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
