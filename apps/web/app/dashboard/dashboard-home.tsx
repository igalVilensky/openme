"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiClientError, apiBaseUrl } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-client";
import type { AuthSession } from "@/lib/auth-client";

function LoginPrompt() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Log in to view your dashboard.</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        The public demo profile still works without an account.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
        >
          Register
        </Link>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await getCurrentUser();

        if (isMounted) {
          setSession(nextSession);
          setErrorStatus(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorStatus(error instanceof ApiClientError ? error.status : 500);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  if (!session) {
    return errorStatus === 401 ? (
      <LoginPrompt />
    ) : (
      <div
        className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
        role="alert"
      >
        Unable to load dashboard.
      </div>
    );
  }

  const publicProfileHref = `/${session.profile.username}`;
  const dashboardItems = [
    {
      label: "Profile",
      value: "Public",
      detail: "Edit public profile fields",
      href: "/dashboard/profile",
    },
    {
      label: "Links",
      value: "Manage",
      detail: "Create and reorder public links",
      href: "/dashboard/links",
    },
    {
      label: "Endpoints",
      value: "Build",
      detail: "Manage interaction endpoints",
      href: "/dashboard/endpoints",
    },
    {
      label: "Inbox",
      value: "Open",
      detail: "Review owner-scoped submissions",
      href: "/dashboard/inbox",
    },
    {
      label: "Public profile",
      value: "View",
      detail: `Open @${session.profile.username}`,
      href: publicProfileHref,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
            Workspace overview
          </h1>
        </div>
        <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
          @{session.profile.username}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
    </>
  );
}
