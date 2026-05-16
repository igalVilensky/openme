"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-client";
import type { AuthSession } from "@/lib/auth-client";
import { LogoutButton } from "./logout-button";

type DashboardHeaderProps = {
  active: "dashboard" | "profile" | "links" | "endpoints" | "inbox";
};

const navItems: Array<{
  key: DashboardHeaderProps["active"];
  href: string;
  label: string;
}> = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    key: "profile",
    href: "/dashboard/profile",
    label: "Profile",
  },
  {
    key: "links",
    href: "/dashboard/links",
    label: "Links",
  },
  {
    key: "endpoints",
    href: "/dashboard/endpoints",
    label: "Endpoints",
  },
  {
    key: "inbox",
    href: "/dashboard/inbox",
    label: "Inbox",
  },
];

export function DashboardHeader({ active }: DashboardHeaderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await getCurrentUser();

        if (isMounted) {
          setSession(nextSession);
        }
      } catch (error) {
        if (
          isMounted &&
          !(error instanceof ApiClientError && error.status === 401)
        ) {
          setSession(null);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const profileHref = session ? `/${session.profile.username}` : "/demo";

  return (
    <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/dashboard" className="text-base font-semibold">
        OpenMe
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={
              item.key === active
                ? "rounded-md border border-[var(--accent)] bg-[#eef8f5] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                : "rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
            }
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={profileHref}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
        >
          {session ? "Public profile" : "Demo profile"}
        </Link>
        {session ? <LogoutButton /> : null}
      </div>
    </header>
  );
}
