import { getProfile, verifySession } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

export default async function AccountPage() {
  const session = await verifySession();
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{session.email}</p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-full border border-black/[.08] px-5 py-2.5 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
