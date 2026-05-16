"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ApiClientError, apiClient } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-client";
import type { AuthSession } from "@/lib/auth-client";
import {
  emptyEndpointMetadataForm,
  endpointMethods,
  endpointStatuses,
  endpointVisibilities,
  formatEnumLabel,
  getMetadataPayload,
  isPublicEndpoint,
  toMetadataForm,
  type DashboardEndpointDetail,
  type DashboardEndpointSummary,
  type EndpointMetadataFormState,
  type EndpointStatus,
} from "./types";

function inputClass() {
  return "mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]";
}

function buttonClass() {
  return "rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60";
}

function LoginPrompt() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Log in to manage your endpoints.</p>
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

function sortEndpoints(
  endpoints: DashboardEndpointSummary[],
): DashboardEndpointSummary[] {
  return [...endpoints].sort((firstEndpoint, secondEndpoint) => {
    if (firstEndpoint.position !== secondEndpoint.position) {
      return firstEndpoint.position - secondEndpoint.position;
    }

    return firstEndpoint.createdAt.localeCompare(secondEndpoint.createdAt);
  });
}

function mergeEndpointDetail(
  endpoint: DashboardEndpointSummary,
  detail: DashboardEndpointDetail,
): DashboardEndpointSummary {
  return {
    ...endpoint,
    slug: detail.slug,
    method: detail.method,
    title: detail.title,
    description: detail.description,
    visibility: detail.visibility,
    status: detail.status,
    position: detail.position,
    updatedAt: detail.updatedAt,
  };
}

