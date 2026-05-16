"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ApiClientError, apiClient } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-client";
import type { AuthSession } from "@/lib/auth-client";
import {
  boundaryPriorities,
  emptyBoundaryForm,
  emptyEndpointMetadataForm,
  emptyFieldForm,
  endpointMethods,
  endpointStatuses,
  endpointVisibilities,
  fieldTypes,
  formatEnumLabel,
  getMetadataPayload,
  isPublicEndpoint,
  nullableText,
  toMetadataForm,
  type BoundaryFormState,
  type DashboardEndpointBoundary,
  type DashboardEndpointDetail,
  type DashboardEndpointField,
  type EndpointMetadataFormState,
  type FieldFormState,
  type FieldType,
  type JsonValue,
} from "../types";

function inputClass() {
  return "mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]";
}

function buttonClass() {
  return "rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerButtonClass() {
  return "rounded-md border border-[#d19a7a] bg-white px-3 py-2 text-sm font-medium text-[#7a341b] transition hover:bg-[#fff8f2] disabled:cursor-not-allowed disabled:opacity-60";
}

function LoginPrompt() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Log in to edit this endpoint.</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Your endpoint builder is private to your profile.
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

function isOptionField(type: FieldType): boolean {
  return type === "SELECT" || type === "MULTI_SELECT";
}

function parseOptions(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function optionTextFromJson(value: JsonValue): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter((option): option is string => typeof option === "string")
    .join("\n");
}

function toFieldForm(field: DashboardEndpointField): FieldFormState {
  return {
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? "",
    placeholder: field.placeholder ?? "",
    options: optionTextFromJson(field.options),
    required: field.required,
  };
}

function toBoundaryForm(boundary: DashboardEndpointBoundary): BoundaryFormState {
  return {
    title: boundary.title,
    description: boundary.description,
    priority: boundary.priority,
    isActive: boundary.isActive,
  };
}

function getFieldPayload(form: FieldFormState) {
  return {
    type: form.type,
    label: form.label.trim(),
    helpText: nullableText(form.helpText),
    placeholder: nullableText(form.placeholder),
    options: isOptionField(form.type) ? parseOptions(form.options) : null,
    required: form.required,
  };
}

function getBoundaryPayload(form: BoundaryFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    isActive: form.isActive,
  };
}

function sortFields(fields: DashboardEndpointField[]): DashboardEndpointField[] {
  return [...fields].sort((firstField, secondField) => {
    if (firstField.position !== secondField.position) {
      return firstField.position - secondField.position;
    }

    return firstField.id.localeCompare(secondField.id);
  });
}

