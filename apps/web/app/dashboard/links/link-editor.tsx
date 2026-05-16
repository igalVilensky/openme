"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ApiClientError, apiClient } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-client";
import type { AuthSession } from "@/lib/auth-client";

type DashboardLink = {
  id: string;
  title: string;
  url: string;
  position: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type LinkFormState = {
  title: string;
  url: string;
  isVisible: boolean;
};

const emptyLinkForm: LinkFormState = {
  title: "",
  url: "",
  isVisible: true,
};

function sortDashboardLinks(links: DashboardLink[]): DashboardLink[] {
  return [...links].sort((firstLink, secondLink) => {
    if (firstLink.position !== secondLink.position) {
      return firstLink.position - secondLink.position;
    }

    return firstLink.createdAt.localeCompare(secondLink.createdAt);
  });
}

function inputClass() {
  return "mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]";
}

function LoginPrompt() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Log in to manage your links.</p>
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

export function LinkEditor() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [newLinkForm, setNewLinkForm] =
    useState<LinkFormState>(emptyLinkForm);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LinkFormState>(emptyLinkForm);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLinks() {
      try {
        const [nextSession, nextLinks] = await Promise.all([
          getCurrentUser(),
          apiClient<DashboardLink[]>("/dashboard/links", {
            cache: "no-store",
          }),
        ]);

        if (isMounted) {
          setSession(nextSession);
          setLinks(nextLinks);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiClientError && error.status === 401
              ? "AUTH_REQUIRED"
              : error instanceof ApiClientError
                ? error.message
                : "Unable to load links.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLinks();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateNewLinkForm<K extends keyof LinkFormState>(
    key: K,
    value: LinkFormState[K],
  ) {
    setNewLinkForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateEditForm<K extends keyof LinkFormState>(
    key: K,
    value: LinkFormState[K],
  ) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function setSavedLink(savedLink: DashboardLink) {
    setLinks((currentLinks) =>
      sortDashboardLinks(
        currentLinks.map((link) =>
          link.id === savedLink.id ? savedLink : link,
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
      const createdLink = await apiClient<DashboardLink>("/dashboard/links", {
        method: "POST",
        body: JSON.stringify({
          title: newLinkForm.title,
          url: newLinkForm.url,
          isVisible: newLinkForm.isVisible,
        }),
      });

      setLinks((currentLinks) =>
        sortDashboardLinks([...currentLinks, createdLink]),
      );
      setNewLinkForm(emptyLinkForm);
      setSuccessMessage("Link added.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError ? error.message : "Unable to add link.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  function startEditing(link: DashboardLink) {
    setEditingLinkId(link.id);
    setEditForm({
      title: link.title,
      url: link.url,
      isVisible: link.isVisible,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function cancelEditing() {
    setEditingLinkId(null);
    setEditForm(emptyLinkForm);
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, linkId: string) {
    event.preventDefault();
    setPendingAction(`edit:${linkId}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedLink = await apiClient<DashboardLink>(
        `/dashboard/links/${encodeURIComponent(linkId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editForm.title,
            url: editForm.url,
            isVisible: editForm.isVisible,
          }),
        },
      );

      setSavedLink(updatedLink);
      setEditingLinkId(null);
      setEditForm(emptyLinkForm);
      setSuccessMessage("Link saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to save link.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleVisibility(link: DashboardLink) {
    setPendingAction(`visibility:${link.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedLink = await apiClient<DashboardLink>(
        `/dashboard/links/${encodeURIComponent(link.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isVisible: !link.isVisible,
          }),
        },
      );

      setSavedLink(updatedLink);
      setSuccessMessage(updatedLink.isVisible ? "Link shown." : "Link hidden.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to update visibility.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteLink(link: DashboardLink) {
    if (!window.confirm(`Delete "${link.title}"?`)) {
      return;
    }

    setPendingAction(`delete:${link.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient<{ success: boolean }>(
        `/dashboard/links/${encodeURIComponent(link.id)}`,
        {
          method: "DELETE",
        },
      );

      setLinks((currentLinks) =>
        currentLinks.filter((currentLink) => currentLink.id !== link.id),
      );

      if (editingLinkId === link.id) {
        cancelEditing();
      }

      setSuccessMessage("Link deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to delete link.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function moveLink(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= links.length) {
      return;
    }

    const nextLinks = [...links];
    const movedLink = nextLinks[index];
    const swappedLink = nextLinks[nextIndex];

    if (!movedLink || !swappedLink) {
      return;
    }

    nextLinks[index] = swappedLink;
    nextLinks[nextIndex] = movedLink;

    setPendingAction(`reorder:${movedLink.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const reorderedLinks = await apiClient<DashboardLink[]>(
        "/dashboard/links/reorder",
        {
          method: "PATCH",
          body: JSON.stringify({
            orderedIds: nextLinks.map((link) => link.id),
          }),
        },
      );

      setLinks(reorderedLinks);
      setSuccessMessage("Links reordered.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to reorder links.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
        Loading links...
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
        {errorMessage ?? "Unable to load links."}
      </div>
    );
  }

  const publicProfileHref = `/${session.profile.username}`;
  const isBusy = pendingAction !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[0]">Links</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            @{session.profile.username}
          </p>
        </div>
        <Link
          href={publicProfileHref}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
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
          {successMessage}{" "}
          <Link className="font-semibold underline" href={publicProfileHref}>
            View public profile
          </Link>
        </div>
      ) : null}

      <form
        className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
        onSubmit={handleCreate}
      >
        <h2 className="text-sm font-semibold">Add link</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-medium" htmlFor="new-link-title">
              Title
            </label>
            <input
              required
              className={inputClass()}
              id="new-link-title"
              maxLength={80}
              type="text"
              value={newLinkForm.title}
              onChange={(event) =>
                updateNewLinkForm("title", event.target.value)
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="new-link-url">
              URL
            </label>
            <input
              required
              className={inputClass()}
              id="new-link-url"
              type="url"
              value={newLinkForm.url}
              onChange={(event) =>
                updateNewLinkForm("url", event.target.value)
              }
            />
          </div>
          <button
            className="rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isBusy}
            type="submit"
          >
            {pendingAction === "create" ? "Adding..." : "Add link"}
          </button>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            checked={newLinkForm.isVisible}
            className="h-4 w-4"
            type="checkbox"
            onChange={(event) =>
              updateNewLinkForm("isVisible", event.target.checked)
            }
          />
          <span>Visible on public profile</span>
        </label>
      </form>

      <div className="space-y-3">
        {links.length ? (
          links.map((link, index) => {
            const isEditing = editingLinkId === link.id;
            const isSavingEdit = pendingAction === `edit:${link.id}`;
            const isChangingVisibility =
              pendingAction === `visibility:${link.id}`;
            const isDeleting = pendingAction === `delete:${link.id}`;
            const isReordering = pendingAction === `reorder:${link.id}`;

            return (
              <article
                key={link.id}
                className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
              >
                {isEditing ? (
                  <form onSubmit={(event) => handleEdit(event, link.id)}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label
                          className="text-sm font-medium"
                          htmlFor={`edit-link-title-${link.id}`}
                        >
                          Title
                        </label>
                        <input
                          required
                          className={inputClass()}
                          id={`edit-link-title-${link.id}`}
                          maxLength={80}
                          type="text"
                          value={editForm.title}
                          onChange={(event) =>
                            updateEditForm("title", event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="text-sm font-medium"
                          htmlFor={`edit-link-url-${link.id}`}
                        >
                          URL
                        </label>
                        <input
                          required
                          className={inputClass()}
                          id={`edit-link-url-${link.id}`}
                          type="url"
                          value={editForm.url}
                          onChange={(event) =>
                            updateEditForm("url", event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <label className="mt-4 flex items-center gap-3 text-sm">
                      <input
                        checked={editForm.isVisible}
                        className="h-4 w-4"
                        type="checkbox"
                        onChange={(event) =>
                          updateEditForm("isVisible", event.target.checked)
                        }
                      />
                      <span>Visible on public profile</span>
                    </label>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
                        disabled={isBusy}
                        type="submit"
                      >
                        {isSavingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
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
                        <p className="font-medium">{link.title}</p>
                        <span
                          className={
                            link.isVisible
                              ? "rounded-md border border-[var(--accent)] bg-[#eef8f5] px-2 py-1 text-xs font-semibold text-[var(--accent-strong)]"
                              : "rounded-md border border-[var(--line)] bg-[#f2efe7] px-2 py-1 text-xs font-semibold text-[var(--muted)]"
                          }
                        >
                          {link.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      <a
                        className="mt-2 block break-all text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
                        href={link.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.url}
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy || index === 0}
                        type="button"
                        onClick={() => moveLink(index, -1)}
                      >
                        {isReordering ? "Moving..." : "Up"}
                      </button>
                      <button
                        className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy || index === links.length - 1}
                        type="button"
                        onClick={() => moveLink(index, 1)}
                      >
                        {isReordering ? "Moving..." : "Down"}
                      </button>
                      <button
                        className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy}
                        type="button"
                        onClick={() => toggleVisibility(link)}
                      >
                        {isChangingVisibility
                          ? "Saving..."
                          : link.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>
                      <button
                        className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy}
                        type="button"
                        onClick={() => startEditing(link)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md border border-[#d19a7a] bg-white px-3 py-2 text-sm font-medium text-[#7a341b] transition hover:bg-[#fff8f2] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy}
                        type="button"
                        onClick={() => deleteLink(link)}
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
            <p className="text-sm font-medium">No links yet.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Add the first public profile link above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
