import Link from "next/link";
import { getMyOperator, getMyOperatorRoutes } from "@/lib/operator/dal";
import { OperatorForm } from "./operator-form";

export default async function OperatorDashboardPage() {
  const operator = await getMyOperator();

  if (!operator) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold">Set up your operator profile</h1>
          <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
            Before you can register a route, tell us who&apos;s running the shuttle.
          </p>
        </div>
        <OperatorForm />
      </div>
    );
  }

  const routes = await getMyOperatorRoutes();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{operator.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {operator.is_verified ? "Verified operator" : "Verification pending"}
          </p>
        </div>
        <Link
          href="/operator/routes/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          + New route
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Your routes</h2>
        {routes.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No routes yet. Create your first one to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {routes.map((route) => (
              <li key={route.id}>
                <Link
                  href={`/operator/routes/${route.id}`}
                  className="flex items-center justify-between rounded-md border border-black/[.08] px-4 py-3 transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.03]"
                >
                  <div>
                    <p className="font-medium">{route.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      → {route.destination_name}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {route.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
