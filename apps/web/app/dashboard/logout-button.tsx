"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logout } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isLoggingOut}
      type="button"
      onClick={handleLogout}
    >
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  );
}
