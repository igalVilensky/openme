import Link from "next/link";

import { ApiClientError, apiClient } from "@/lib/api-client";
import { formatHandle, normalizeUsernameSlug } from "@/lib/username";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  languages: string[];
  status: string | null;
  currentFocus: string | null;
  avatarUrl: string | null;
  links: Array<{
    id: string;
    title: string;
    url: string;
    position: number;
  }>;
  endpoints: Array<{
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
    description: string | null;
    position: number;
    boundaries: Array<{
      id: string;
      title: string;
      description: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    }>;
  }>;
};

async function getPublicProfile(
  usernameSlug: string
): Promise<PublicProfile | null> {
  try {
    return await apiClient<PublicProfile>(
      `/public/profiles/${encodeURIComponent(usernameSlug)}`,
      {
        cache: "no-store"
      }
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function ProfileNotFound({ handle }: { handle: string }) {
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
            <p className="text-sm font-medium text-[var(--accent)]">
              Public profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
              {handle}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              This public profile is not available.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const usernameSlug = normalizeUsernameSlug(username);
  const profile = await getPublicProfile(usernameSlug);
  const handle = formatHandle(profile?.username ?? usernameSlug);

  if (!profile) {
    return <ProfileNotFound handle={handle} />;
  }

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
                <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                  {handle}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
                  {profile.displayName ?? handle}
                </h1>
                {profile.headline ? (
                  <p className="mt-3 max-w-2xl text-lg leading-7">
                    {profile.headline}
                  </p>
                ) : null}
                {profile.bio ? (
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                    {profile.bio}
                  </p>
                ) : null}
              </div>
              <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
                {profile.status ?? "Public profile"}
              </div>
            </div>

            {profile.currentFocus ||
            profile.location ||
            profile.languages.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                {profile.currentFocus ? (
                  <span className="rounded-md bg-[#f2efe7] px-3 py-2">
                    {profile.currentFocus}
                  </span>
                ) : null}
                {profile.location ? (
                  <span className="rounded-md bg-[#f2efe7] px-3 py-2">
                    {profile.location}
                  </span>
                ) : null}
                {profile.languages.map((language) => (
                  <span
                    key={language}
                    className="rounded-md bg-[#f2efe7] px-3 py-2"
                  >
                    {language}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <section>
                <h2 className="text-sm font-semibold">Links</h2>
                <div className="mt-3 space-y-3">
                  {profile.links.length ? (
                    profile.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        rel="noreferrer"
                        target="_blank"
                        className="block rounded-md border border-[var(--line)] p-4 transition hover:border-[var(--accent)]"
                      >
                        <p className="text-sm font-medium">{link.title}</p>
                        <p className="mt-2 break-all text-sm text-[var(--muted)]">
                          {link.url}
                        </p>
                      </a>
                    ))
                  ) : (
                    <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                      No public links yet.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold">Endpoints</h2>
                <div className="mt-3 space-y-3">
                  {profile.endpoints.length ? (
                    profile.endpoints.map((endpoint) => (
                      <Link
                        key={endpoint.id}
                        href={`/${profile.username}/${endpoint.slug}`}
                        className="block rounded-md border border-[var(--line)] p-4 transition hover:border-[var(--accent)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={
                                endpoint.method === "GET"
                                  ? "text-xs font-semibold text-[var(--ink-blue)]"
                                  : "text-xs font-semibold text-[var(--accent)]"
                              }
                            >
                              {endpoint.method}
                            </p>
                            <p className="mt-2 font-mono text-sm">
                              /{endpoint.slug}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {endpoint.title}
                          </p>
                        </div>
                        {endpoint.description ? (
                          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                            {endpoint.description}
                          </p>
                        ) : null}
                        {endpoint.boundaries.length ? (
                          <div className="mt-3 rounded-md bg-[#f2efe7] p-3">
                            <p className="text-xs font-semibold">
                              Boundary
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                              {endpoint.boundaries[0]?.description}
                            </p>
                          </div>
                        ) : null}
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                      No public endpoints yet.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
