import Link from "next/link";
import { getMyNeighborhoods } from "@/lib/neighborhood/dal";
import { NeighborhoodForm } from "./neighborhood-form";

export default async function NeighborhoodDashboardPage() {
  const neighborhoods = await getMyNeighborhoods();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Your neighborhoods</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Register a pickup point so operators can add it to their routes.
        </p>
      </div>

      {neighborhoods.length > 0 && (
        <ul className="flex flex-col gap-2">
          {neighborhoods.map((neighborhood) => (
            <li key={neighborhood.id}>
              <Link
                href={`/neighborhood/${neighborhood.id}`}
                className="flex items-center justify-between rounded-md border border-black/[.08] px-4 py-3 transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div>
                  <p className="font-medium">{neighborhood.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {neighborhood.address}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {neighborhood.is_verified ? "verified" : "pending"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Register a new neighborhood</h2>
        <NeighborhoodForm />
      </div>
    </div>
  );
}