function sortBoundaries(
  boundaries: DashboardEndpointBoundary[],
): DashboardEndpointBoundary[] {
  return [...boundaries].sort((firstBoundary, secondBoundary) =>
    firstBoundary.createdAt.localeCompare(secondBoundary.createdAt),
  );
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
        <label className="text-sm font-medium" htmlFor="detail-endpoint-slug">
          Slug
        </label>
        <input
          required
          className={inputClass()}
          id="detail-endpoint-slug"
          maxLength={50}
          type="text"
          value={form.slug}
          onChange={(event) => onChange("slug", event.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="detail-endpoint-title">
          Title
        </label>
        <input
          required
          className={inputClass()}
          id="detail-endpoint-title"
          maxLength={100}
          type="text"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="detail-endpoint-method">
          Method
        </label>
        <select
          className={inputClass()}
          id="detail-endpoint-method"
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
        <label
          className="text-sm font-medium"
          htmlFor="detail-endpoint-visibility"
        >
          Visibility
        </label>
        <select
          className={inputClass()}
          id="detail-endpoint-visibility"
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
        <label className="text-sm font-medium" htmlFor="detail-endpoint-status">
          Status
        </label>
        <select
          className={inputClass()}
          id="detail-endpoint-status"
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
        <label
          className="text-sm font-medium"
          htmlFor="detail-endpoint-description"
        >
          Description
        </label>
        <textarea
          className={inputClass()}
          id="detail-endpoint-description"
          maxLength={500}
          rows={3}
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </div>
    </div>
  );
}

function FieldFormFields({
  form,
  onChange,
  idPrefix,
}: {
  form: FieldFormState;
  onChange: <K extends keyof FieldFormState>(
    key: K,
    value: FieldFormState[K],
  ) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-type`}>
          Type
        </label>
        <select
          className={inputClass()}
          id={`${idPrefix}-type`}
          value={form.type}
          onChange={(event) => onChange("type", event.target.value as FieldType)}
        >
          {fieldTypes.map((type) => (
            <option key={type} value={type}>
              {formatEnumLabel(type)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-label`}>
          Label
        </label>
        <input
          required
          className={inputClass()}
          id={`${idPrefix}-label`}
          maxLength={120}
          type="text"
          value={form.label}
          onChange={(event) => onChange("label", event.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-help`}>
          Help text
        </label>
        <input
          className={inputClass()}
          id={`${idPrefix}-help`}
          maxLength={240}
          type="text"
          value={form.helpText}
          onChange={(event) => onChange("helpText", event.target.value)}
        />
      </div>
      <div>
        <label
          className="text-sm font-medium"
          htmlFor={`${idPrefix}-placeholder`}
        >
          Placeholder
        </label>
        <input
          className={inputClass()}
          id={`${idPrefix}-placeholder`}
          maxLength={160}
          type="text"
          value={form.placeholder}
          onChange={(event) => onChange("placeholder", event.target.value)}
        />
      </div>
      <div className="lg:col-span-2">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-options`}>
          Options
        </label>
        <textarea
          className={inputClass()}
          disabled={!isOptionField(form.type)}
          id={`${idPrefix}-options`}
          rows={3}
          value={form.options}
          onChange={(event) => onChange("options", event.target.value)}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          checked={form.required}
          className="h-4 w-4"
          type="checkbox"
          onChange={(event) => onChange("required", event.target.checked)}
        />
        <span>Required</span>
      </label>
    </div>
  );
}

function BoundaryFormFields({
  form,
  onChange,
  idPrefix,
}: {
  form: BoundaryFormState;
  onChange: <K extends keyof BoundaryFormState>(
    key: K,
    value: BoundaryFormState[K],
  ) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-title`}>
          Title
        </label>
        <input
          required
          className={inputClass()}
          id={`${idPrefix}-title`}
          maxLength={120}
          type="text"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-priority`}>
          Priority
        </label>
        <select
          className={inputClass()}
          id={`${idPrefix}-priority`}
          value={form.priority}
          onChange={(event) =>
            onChange(
              "priority",
              event.target.value as BoundaryFormState["priority"],
            )
          }
        >
          {boundaryPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {formatEnumLabel(priority)}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label
          className="text-sm font-medium"
          htmlFor={`${idPrefix}-description`}
        >
          Description
        </label>
        <textarea
          required
          className={inputClass()}
          id={`${idPrefix}-description`}
          maxLength={400}
          rows={3}
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          checked={form.isActive}
          className="h-4 w-4"
          type="checkbox"
          onChange={(event) => onChange("isActive", event.target.checked)}
        />
        <span>Active</span>
      </label>
    </div>
  );
}

export function EndpointDetailEditor({ endpointId }: { endpointId: string }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [endpoint, setEndpoint] = useState<DashboardEndpointDetail | null>(
    null,
  );
  const [metadataForm, setMetadataForm] =
    useState<EndpointMetadataFormState>(emptyEndpointMetadataForm);
  const [newFieldForm, setNewFieldForm] =
    useState<FieldFormState>(emptyFieldForm);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldEditForm, setFieldEditForm] =
    useState<FieldFormState>(emptyFieldForm);
  const [newBoundaryForm, setNewBoundaryForm] =
    useState<BoundaryFormState>(emptyBoundaryForm);
  const [editingBoundaryId, setEditingBoundaryId] = useState<string | null>(
    null,
  );
  const [boundaryEditForm, setBoundaryEditForm] =
    useState<BoundaryFormState>(emptyBoundaryForm);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEndpoint() {
      try {
        const [nextSession, nextEndpoint] = await Promise.all([
          getCurrentUser(),
          apiClient<DashboardEndpointDetail>(
            `/dashboard/endpoints/${encodeURIComponent(endpointId)}`,
            {
              cache: "no-store",
            },
          ),
        ]);

        if (isMounted) {
          setSession(nextSession);
          setEndpoint(nextEndpoint);
          setMetadataForm(toMetadataForm(nextEndpoint));
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof ApiClientError && error.status === 401
              ? "AUTH_REQUIRED"
              : error instanceof ApiClientError && error.status === 404
                ? "Endpoint not found."
                : error instanceof ApiClientError
                  ? error.message
                  : "Unable to load endpoint.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEndpoint();

    return () => {
      isMounted = false;
    };
  }, [endpointId]);

  function updateMetadataForm<K extends keyof EndpointMetadataFormState>(
    key: K,
    value: EndpointMetadataFormState[K],
  ) {
    setMetadataForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateNewFieldForm<K extends keyof FieldFormState>(
    key: K,
    value: FieldFormState[K],
  ) {
    setNewFieldForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateFieldEditForm<K extends keyof FieldFormState>(
    key: K,
    value: FieldFormState[K],
  ) {
    setFieldEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateNewBoundaryForm<K extends keyof BoundaryFormState>(
    key: K,
    value: BoundaryFormState[K],
  ) {
    setNewBoundaryForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateBoundaryEditForm<K extends keyof BoundaryFormState>(
    key: K,
    value: BoundaryFormState[K],
  ) {
    setBoundaryEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("metadata");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedEndpoint = await apiClient<DashboardEndpointDetail>(
        `/dashboard/endpoints/${encodeURIComponent(endpointId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(getMetadataPayload(metadataForm)),
        },
      );

      setEndpoint(updatedEndpoint);
      setMetadataForm(toMetadataForm(updatedEndpoint));
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

  async function addField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("field:create");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const field = await apiClient<DashboardEndpointField>(
        `/dashboard/endpoints/${encodeURIComponent(endpointId)}/fields`,
        {
          method: "POST",
          body: JSON.stringify(getFieldPayload(newFieldForm)),
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              fields: sortFields([...currentEndpoint.fields, field]),
            }
          : currentEndpoint,
      );
      setNewFieldForm(emptyFieldForm);
      setSuccessMessage("Field added.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError ? error.message : "Unable to add field.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  function startEditingField(field: DashboardEndpointField) {
    setEditingFieldId(field.id);
    setFieldEditForm(toFieldForm(field));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function cancelEditingField() {
    setEditingFieldId(null);
    setFieldEditForm(emptyFieldForm);
  }

  async function saveField(
    event: FormEvent<HTMLFormElement>,
    fieldId: string,
  ) {
    event.preventDefault();
    setPendingAction(`field:edit:${fieldId}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const field = await apiClient<DashboardEndpointField>(
        `/dashboard/endpoints/${encodeURIComponent(
          endpointId,
        )}/fields/${encodeURIComponent(fieldId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(getFieldPayload(fieldEditForm)),
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              fields: sortFields(
                currentEndpoint.fields.map((currentField) =>
                  currentField.id === field.id ? field : currentField,
                ),
              ),
            }
          : currentEndpoint,
      );
      cancelEditingField();
      setSuccessMessage("Field saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to save field.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteField(field: DashboardEndpointField) {
    if (!window.confirm(`Delete "${field.label}"?`)) {
      return;
    }

    setPendingAction(`field:delete:${field.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient<{ success: boolean }>(
        `/dashboard/endpoints/${encodeURIComponent(
          endpointId,
        )}/fields/${encodeURIComponent(field.id)}`,
        {
          method: "DELETE",
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              fields: currentEndpoint.fields.filter(
                (currentField) => currentField.id !== field.id,
              ),
            }
          : currentEndpoint,
      );

      if (editingFieldId === field.id) {
        cancelEditingField();
      }

      setSuccessMessage("Field deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to delete field.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function moveField(index: number, direction: -1 | 1) {
    if (!endpoint) {
      return;
    }

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= endpoint.fields.length) {
      return;
    }

    const nextFields = [...endpoint.fields];
    const movedField = nextFields[index];
    const swappedField = nextFields[nextIndex];

    if (!movedField || !swappedField) {
      return;
    }

    nextFields[index] = swappedField;
    nextFields[nextIndex] = movedField;

    setPendingAction(`field:reorder:${movedField.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fields = await apiClient<DashboardEndpointField[]>(
        `/dashboard/endpoints/${encodeURIComponent(endpointId)}/fields/reorder`,
        {
          method: "PATCH",
          body: JSON.stringify({
            orderedIds: nextFields.map((field) => field.id),
          }),
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              fields,
            }
          : currentEndpoint,
      );
      setSuccessMessage("Fields reordered.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to reorder fields.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function addBoundary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("boundary:create");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const boundary = await apiClient<DashboardEndpointBoundary>(
        `/dashboard/endpoints/${encodeURIComponent(endpointId)}/boundaries`,
        {
          method: "POST",
          body: JSON.stringify(getBoundaryPayload(newBoundaryForm)),
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              boundaries: sortBoundaries([
                ...currentEndpoint.boundaries,
                boundary,
              ]),
            }
          : currentEndpoint,
      );
      setNewBoundaryForm(emptyBoundaryForm);
      setSuccessMessage("Boundary added.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to add boundary.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  function startEditingBoundary(boundary: DashboardEndpointBoundary) {
    setEditingBoundaryId(boundary.id);
    setBoundaryEditForm(toBoundaryForm(boundary));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function cancelEditingBoundary() {
    setEditingBoundaryId(null);
    setBoundaryEditForm(emptyBoundaryForm);
  }

  async function saveBoundary(
    event: FormEvent<HTMLFormElement>,
    boundaryId: string,
  ) {
    event.preventDefault();
    setPendingAction(`boundary:edit:${boundaryId}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const boundary = await apiClient<DashboardEndpointBoundary>(
        `/dashboard/endpoints/${encodeURIComponent(
          endpointId,
        )}/boundaries/${encodeURIComponent(boundaryId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(getBoundaryPayload(boundaryEditForm)),
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              boundaries: sortBoundaries(
                currentEndpoint.boundaries.map((currentBoundary) =>
                  currentBoundary.id === boundary.id
                    ? boundary
                    : currentBoundary,
                ),
              ),
            }
          : currentEndpoint,
      );
      cancelEditingBoundary();
      setSuccessMessage("Boundary saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to save boundary.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleBoundary(boundary: DashboardEndpointBoundary) {
    setPendingAction(`boundary:toggle:${boundary.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedBoundary = await apiClient<DashboardEndpointBoundary>(
        `/dashboard/endpoints/${encodeURIComponent(
          endpointId,
        )}/boundaries/${encodeURIComponent(boundary.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: !boundary.isActive,
          }),
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              boundaries: sortBoundaries(
                currentEndpoint.boundaries.map((currentBoundary) =>
                  currentBoundary.id === updatedBoundary.id
                    ? updatedBoundary
                    : currentBoundary,
                ),
              ),
            }
          : currentEndpoint,
      );
      setSuccessMessage(
        updatedBoundary.isActive ? "Boundary active." : "Boundary inactive.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to update boundary.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteBoundary(boundary: DashboardEndpointBoundary) {
    if (!window.confirm(`Delete "${boundary.title}"?`)) {
      return;
    }

    setPendingAction(`boundary:delete:${boundary.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient<{ success: boolean }>(
        `/dashboard/endpoints/${encodeURIComponent(
          endpointId,
        )}/boundaries/${encodeURIComponent(boundary.id)}`,
        {
          method: "DELETE",
        },
      );

      setEndpoint((currentEndpoint) =>
        currentEndpoint
          ? {
              ...currentEndpoint,
              boundaries: currentEndpoint.boundaries.filter(
                (currentBoundary) => currentBoundary.id !== boundary.id,
              ),
            }
          : currentEndpoint,
      );

      if (editingBoundaryId === boundary.id) {
        cancelEditingBoundary();
      }

      setSuccessMessage("Boundary deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to delete boundary.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
          Loading endpoint...
        </div>
      </section>
    );
  }

  if (errorMessage === "AUTH_REQUIRED") {
    return (
      <section className="py-10">
        <LoginPrompt />
      </section>
    );
  }

  if (!endpoint || !session) {
    return (
      <section className="py-10">
        <div
          className="rounded-lg border border-[#d19a7a] bg-[#fff8f2] p-5 text-sm leading-6 text-[#7a341b] shadow-sm"
          role="alert"
        >
          {errorMessage ?? "Unable to load endpoint."}
        </div>
      </section>
    );
  }

  const isBusy = pendingAction !== null;
  const publicHref = `/${session.profile.username}/${endpoint.slug}`;

  return (
    <section className="py-10">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
              {endpoint.title}
            </h1>
            <p className="mt-3 font-mono text-sm text-[var(--muted)]">
              /{endpoint.slug}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/endpoints" className={buttonClass()}>
              Back to endpoints
            </Link>
            {isPublicEndpoint(endpoint) ? (
              <Link href={publicHref} className={buttonClass()}>
                Open public URL
              </Link>
            ) : null}
          </div>
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
          onSubmit={saveMetadata}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Metadata</h2>
              <p className="mt-2 font-mono text-sm text-[var(--muted)]">
                /{session.profile.username}/{metadataForm.slug || endpoint.slug}
              </p>
            </div>
            <span className="rounded-md bg-[#f2efe7] px-3 py-2 text-sm text-[var(--muted)]">
              {formatEnumLabel(metadataForm.status)} /{" "}
              {formatEnumLabel(metadataForm.visibility)}
            </span>
          </div>
          <div className="mt-4">
            <MetadataFormFields
              form={metadataForm}
              onChange={updateMetadataForm}
            />
          </div>
          <button
            className="mt-5 rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isBusy}
            type="submit"
          >
            {pendingAction === "metadata" ? "Saving..." : "Save endpoint"}
          </button>
        </form>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Fields</h2>
          <form className="mt-4 rounded-md bg-[#fbfaf7] p-4" onSubmit={addField}>
            <FieldFormFields
              form={newFieldForm}
              idPrefix="new-field"
              onChange={updateNewFieldForm}
            />
            <button
              className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isBusy}
              type="submit"
            >
              {pendingAction === "field:create" ? "Adding..." : "Add field"}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {endpoint.fields.length ? (
              endpoint.fields.map((field, index) => {
                const isEditing = editingFieldId === field.id;
                const isReordering =
                  pendingAction === `field:reorder:${field.id}`;

                return (
                  <article
                    key={field.id}
                    className="rounded-md border border-[var(--line)] p-4"
                  >
                    {isEditing ? (
                      <form onSubmit={(event) => saveField(event, field.id)}>
                        <FieldFormFields
                          form={fieldEditForm}
                          idPrefix={`edit-field-${field.id}`}
                          onChange={updateFieldEditForm}
                        />
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
                            disabled={isBusy}
                            type="submit"
                          >
                            {pendingAction === `field:edit:${field.id}`
                              ? "Saving..."
                              : "Save"}
                          </button>
                          <button
                            className={buttonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={cancelEditingField}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{field.label}</p>
                            <span className="rounded-md bg-[#f2efe7] px-2 py-1 text-xs font-medium text-[var(--muted)]">
                              {formatEnumLabel(field.type)}
                            </span>
                            {field.required ? (
                              <span className="rounded-md border border-[var(--accent)] bg-[#eef8f5] px-2 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                                Required
                              </span>
                            ) : null}
                          </div>
                          {field.helpText ? (
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                              {field.helpText}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={buttonClass()}
                            disabled={isBusy || index === 0}
                            type="button"
                            onClick={() => moveField(index, -1)}
                          >
                            {isReordering ? "Moving..." : "Up"}
                          </button>
                          <button
                            className={buttonClass()}
                            disabled={
                              isBusy || index === endpoint.fields.length - 1
                            }
                            type="button"
                            onClick={() => moveField(index, 1)}
                          >
                            {isReordering ? "Moving..." : "Down"}
                          </button>
                          <button
                            className={buttonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={() => startEditingField(field)}
                          >
                            Edit
                          </button>
                          <button
                            className={dangerButtonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={() => deleteField(field)}
                          >
                            {pendingAction === `field:delete:${field.id}`
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                No fields yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Boundaries</h2>
          <form
            className="mt-4 rounded-md bg-[#fbfaf7] p-4"
            onSubmit={addBoundary}
          >
            <BoundaryFormFields
              form={newBoundaryForm}
              idPrefix="new-boundary"
              onChange={updateNewBoundaryForm}
            />
            <button
              className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isBusy}
              type="submit"
            >
              {pendingAction === "boundary:create"
                ? "Adding..."
                : "Add boundary"}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {endpoint.boundaries.length ? (
              endpoint.boundaries.map((boundary) => {
                const isEditing = editingBoundaryId === boundary.id;

                return (
                  <article
                    key={boundary.id}
                    className="rounded-md border border-[var(--line)] p-4"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(event) => saveBoundary(event, boundary.id)}
                      >
                        <BoundaryFormFields
                          form={boundaryEditForm}
                          idPrefix={`edit-boundary-${boundary.id}`}
                          onChange={updateBoundaryEditForm}
                        />
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
                            disabled={isBusy}
                            type="submit"
                          >
                            {pendingAction === `boundary:edit:${boundary.id}`
                              ? "Saving..."
                              : "Save"}
                          </button>
                          <button
                            className={buttonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={cancelEditingBoundary}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {boundary.title}
                            </p>
                            <span className="rounded-md bg-[#f2efe7] px-2 py-1 text-xs font-medium text-[var(--muted)]">
                              {formatEnumLabel(boundary.priority)}
                            </span>
                            <span
                              className={
                                boundary.isActive
                                  ? "rounded-md border border-[var(--accent)] bg-[#eef8f5] px-2 py-1 text-xs font-semibold text-[var(--accent-strong)]"
                                  : "rounded-md border border-[var(--line)] bg-[#f2efe7] px-2 py-1 text-xs font-semibold text-[var(--muted)]"
                              }
                            >
                              {boundary.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {boundary.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={buttonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={() => toggleBoundary(boundary)}
                          >
                            {pendingAction === `boundary:toggle:${boundary.id}`
                              ? "Saving..."
                              : boundary.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                          <button
                            className={buttonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={() => startEditingBoundary(boundary)}
                          >
                            Edit
                          </button>
                          <button
                            className={dangerButtonClass()}
                            disabled={isBusy}
                            type="button"
                            onClick={() => deleteBoundary(boundary)}
                          >
                            {pendingAction === `boundary:delete:${boundary.id}`
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                No boundaries yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
