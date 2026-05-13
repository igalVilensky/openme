import Link from "next/link";

import { formatHandle, normalizeUsernameSlug } from "@/lib/username";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const usernameSlug = normalizeUsernameSlug(username);
  const handle = formatHandle(usernameSlug);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/" className="text-base font-semibold">
            OpenMe
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Dashboard
          </Link>
        </header>

        <section className="py-10">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--accent)]">
                  Public profile
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
                  {handle}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                  This profile shell is ready for real profile data in the next
                  build step.
                </p>
              </div>
              <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
                Profile placeholder
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link
                href={`/${usernameSlug}/now`}
                className="rounded-md border border-[var(--line)] p-4 transition hover:border-[var(--ink-blue)]"
              >
                <p className="text-xs font-semibold text-[var(--ink-blue)]">
                  GET
                </p>
                <p className="mt-2 font-mono text-sm">/now</p>
              </Link>
              <Link
                href={`/${usernameSlug}/collaborate`}
                className="rounded-md border border-[var(--line)] p-4 transition hover:border-[var(--accent)]"
              >
                <p className="text-xs font-semibold text-[var(--accent)]">
                  POST
                </p>
                <p className="mt-2 font-mono text-sm">/collaborate</p>
              </Link>
              <Link
                href={`/${usernameSlug}/ask-me`}
                className="rounded-md border border-[var(--line)] p-4 transition hover:border-[var(--signal)]"
              >
                <p className="text-xs font-semibold text-[var(--signal)]">
                  POST
                </p>
                <p className="mt-2 font-mono text-sm">/ask-me</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
