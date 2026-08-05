"use client";

import { useActionState } from "react";
import { addRouteStop } from "@/lib/operator/actions";

type Neighborhood = { id: string; name: string };

export function StopForm({
  routeId,
  neighborhoods,
  nextOrder,
}: {
  routeId: string;
  neighborhoods: Neighborhood[];
  nextOrder: number;
}) {
  const [state, action, pending] = useActionState(
    addRouteStop.bind(null, routeId),
    undefined
  );

  if (neighborhoods.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No neighborhoods are registered yet — stops can be added once at least one
        neighborhood signs up.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="neighborhoodId" className="text-sm font-medium">
          Neighborhood
        </label>
        <select
          id="neighborhoodId"
          name="neighborhoodId"
          defaultValue=""
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        >
          <option value="" disabled>
            Choose a neighborhood
          </option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        {state?.errors?.neighborhoodId && (
          <p className="text-sm text-red-600">{state.errors.neighborhoodId[0]}</p>
        )}
      </div>

      <div className="flex w-24 flex-col gap-1">
        <label htmlFor="stopOrder" className="text-sm font-medium">
          Order
        </label>
        <input
          id="stopOrder"
          name="stopOrder"
          type="number"
          min={1}
          defaultValue={nextOrder}
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.stopOrder && (
          <p className="text-sm text-red-600">{state.errors.stopOrder[0]}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="pickupNote" className="text-sm font-medium">
          Pickup note
        </label>
        <input
          id="pickupNote"
          name="pickupNote"
          placeholder="e.g. Main lobby, 7:15am"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        {pending ? "Adding…" : "Add stop"}
      </button>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
