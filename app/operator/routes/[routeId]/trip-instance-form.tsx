"use client";

import { useActionState } from "react";
import { createTripInstance } from "@/lib/operator/actions";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Schedule = {
  id: string;
  days_of_week: number[];
  departure_time: string;
  booking_cutoff_minutes: number;
};

export function TripInstanceForm({
  routeId,
  schedules,
}: {
  routeId: string;
  schedules: Schedule[];
}) {
  const [state, action, pending] = useActionState(
    createTripInstance.bind(null, routeId),
    undefined
  );

  if (schedules.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Add a schedule above before opening a trip for a specific date.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="scheduleId" className="text-sm font-medium">
          Schedule
        </label>
        <select
          id="scheduleId"
          name="scheduleId"
          defaultValue=""
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        >
          <option value="" disabled>
            Choose a schedule
          </option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.departure_time} ·{" "}
              {s.days_of_week
                .slice()
                .sort((a, b) => a - b)
                .map((d) => DAY_LABELS[d])
                .join(", ")}
            </option>
          ))}
        </select>
        {state?.errors?.scheduleId && (
          <p className="text-sm text-red-600">{state.errors.scheduleId[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="serviceDate" className="text-sm font-medium">
          Service date
        </label>
        <input
          id="serviceDate"
          name="serviceDate"
          type="date"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        {state?.errors?.serviceDate && (
          <p className="text-sm text-red-600">{state.errors.serviceDate[0]}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="totalCost" className="text-sm font-medium">
            Total trip cost (RM)
          </label>
          <input
            id="totalCost"
            name="totalCost"
            type="number"
            min={0}
            step="0.01"
            placeholder="120.00"
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.totalCost && (
            <p className="text-sm text-red-600">{state.errors.totalCost[0]}</p>
          )}
        </div>

        <div className="flex w-28 flex-col gap-1">
          <label htmlFor="minRiders" className="text-sm font-medium">
            Min riders
          </label>
          <input
            id="minRiders"
            name="minRiders"
            type="number"
            min={1}
            defaultValue={1}
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.minRiders && (
            <p className="text-sm text-red-600">{state.errors.minRiders[0]}</p>
          )}
        </div>

        <div className="flex w-28 flex-col gap-1">
          <label htmlFor="maxRiders" className="text-sm font-medium">
            Max riders
          </label>
          <input
            id="maxRiders"
            name="maxRiders"
            type="number"
            min={1}
            defaultValue={10}
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.maxRiders && (
            <p className="text-sm text-red-600">{state.errors.maxRiders[0]}</p>
          )}
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        {pending ? "Opening…" : "Open trip for booking"}
      </button>
    </form>
  );
}
