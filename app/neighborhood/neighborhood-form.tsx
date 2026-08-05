"use client";

import { useActionState } from "react";
import { createNeighborhood } from "@/lib/neighborhood/actions";

export function NeighborhoodForm() {
  const [state, action, pending] = useActionState(createNeighborhood, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Neighborhood name
        </label>
        <input
          id="name"
          name="name"
          placeholder="e.g. Sunway Condo Block A"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <input
          id="address"
          name="address"
          placeholder="Full pickup address"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.address && (
          <p className="text-sm text-red-600">{state.errors.address[0]}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="lat" className="text-sm font-medium">
            Latitude
          </label>
          <input
            id="lat"
            name="lat"
            type="number"
            step="any"
            placeholder="3.1478"
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.lat && (
            <p className="text-sm text-red-600">{state.errors.lat[0]}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="lng" className="text-sm font-medium">
            Longitude
          </label>
          <input
            id="lng"
            name="lng"
            type="number"
            step="any"
            placeholder="101.6153"
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.lng && (
            <p className="text-sm text-red-600">{state.errors.lng[0]}</p>
          )}
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Registering…" : "Register neighborhood"}
      </button>
    </form>
  );
}