function MetadataFormFields({
  form,
  onChange,
}: {
  form: EndpointMetadataFormState;
  onChange: <K extends keyof EndpointMetadataFormState>(
    key: K,
    value: EndpointMetadataFormState[K],
  ) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <label className="text-sm font-medium" htmlFor="endpoint-slug">
          Slug
        </label>
        <input
          required
          className={inputClass()}
          id="endpoint-slug"
          maxLength={50}
          type="text"
          value={form.slug}
          onChange={(event) => onChange("slug", event.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="endpoint-title">
          Title
        </label>
        <input
          required
          className={inputClass()}
          id="endpoint-title"
          maxLength={100}
          type="text"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="endpoint-method">
          Method
        </label>
        <select
          className={inputClass()}
          id="endpoint-method"
          value={form.method}
          onChange={(event) =>
            onChange(
              "method",
              event.target.value as EndpointMetadataFormState["method"],
            )
          }
        >
          {endpointMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="endpoint-visibility">
          Visibility
        </label>
        <select
          className={inputClass()}
          id="endpoint-visibility"
          value={form.visibility}
          onChange={(event) =>
            onChange(
              "visibility",
              event.target.value as EndpointMetadataFormState["visibility"],
            )
          }
        >
          {endpointVisibilities.map((visibility) => (
            <option key={visibility} value={visibility}>
              {formatEnumLabel(visibility)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="endpoint-status">
          Status
        </label>
        <select
          className={inputClass()}
          id="endpoint-status"
          value={form.status}
          onChange={(event) =>
            onChange(
              "status",
              event.target.value as EndpointMetadataFormState["status"],
            )
          }
        >
          {endpointStatuses.map((status) => (
            <option key={status} value={status}>
              {formatEnumLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="text-sm font-medium" htmlFor="endpoint-description">
          Description
        </label>
        <textarea
          className={inputClass()}
          id="endpoint-description"
          maxLength={500}
          rows={3}
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </div>
    </div>
  );
}

export function EndpointList() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [endpoints, setEndpoints] = useState<DashboardEndpointSummary[]>([]);
  const [newEndpointForm, setNewEndpointForm] =
    useState<EndpointMetadataFormState>(emptyEndpointMetadataForm);
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] = useState<EndpointMetadataFormState>(
    emptyEndpointMetadataForm,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEndpoints() {
      try {
        const [nextSession, nextEndpoints] = await Promise.all([
          getCurrentUser(),
          apiClient<DashboardEndpointSummary[]>("/dashboard/endpoints", {
            cache: "no-store",
          }),
        ]);

        if (isMounted) {
          setSession(nextSession);
          setEndpoints(nextEndpoints);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiClientError && error.status === 401
              ? "AUTH_REQUIRED"
              : error instanceof ApiClientError
                ? error.message
                : "Unable to load endpoints.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEndpoints();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateNewForm<K extends keyof EndpointMetadataFormState>(
    key: K,
    value: EndpointMetadataFormState[K],
  ) {
    setNewEndpointForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateEditForm<K extends keyof EndpointMetadataFormState>(
    key: K,
    value: EndpointMetadataFormState[K],
  ) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function setSavedEndpoint(savedEndpoint: DashboardEndpointDetail) {
    setEndpoints((currentEndpoints) =>
      sortEndpoints(
        currentEndpoints.map((endpoint) =>
          endpoint.id === savedEndpoint.id
            ? mergeEndpointDetail(endpoint, savedEndpoint)
            : endpoint,
        ),
      ),
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("create");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const createdEndpoint = await apiClient<DashboardEndpointSummary>(
        "/dashboard/endpoints",
        {
          method: "POST",
          body: JSON.stringify(getMetadataPayload(newEndpointForm)),
        },
      );

      setEndpoints((currentEndpoints) =>
        sortEndpoints([...currentEndpoints, createdEndpoint]),
      );
      setNewEndpointForm(emptyEndpointMetadataForm);
      setSuccessMessage("Endpoint created.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to create endpoint.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  function startEditing(endpoint: DashboardEndpointSummary) {
    setEditingEndpointId(endpoint.id);
    setEditForm(toMetadataForm(endpoint));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function cancelEditing() {
    setEditingEndpointId(null);
    setEditForm(emptyEndpointMetadataForm);
  }

  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
    endpointId: string,
  ) {
    event.preventDefault();
    setPendingAction(`edit:${endpointId}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedEndpoint = await apiClient<DashboardEndpointDetail>(
        `/dashboard/endpoints/${encodeURIComponent(endpointId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(getMetadataPayload(editForm)),
        },
      );

      setSavedEndpoint(updatedEndpoint);
      cancelEditing();
      setSuccessMessage("Endpoint saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to save endpoint.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function updateStatus(
    endpoint: DashboardEndpointSummary,
    status: EndpointStatus,
  ) {
    if (endpoint.status === status) {
      return;
    }

    setPendingAction(`status:${endpoint.id}:${status}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedEndpoint = await apiClient<DashboardEndpointDetail>(
        `/dashboard/endpoints/${encodeURIComponent(endpoint.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
          }),
        },
      );

      setSavedEndpoint(updatedEndpoint);
      setSuccessMessage(`Endpoint marked ${formatEnumLabel(status)}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to update endpoint status.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteEndpoint(endpoint: DashboardEndpointSummary) {
    if (!window.confirm(`Delete "${endpoint.title}"?`)) {
      return;
    }

    setPendingAction(`delete:${endpoint.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient<{ success: boolean }>(
        `/dashboard/endpoints/${encodeURIComponent(endpoint.id)}`,
        {
          method: "DELETE",
        },
      );

      setEndpoints((currentEndpoints) =>
        currentEndpoints.filter(
          (currentEndpoint) => currentEndpoint.id !== endpoint.id,
        ),
      );

      if (editingEndpointId === endpoint.id) {
        cancelEditing();
      }

      setSuccessMessage("Endpoint deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to delete endpoint.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function moveEndpoint(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= endpoints.length) {
      return;
    }

    const nextEndpoints = [...endpoints];
    const movedEndpoint = nextEndpoints[index];
    const swappedEndpoint = nextEndpoints[nextIndex];

    if (!movedEndpoint || !swappedEndpoint) {
      return;
    }

    nextEndpoints[index] = swappedEndpoint;
    nextEndpoints[nextIndex] = movedEndpoint;

    setPendingAction(`reorder:${movedEndpoint.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const reorderedEndpoints = await apiClient<DashboardEndpointSummary[]>(
        "/dashboard/endpoints/reorder",
        {
          method: "PATCH",
          body: JSON.stringify({
            orderedIds: nextEndpoints.map((endpoint) => endpoint.id),
          }),
        },
      );

      setEndpoints(reorderedEndpoints);
      setSuccessMessage("Endpoints reordered.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to reorder endpoints.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
        Loading endpoints...
      </div>
    );
  }

  if (errorMessage === "AUTH_REQUIRED") {
    return <LoginPrompt />;
  }

  if (!session) {
    return (
      <div
        className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
        role="alert"
      >
        {errorMessage ?? "Unable to load endpoints."}
      </div>
    );
  }

  const isBusy = pendingAction !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
            Endpoints
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            @{session.profile.username}
          </p>
        </div>
        <Link
          href={`/${session.profile.username}`}
          className={buttonClass()}
        >
          View public profile
        </Link>
      </div>

      {errorMessage ? (
        <div
          className="rounded-md border border-[#d19a7a] bg-[#fff8f2] p-3 text-sm leading-6 text-[#7a341b]"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="rounded-md border border-[var(--accent)] bg-[#eef8f5] p-3 text-sm leading-6 text-[var(--accent-strong)]"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <form
        className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-sm font-semibold">Create endpoint</h2>
        <div className="mt-4">
          <MetadataFormFields form={newEndpointForm} onChange={updateNewForm} />
        </div>
        <button
          className="mt-5 rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
          disabled={isBusy}
          type="submit"
        >
          {pendingAction === "create" ? "Creating..." : "Create endpoint"}
        </button>
      </form>

      <div className="space-y-3">
        {endpoints.length ? (
          endpoints.map((endpoint, index) => {
            const isEditing = editingEndpointId === endpoint.id;
            const publicHref = `/${session.profile.username}/${endpoint.slug}`;
            const isReordering = pendingAction === `reorder:${endpoint.id}`;
            const isDeleting = pendingAction === `delete:${endpoint.id}`;
            const isSavingEdit = pendingAction === `edit:${endpoint.id}`;

            return (
              <article
                key={endpoint.id}
                className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
              >
                {isEditing ? (
                  <form onSubmit={(event) => handleEdit(event, endpoint.id)}>
                    <MetadataFormFields
                      form={editForm}
                      onChange={updateEditForm}
                    />
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
                        disabled={isBusy}
                        type="submit"
                      >
                        {isSavingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        className={buttonClass()}
                        disabled={isBusy}
                        type="button"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            endpoint.method === "GET"
                              ? "text-xs font-semibold text-[var(--ink-blue)]"
                              : "text-xs font-semibold text-[var(--accent)]"
                          }
                        >
                          {endpoint.method}
                        </span>
                        <p className="font-medium">{endpoint.title}</p>
                        <span className="rounded-md border border-[var(--line)] bg-[#f2efe7] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                          {formatEnumLabel(endpoint.status)}
                        </span>
                        <span className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                          {formatEnumLabel(endpoint.visibility)}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-sm text-[var(--muted)]">
                        /{endpoint.slug}
                      </p>
                      {endpoint.description ? (
                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                          {endpoint.description}
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        {endpoint.fieldCount} fields /{" "}
                        {endpoint.boundaryCount} boundaries /{" "}
                        {endpoint.submissionCount} submissions
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className={buttonClass()}
                        disabled={isBusy || index === 0}
                        type="button"
                        onClick={() => moveEndpoint(index, -1)}
                      >
                        {isReordering ? "Moving..." : "Up"}
                      </button>
                      <button
                        className={buttonClass()}
                        disabled={isBusy || index === endpoints.length - 1}
                        type="button"
                        onClick={() => moveEndpoint(index, 1)}
                      >
                        {isReordering ? "Moving..." : "Down"}
                      </button>
                      {endpointStatuses.map((status) =>
                        status === endpoint.status ? null : (
                          <button
                            key={status}
                            className={buttonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={() => updateStatus(endpoint, status)}
                          >
                            {pendingAction ===
                            `status:${endpoint.id}:${status}`
                              ? "Saving..."
                              : formatEnumLabel(status)}
                          </button>
                        ),
                      )}
                      <button
                        className={buttonClass()}
                        disabled={isBusy}
                        type="button"
                        onClick={() => startEditing(endpoint)}
                      >
                        Edit
                      </button>
                      <Link
                        className={buttonClass()}
                        href={`/dashboard/endpoints/${endpoint.id}`}
                      >
                        Details
                      </Link>
                      {isPublicEndpoint(endpoint) ? (
                        <Link className={buttonClass()} href={publicHref}>
                          Public
                        </Link>
                      ) : null}
                      <button
                        className="rounded-md border border-[#d19a7a] bg-white px-3 py-2 text-sm font-medium text-[#7a341b] transition hover:bg-[#fff8f2] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy}
                        type="button"
                        onClick={() => deleteEndpoint(endpoint)}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium">No endpoints yet.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Create the first interaction endpoint above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
