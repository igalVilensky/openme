import Link from "next/link";

const endpointExamples = [
  { method: "GET", path: "/now", tone: "text-[var(--ink-blue)]" },
  { method: "POST", path: "/collaborate", tone: "text-[var(--accent)]" },
  { method: "POST", path: "/ask-me", tone: "text-[var(--signal)]" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/" className="text-base font-semibold tracking-[0]">
            OpenMe
          </Link>
          <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link
              href="/demo"
              className="rounded-md px-3 py-2 transition hover:bg-white"
            >
              Public profile
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-[var(--foreground)] px-3 py-2 text-white transition hover:bg-[var(--accent-strong)]"
            >
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase text-[var(--accent)]">
              Actionable bio pages
            </p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[0] text-balance sm:text-6xl">
              OpenMe
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Links show where someone is. OpenMe shows what people can do with
              them through clear public endpoints.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
              >
                View sample profile
              </Link>
              <Link
                href="/demo/collaborate"
                className="rounded-md border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)]"
              >
                Open sample endpoint
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <p className="text-sm font-semibold">@demo</p>
                <p className="text-xs text-[var(--muted)]">Public endpoints</p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                Online
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {endpointExamples.map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-md border border-[var(--line)] px-3 py-3"
                >
                  <span className={`text-xs font-semibold ${endpoint.tone}`}>
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-sm">{endpoint.path}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-md bg-[#f2efe7] p-4">
              <p className="text-sm font-medium">Boundary</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Keep requests specific, respectful, and easy to answer.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
