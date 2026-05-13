import Link from "next/link";

type EndpointPageProps = {
  params: Promise<{
    username: string;
    endpointSlug: string;
  }>;
};

function formatHandle(segment: string): string {
  const username = decodeURIComponent(segment);
  return username.startsWith("@") ? username : `@${username}`;
}

function formatSlug(segment: string): string {
  return decodeURIComponent(segment);
}

function inferMethod(slug: string): "GET" | "POST" {
  return ["about", "links", "now"].includes(slug) ? "GET" : "POST";
}

export default async function PublicEndpointPage({
  params
}: EndpointPageProps) {
  const { username, endpointSlug } = await params;
  const handle = formatHandle(username);
  const slug = formatSlug(endpointSlug);
  const method = inferMethod(slug);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href={`/${handle}`} className="text-base font-semibold">
            {handle}
          </Link>
          <Link
            href="/"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            OpenMe
          </Link>
        </header>

        <section className="py-10">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p
                  className={
                    method === "GET"
                      ? "text-sm font-semibold text-[var(--ink-blue)]"
                      : "text-sm font-semibold text-[var(--accent)]"
                  }
                >
                  {method}
                </p>
                <h1 className="mt-3 font-mono text-3xl font-semibold tracking-[0]">
                  /{slug}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                  This endpoint page is a placeholder for the public submission
                  flow.
                </p>
              </div>
              <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
                Endpoint placeholder
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-md border border-[var(--line)] p-4">
                <p className="text-sm font-medium">Question</p>
                <div className="mt-3 h-11 rounded-md border border-dashed border-[var(--line)] bg-[#fbfaf7]" />
              </div>
              <div className="rounded-md border border-[var(--line)] p-4">
                <p className="text-sm font-medium">Boundary check</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Submission handling comes after public profile fetching.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
