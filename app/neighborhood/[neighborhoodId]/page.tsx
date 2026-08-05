import { getOwnedNeighborhoodDetail } from "@/lib/neighborhood/dal";

type StopWithRoute = {
  id: string;
  stop_order: number;
  pickup_note: string | null;
  tongtong_routes: {
    id: string;
    name: string;
    destination_name: string;
    status: string;
    tongtong_operators: { name: string } | null;
  } | null;
};

export default async function NeighborhoodDetailPage({
  params,
}: {
  params: Promise<{ neighborhoodId: string }>;
}) {
  const { neighborhoodId } = await params;
  const { neighborhood, stops } = await getOwnedNeighborhoodDetail(neighborhoodId);
  const typedStops = stops as unknown as StopWithRoute[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{neighborhood.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{neighborhood.address}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
          {neighborhood.is_verified ? "Verified" : "Verification pending"}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Shuttles serving this neighborhood</h2>
        {typedStops.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No operator has added this neighborhood to a route yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {typedStops.map((stop) => (
              <li
                key={stop.id}
                className="rounded-md border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
              >
                <p className="font-medium">
                  {stop.tongtong_routes?.name ?? "Unknown route"} →{" "}
                  {stop.tongtong_routes?.destination_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Operated by {stop.tongtong_routes?.tongtong_operators?.name ?? "unknown"} ·{" "}
                  {stop.tongtong_routes?.status}
                </p>
                {stop.pickup_note && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{stop.pickup_note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
