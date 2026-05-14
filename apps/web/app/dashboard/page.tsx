import Link from "next/link";

import { apiBaseUrl } from "@/lib/api-client";

const dashboardItems = [
  {
    label: "Profile",
    value: "Draft",
    detail: "Public profile setup",
    href: "/demo"
  },
  {
    label: "Endpoints",
    value: "0",
    detail: "Endpoint builder arrives later",
    href: "/demo/collaborate"
  },
  {
    label: "Inbox",
    value: "Open",
    detail: "Review demo submissions",
    href: "/dashboard/inbox"
  }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/" className="text-base font-semibold">
            OpenMe
          </Link>
          <Link
            href="/demo"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Public profile
          </Link>
        </header>

        <section className="py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--accent)]">
                Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
                Workspace overview
              </h1>
            </div>
            <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
              Dashboard placeholder
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {dashboardItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-[var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">API connection</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Public client base URL
                </p>
              </div>
              <span className="font-mono text-sm text-[var(--accent)]">
                {apiBaseUrl}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
