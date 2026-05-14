import Link from "next/link";

import { InboxList } from "./inbox-list";

export default function DashboardInboxPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/dashboard" className="text-base font-semibold">
            OpenMe
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
            >
              Public profile
            </Link>
          </div>
        </header>

        <section className="py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--accent)]">
                Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
                Inbox
              </h1>
            </div>
            <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
              Demo owner
            </div>
          </div>

          <div className="mt-8">
            <InboxList />
          </div>
        </section>
      </div>
    </main>
  );
}
