"use client";

import { useActionState } from "react";
import { addSchedule } from "@/lib/operator/actions";

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function ScheduleForm({ routeId }: { routeId: string }) {
  const [state, action, pending] = useActionState(
    addSchedule.bind(null, routeId),
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Days</span>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="daysOfWeek" value={day.value} />
              {day.label}
            </label>
          ))}
        </div>
        {state?.errors?.daysOfWeek && (
          <p className="text-sm text-red-600">{state.errors.daysOfWeek[0]}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="departureTime" className="text-sm font-medium">
            Departure time
          </label>
          <input
            id="departureTime"
            name="departureTime"
            type="time"
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
          {state?.errors?.departureTime && (
            <p className="text-sm text-red-600">{state.errors.departureTime[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="bookingCutoffMinutes" className="text-sm font-medium">
            Booking cutoff (minutes before departure)
          </label>
          <input
            id="bookingCutoffMinutes"
            name="bookingCutoffMinutes"
            type="number"
            min={5}
            defaultValue={60}
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.bookingCutoffMinutes && (
            <p className="text-sm text-red-600">{state.errors.bookingCutoffMinutes[0]}</p>
          )}
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        {pending ? "Adding…" : "Add schedule"}
      </button>
    </form>
  );
}
