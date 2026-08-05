"use client";

import { useActionState } from "react";
import { createRoute } from "@/lib/operator/actions";

export function RouteForm() {
  const [state, action, pending] = useActionState(createRoute, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Route name
        </label>
        <input
          id="name"
          name="name"
          placeholder="e.g. Bandar Utama - MRT Bandar Utama"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="destinationName" className="text-sm font-medium">
          Destination station
        </label>
        <input
          id="destinationName"
          name="destinationName"
          placeholder="e.g. MRT Bandar Utama"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.destinationName && (
          <p className="text-sm text-red-600">{state.errors.destinationName[0]}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="destinationLat" className="text-sm font-medium">
            Latitude
          </label>
          <input
            id="destinationLat"
            name="destinationLat"
            type="number"
            step="any"
            placeholder="3.1478"
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.destinationLat && (
            <p className="text-sm text-red-600">{state.errors.destinationLat[0]}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="destinationLng" className="text-sm font-medium">
            Longitude
          </label>
          <input
            id="destinationLng"
            name="destinationLng"
            type="number"
            step="any"
            placeholder="101.6153"
            className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          />
          {state?.errors?.destinationLng && (
            <p className="text-sm text-red-600">{state.errors.destinationLng[0]}</p>
          )}
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Creating…" : "Create route"}
      </button>
    </form>
  );
}
