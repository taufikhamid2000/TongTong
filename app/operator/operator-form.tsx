"use client";

import { useActionState } from "react";
import { createOperator } from "@/lib/operator/actions";

export function OperatorForm() {
  const [state, action, pending] = useActionState(createOperator, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Operator name
        </label>
        <input
          id="name"
          name="name"
          placeholder="e.g. Sunrise Shuttle"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contactPhone" className="text-sm font-medium">
          Contact phone
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          placeholder="+60 12-345 6789"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.contactPhone && (
          <p className="text-sm text-red-600">{state.errors.contactPhone[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contactEmail" className="text-sm font-medium">
          Contact email
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="ops@example.com"
          className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
        />
        {state?.errors?.contactEmail && (
          <p className="text-sm text-red-600">{state.errors.contactEmail[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Creating…" : "Create operator profile"}
      </button>
    </form>
  );
}
