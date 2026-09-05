"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth/actions";
import { AuthBrandingPanel } from "@/components/auth-branding-panel";
import { LogoMark } from "@/components/logo-mark";
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/spinner";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 md:items-stretch">
      <AuthBrandingPanel />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted px-4 py-16">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <LogoMark size={28} />
          <span className="text-lg font-semibold text-foreground">TongTong</span>
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 animate-page-in">
          <h1 className="text-xl font-semibold text-foreground">Log in to TongTong</h1>
          <p className="mb-6 text-sm text-foreground/60">Book your next shuttle in a couple of taps.</p>

          <form action={action} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                aria-invalid={state?.errors?.email ? true : undefined}
                aria-describedby={state?.errors?.email ? "login-email-error" : undefined}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              />
              {state?.errors?.email && (
                <p id="login-email-error" role="alert" className="text-sm text-destructive">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                autoComplete="current-password"
                ariaInvalid={!!state?.errors?.password}
                ariaDescribedBy={state?.errors?.password ? "login-password-error" : undefined}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              />
              {state?.errors?.password && (
                <p id="login-password-error" role="alert" className="text-sm text-destructive">
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {state?.message && (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {pending && <Spinner />}
              {pending ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
