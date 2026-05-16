"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiClientError, apiClient } from "@/lib/api-client";

type SubmissionStatus = "NEW" | "REVIEWED" | "REPLIED" | "ARCHIVED" | "BLOCKED";

type InboxSubmissionSummary = {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  submitterName: string | null;
  submitterEmail: string | null;
  message: string | null;
  preview: string | null;
  endpoint: {
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
  };
};

function formatStatusLabel(status: SubmissionStatus): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusBadgeClass(status: SubmissionStatus): string {
  switch (status) {
    case "NEW":
      return "border-[var(--accent)] bg-[#eef8f5] text-[var(--accent-strong)]";
    case "REVIEWED":
      return "border-[#b6c7e6] bg-[#f2f6fd] text-[var(--ink-blue)]";
    case "REPLIED":
      return "border-[#c7d8bb] bg-[#f3f8ee] text-[#365c27]";
    case "ARCHIVED":
      return "border-[var(--line)] bg-[#f2efe7] text-[var(--muted)]";
    case "BLOCKED":
      return "border-[#e0afa0] bg-[#fff4f0] text-[#84311f]";
  }
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
        status,
      )}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSubmitterLabel(submission: InboxSubmissionSummary): string {
  if (submission.submitterName && submission.submitterEmail) {
    return `${submission.submitterName} <${submission.submitterEmail}>`;
  }

  return (
    submission.submitterName ??
    submission.submitterEmail ??
    "Anonymous submitter"
  );
}

function LoginPrompt() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Log in to view your inbox.</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Public demo pages remain available without an account.
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

export function InboxList() {
  const [submissions, setSubmissions] = useState<InboxSubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInbox() {
      try {
        const nextSubmissions = await apiClient<InboxSubmissionSummary[]>(
          "/dashboard/inbox",
          {
            cache: "no-store",
          },
        );

        if (isMounted) {
          setSubmissions(nextSubmissions);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiClientError && error.status === 401
              ? "AUTH_REQUIRED"
              : error instanceof ApiClientError
                ? error.message
                : "Unable to load inbox",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInbox();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
        Loading inbox...
      </div>
    );
  }

  if (errorMessage === "AUTH_REQUIRED") {
    return <LoginPrompt />;
  }

  if (errorMessage) {
    return (
      <div
        className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
        role="alert"
      >
        {errorMessage}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium">No submissions yet.</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Submissions appear here after visitors use your published POST
          endpoints.
        </p>
        <Link
          href="/demo/collaborate"
          className="mt-4 inline-flex rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
        >
          View demo form
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Link
          key={submission.id}
          href={`/dashboard/inbox/${submission.id}`}
          className="block rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--accent)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    submission.endpoint.method === "GET"
                      ? "text-xs font-semibold text-[var(--ink-blue)]"
                      : "text-xs font-semibold text-[var(--accent)]"
                  }
                >
                  {submission.endpoint.method}
                </span>
                <p className="font-medium">{submission.endpoint.title}</p>
                <span className="font-mono text-sm text-[var(--muted)]">
                  /{submission.endpoint.slug}
                </span>
              </div>

              <p className="mt-3 text-sm text-[var(--muted)]">
                {getSubmitterLabel(submission)}
              </p>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--foreground)]">
                {submission.preview ?? "No message provided."}
              </p>
            </div>

            <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
              <StatusBadge status={submission.status} />
              <time className="text-sm text-[var(--muted)]">
                {formatDate(submission.createdAt)}
              </time>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
