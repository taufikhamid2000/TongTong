import Link from "next/link";
import { getAllNeighborhoods } from "@/lib/rider/dal";

export default async function RiderHomePage() {
  const neighborhoods = await getAllNeighborhoods();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Find a shuttle near you</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose your neighborhood to see shuttles you can book.
        </p>
      </div>

      {neighborhoods.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No neighborhoods are registered yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {neighborhoods.map((n) => (
            <li key={n.id}>
              <Link
                href={`/rider/neighborhood/${n.id}`}
                className="flex flex-col rounded-md border border-black/[.08] px-4 py-3 transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <span className="font-medium">{n.name}</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{n.address}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/rider/bookings" className="text-sm underline">
        View your bookings →
      </Link>
    </div>
  );
}
