"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import { register as registerAccount } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await registerAccount({
        email: email.trim(),
        password,
        username: username.trim(),
        displayName: displayName.trim(),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to create account",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/" className="text-base font-semibold">
            OpenMe
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Log in
          </Link>
        </header>

        <section className="py-10">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--accent)]">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[0]">
              Register
            </h1>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  autoComplete="email"
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                  minLength={8}
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  autoComplete="username"
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                  required
                  title="Use 3-30 lowercase letters, numbers, or hyphens."
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="display-name">
                  Display name
                </label>
                <input
                  id="display-name"
                  autoComplete="name"
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                  required
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>

              {errorMessage ? (
                <p
                  className="rounded-md border border-[#d19a7a] bg-[#fff8f2] p-3 text-sm leading-6 text-[#7a341b]"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              <button
                className="w-full rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              Already registered?{" "}
              <Link className="font-medium text-[var(--accent)]" href="/login">
                Log in
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
