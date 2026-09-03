import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-12 bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">TongTong</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Pool a ride with your neighbors. The more riders join, the cheaper it gets
          for everyone.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        <Link
          href="/rider"
          className="flex flex-col gap-1 rounded-lg border border-black/[.08] bg-white px-5 py-4 transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:bg-black dark:hover:bg-white/[.03]"
        >
          <span className="font-medium">I&apos;m a rider</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Browse routes near you — sign in only when you&apos;re ready to book
          </span>
        </Link>

        <Link
          href="/operator"
          className="flex flex-col gap-1 rounded-lg border border-black/[.08] bg-white px-5 py-4 transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:bg-black dark:hover:bg-white/[.03]"
        >
          <span className="font-medium">I run a shuttle</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Register a route and schedule
          </span>
        </Link>

        <Link
          href="/neighborhood"
          className="flex flex-col gap-1 rounded-lg border border-black/[.08] bg-white px-5 py-4 transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:bg-black dark:hover:bg-white/[.03]"
        >
          <span className="font-medium">I manage a neighborhood</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Register a pickup point
          </span>
        </Link>
      </div>

      {user ? (
        <Link href="/account" className="text-sm underline">
          View your account →
        </Link>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/signup" className="font-medium underline">
            Sign up
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-medium underline">
            log in
          </Link>{" "}
          to get started.
        </p>
      )}
    </div>
  );
}
