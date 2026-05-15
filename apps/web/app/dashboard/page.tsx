import Link from "next/link";

import { DashboardHome } from "./dashboard-home";
import { LogoutButton } from "./logout-button";

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/" className="text-base font-semibold">
            OpenMe
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
            >
              Demo profile
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="py-10">
          <DashboardHome />
        </section>
      </div>
    </main>
  );
}
