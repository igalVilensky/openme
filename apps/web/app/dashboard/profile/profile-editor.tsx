"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ApiClientError, apiClient } from "@/lib/api-client";

type DashboardProfile = {
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
  isPublic: boolean;
};

type ProfileFormState = {
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  languages: string;
  status: string;
  currentFocus: string;
  avatarUrl: string;
  isPublic: boolean;
};

function toFormState(profile: DashboardProfile): ProfileFormState {
  return {
    displayName: profile.displayName ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    languages: profile.languages.join(", "),
    status: profile.status ?? "",
    currentFocus: profile.currentFocus ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    isPublic: profile.isPublic,
  };
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed || null;
}

function parseLanguages(value: string): string[] {
  return value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);
}

function LoginPrompt() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Log in to edit your profile.</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        The public demo profile remains available without an account.
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

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label className="text-sm font-medium" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function inputClass() {
  return "mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]";
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const nextProfile = await apiClient<DashboardProfile>(
          "/dashboard/profile",
          {
            cache: "no-store",
          },
        );

        if (isMounted) {
          setProfile(nextProfile);
          setForm(toFormState(nextProfile));
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiClientError && error.status === 401
              ? "AUTH_REQUIRED"
              : error instanceof ApiClientError
                ? error.message
                : "Unable to load profile.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateForm<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) {
    setForm((currentForm) =>
      currentForm
        ? {
            ...currentForm,
            [key]: value,
          }
        : currentForm,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await apiClient<DashboardProfile>(
        "/dashboard/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            displayName: form.displayName.trim(),
            headline: nullableText(form.headline),
            bio: nullableText(form.bio),
            location: nullableText(form.location),
            languages: parseLanguages(form.languages),
            status: nullableText(form.status),
            currentFocus: nullableText(form.currentFocus),
            avatarUrl: nullableText(form.avatarUrl),
            isPublic: form.isPublic,
          }),
        },
      );

      setProfile(updatedProfile);
      setForm(toFormState(updatedProfile));
      setSuccessMessage("Profile saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to save profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
        Loading profile...
      </div>
    );
  }

  if (errorMessage === "AUTH_REQUIRED") {
    return <LoginPrompt />;
  }

  if (!profile || !form) {
    return (
      <div
        className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
        role="alert"
      >
        {errorMessage ?? "Unable to load profile."}
      </div>
    );
  }

  const publicProfileHref = `/${profile.username}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[0]">Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            @{profile.username}
          </p>
        </div>
        <Link
          href={publicProfileHref}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
        >
          View public profile
        </Link>
      </div>

      <form
        className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel htmlFor="display-name">Display name</FieldLabel>
            <input
              id="display-name"
              className={inputClass()}
              maxLength={80}
              type="text"
              value={form.displayName}
              onChange={(event) =>
                updateForm("displayName", event.target.value)
              }
            />
          </div>

          <div>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <input
              id="location"
              className={inputClass()}
              maxLength={120}
              type="text"
              value={form.location}
              onChange={(event) => updateForm("location", event.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <FieldLabel htmlFor="headline">Headline</FieldLabel>
            <input
              id="headline"
              className={inputClass()}
              maxLength={140}
              type="text"
              value={form.headline}
              onChange={(event) => updateForm("headline", event.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <FieldLabel htmlFor="bio">Bio</FieldLabel>
            <textarea
              id="bio"
              className={inputClass()}
              maxLength={800}
              rows={5}
              value={form.bio}
              onChange={(event) => updateForm("bio", event.target.value)}
            />
          </div>

          <div>
            <FieldLabel htmlFor="languages">Languages</FieldLabel>
            <input
              id="languages"
              className={inputClass()}
              type="text"
              value={form.languages}
              onChange={(event) => updateForm("languages", event.target.value)}
            />
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Separate languages with commas.
            </p>
          </div>

          <div>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <input
              id="status"
              className={inputClass()}
              maxLength={140}
              type="text"
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value)}
            />
          </div>

          <div>
            <FieldLabel htmlFor="current-focus">Current focus</FieldLabel>
            <input
              id="current-focus"
              className={inputClass()}
              maxLength={180}
              type="text"
              value={form.currentFocus}
              onChange={(event) =>
                updateForm("currentFocus", event.target.value)
              }
            />
          </div>

          <div>
            <FieldLabel htmlFor="avatar-url">Avatar URL</FieldLabel>
            <input
              id="avatar-url"
              className={inputClass()}
              type="url"
              value={form.avatarUrl}
              onChange={(event) => updateForm("avatarUrl", event.target.value)}
            />
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-md border border-[var(--line)] bg-[#fbfaf7] p-4">
          <input
            checked={form.isPublic}
            className="mt-1 h-4 w-4"
            type="checkbox"
            onChange={(event) => updateForm("isPublic", event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium">Public profile</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
              When enabled, your profile is visible at /{profile.username}.
            </span>
          </span>
        </label>

        {errorMessage ? (
          <p
            className="mt-5 rounded-md border border-[#d19a7a] bg-[#fff8f2] p-3 text-sm leading-6 text-[#7a341b]"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <div
            className="mt-5 rounded-md border border-[var(--accent)] bg-[#eef8f5] p-3 text-sm leading-6 text-[var(--accent-strong)]"
            role="status"
          >
            {successMessage}{" "}
            <Link className="font-semibold underline" href={publicProfileHref}>
              View public profile
            </Link>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Back to dashboard
          </Link>
        </div>
      </form>
    </div>
  );
}
