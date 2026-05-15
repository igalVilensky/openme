"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiClientError, apiClient } from "@/lib/api-client";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type SubmissionStatus = "NEW" | "REVIEWED" | "REPLIED" | "ARCHIVED" | "BLOCKED";

type EndpointFieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "URL"
  | "SELECT"
  | "MULTI_SELECT"
  | "RATING"
  | "DATE";

type InboxSubmissionDetail = {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  submitterName: string | null;
  submitterEmail: string | null;
  message: string | null;
  data: JsonValue;
  endpoint: {
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
    fields: Array<{
      id: string;
      type: EndpointFieldType;
      label: string;
      position: number;
    }>;
  };
  analysis: {
    summary: string | null;
    intent: string | null;
    boundaryStatus: "FITS" | "UNCLEAR" | "VIOLATES" | "NEEDS_REVIEW";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    suggestedReply: string | null;
  } | null;
};

type InboxSubmissionSummary = {
  id: string;
  status: SubmissionStatus;
};

const statusOptions: SubmissionStatus[] = [
  "NEW",
  "REVIEWED",
  "REPLIED",
  "ARCHIVED",
  "BLOCKED",
];

function formatStatusLabel(status: SubmissionStatus): string {
  return formatEnumLabel(status);
}

function formatEnumLabel(value: string): string {
  return value
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
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
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

function asRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

function formatJsonValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "No answer";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatJsonValue(item)).join(", ");
  }

  return JSON.stringify(value, null, 2);
}

function getSubmitterName(submission: InboxSubmissionDetail): string {
  return submission.submitterName ?? "Anonymous submitter";
}

function getSubmitterEmail(submission: InboxSubmissionDetail): string {
  return submission.submitterEmail ?? "No email provided";
}

export function SubmissionDetail({ submissionId }: { submissionId: string }) {
  const [submission, setSubmission] = useState<InboxSubmissionDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingStatus, setSavingStatus] = useState<SubmissionStatus | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSubmission() {
      try {
        const nextSubmission = await apiClient<InboxSubmissionDetail>(
          `/dashboard/inbox/${encodeURIComponent(submissionId)}`,
          {
            cache: "no-store",
          },
        );

        if (isMounted) {
          setSubmission(nextSubmission);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiClientError && error.status === 401
              ? "AUTH_REQUIRED"
              : error instanceof ApiClientError && error.status === 404
                ? "Submission not found."
                : "Unable to load submission.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialSubmission();

    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  async function refreshSubmission() {
    setIsRefreshing(true);

    try {
      const nextSubmission = await apiClient<InboxSubmissionDetail>(
        `/dashboard/inbox/${encodeURIComponent(submissionId)}`,
        {
          cache: "no-store",
        },
      );

      setSubmission(nextSubmission);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError && error.status === 401
          ? "AUTH_REQUIRED"
          : error instanceof ApiClientError && error.status === 404
            ? "Submission not found."
            : "Unable to load submission.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  const dataRecord = useMemo(
    () => (submission ? asRecord(submission.data) : null),
    [submission],
  );

  async function updateStatus(status: SubmissionStatus) {
    if (!submission || status === submission.status) {
      return;
    }

    setSavingStatus(status);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const updatedSubmission = await apiClient<InboxSubmissionSummary>(
        `/dashboard/inbox/${encodeURIComponent(submission.id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
          }),
        },
      );

      setSubmission((currentSubmission) =>
        currentSubmission
          ? {
              ...currentSubmission,
              status: updatedSubmission.status,
            }
          : currentSubmission,
      );
      setStatusMessage(
        `Marked ${formatStatusLabel(updatedSubmission.status)}.`,
      );
      await refreshSubmission();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to update status.",
      );
    } finally {
      setSavingStatus(null);
    }
  }

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
          Loading submission...
        </div>
      </section>
    );
  }

  if (!submission) {
    if (errorMessage === "AUTH_REQUIRED") {
      return (
        <section className="py-10">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium">
              Log in to view this submission.
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Your dashboard inbox is private to your profile.
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
        </section>
      );
    }

    return (
      <section className="py-10">
        <div
          className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
          role="alert"
        >
          {errorMessage ?? "Submission not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                submission.endpoint.method === "GET"
                  ? "text-sm font-semibold text-[var(--ink-blue)]"
                  : "text-sm font-semibold text-[var(--accent)]"
              }
            >
              {submission.endpoint.method}
            </span>
            <span className="font-mono text-sm text-[var(--muted)]">
              /{submission.endpoint.slug}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0]">
            {submission.endpoint.title}
          </h1>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Submitter</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-[#fbfaf7] p-3">
                <p className="text-xs font-medium text-[var(--muted)]">Name</p>
                <p className="mt-1 text-sm">{getSubmitterName(submission)}</p>
              </div>
              <div className="rounded-md bg-[#fbfaf7] p-3">
                <p className="text-xs font-medium text-[var(--muted)]">Email</p>
                <p className="mt-1 break-all text-sm">
                  {getSubmitterEmail(submission)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Message</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
              {submission.message ?? "No message provided."}
            </p>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Answers</h2>
            <div className="mt-4 space-y-3">
              {submission.endpoint.fields.length ? (
                submission.endpoint.fields.map((field) => (
                  <div
                    key={field.id}
                    className="rounded-md border border-[var(--line)] p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm font-medium">{field.label}</p>
                      <span className="text-xs font-medium text-[var(--muted)]">
                        {formatEnumLabel(field.type)}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                      {formatJsonValue(dataRecord?.[field.id])}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                  No fields were configured for this endpoint.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const isCurrent = status === submission.status;

                return (
                  <button
                    key={status}
                    className={
                      isCurrent
                        ? "rounded-md border border-[var(--accent)] bg-[#eef8f5] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                        : "rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    }
                    disabled={Boolean(savingStatus) || isCurrent}
                    type="button"
                    onClick={() => updateStatus(status)}
                  >
                    {savingStatus === status
                      ? "Saving..."
                      : formatStatusLabel(status)}
                  </button>
                );
              })}
            </div>
            {statusMessage ? (
              <p className="mt-3 text-sm text-[var(--accent-strong)]">
                {statusMessage}
              </p>
            ) : null}
            {isRefreshing ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Refreshing...</p>
            ) : null}
          </section>

          {errorMessage ? (
            <div
              className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Dates</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-[var(--muted)]">Created</dt>
                <dd className="mt-1">{formatDate(submission.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--muted)]">Updated</dt>
                <dd className="mt-1">{formatDate(submission.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Analysis</h2>
            {submission.analysis ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-[var(--muted)]">Summary</dt>
                  <dd className="mt-1">
                    {submission.analysis.summary ?? "No summary."}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--muted)]">Intent</dt>
                  <dd className="mt-1">
                    {submission.analysis.intent ?? "No intent."}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--muted)]">Boundary</dt>
                  <dd className="mt-1">
                    {formatEnumLabel(submission.analysis.boundaryStatus)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--muted)]">Priority</dt>
                  <dd className="mt-1">
                    {formatEnumLabel(submission.analysis.priority)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--muted)]">
                    Suggested reply
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap">
                    {submission.analysis.suggestedReply ??
                      "No suggested reply."}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Analysis has not been generated for this submission.
              </p>
            )}
          </section>

          <Link
            href="/dashboard/inbox"
            className="block rounded-md border border-[var(--line)] bg-white px-3 py-2 text-center text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Back to inbox
          </Link>
        </aside>
      </div>
    </section>
  );
}
