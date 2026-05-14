"use client";

import { FormEvent, useState } from "react";

import { apiBaseUrl } from "@/lib/api-client";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type EndpointFieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "URL"
  | "SELECT"
  | "MULTI_SELECT"
  | "RATING"
  | "DATE";

type PublicEndpointField = {
  id: string;
  type: EndpointFieldType;
  label: string;
  helpText: string | null;
  placeholder: string | null;
  options: JsonValue;
  required: boolean;
  position: number;
};

type FieldValue = string | string[] | number;

type SubmissionResponse = {
  id: string;
  status: "NEW";
  createdAt: string;
  message: string;
};

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

type PublicEndpointFormProps = {
  username: string;
  endpointSlug: string;
  fields: PublicEndpointField[];
};

function asRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

function toOptionLabel(value: JsonValue): string | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  const record = asRecord(value);
  const label = record?.label ?? record?.name ?? record?.value;

  if (
    typeof label === "string" ||
    typeof label === "number" ||
    typeof label === "boolean"
  ) {
    return String(label);
  }

  return null;
}

function getOptionLabels(options: JsonValue): string[] {
  if (!options) {
    return [];
  }

  if (Array.isArray(options)) {
    return [
      ...new Set(
        options
          .map(toOptionLabel)
          .filter((label): label is string => Boolean(label))
      )
    ];
  }

  const record = asRecord(options);
  const nestedOptions = record?.options ?? record?.choices ?? record?.values;

  if (nestedOptions && Array.isArray(nestedOptions)) {
    return getOptionLabels(nestedOptions);
  }

  const label = toOptionLabel(options);

  return label ? [label] : [];
}

function getPlaceholder(field: PublicEndpointField): string {
  if (field.placeholder) {
    return field.placeholder;
  }

  switch (field.type) {
    case "EMAIL":
      return "name@example.com";
    case "URL":
      return "https://example.com";
    case "LONG_TEXT":
      return "Long answer";
    case "SELECT":
      return "Select an option";
    case "SHORT_TEXT":
    default:
      return "Short answer";
  }
}

function getSubmissionUrl(username: string, endpointSlug: string): string {
  const baseUrl = apiBaseUrl.endsWith("/")
    ? apiBaseUrl.slice(0, -1)
    : apiBaseUrl;

  return `${baseUrl}/public/profiles/${encodeURIComponent(
    username
  )}/endpoints/${encodeURIComponent(endpointSlug)}/submissions`;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;

    return body.error?.message ?? "Submission failed";
  } catch {
    return "Submission failed";
  }
}

export function PublicEndpointForm({
  username,
  endpointSlug,
  fields
}: PublicEndpointFormProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>(
    {}
  );
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmissionResponse | null>(null);

  function setFieldValue(fieldId: string, value: FieldValue): void {
    setFieldValues((currentValues) => ({
      ...currentValues,
      [fieldId]: value
    }));
  }

  function resetForm(): void {
    setFieldValues({});
    setSubmitterName("");
    setSubmitterEmail("");
    setMessage("");
    setErrorMessage(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccess(null);

    const data: Record<string, unknown> = {};

    fields.forEach((field) => {
      const value = fieldValues[field.id];

      if (field.type === "MULTI_SELECT") {
        if (Array.isArray(value) && value.length > 0) {
          data[field.id] = value;
        }

        return;
      }

      if (field.type === "RATING") {
        if (typeof value === "number") {
          data[field.id] = value;
        }

        return;
      }

      if (typeof value === "string" && value.trim()) {
        data[field.id] = value.trim();
      }
    });

    try {
      const response = await fetch(getSubmissionUrl(username, endpointSlug), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submitterName: submitterName.trim() || undefined,
          submitterEmail: submitterEmail.trim() || undefined,
          data,
          message: message.trim() || undefined
        })
      });

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response));
        return;
      }

      const submission = (await response.json()) as SubmissionResponse;
      setSuccess(submission);
      setFieldValues({});
      setSubmitterName("");
      setSubmitterEmail("");
      setMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Submission failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="rounded-md border border-[var(--accent)] bg-[#eef8f5] p-5"
        role="status"
      >
        <p className="text-sm font-semibold text-[var(--accent-strong)]">
          {success.message}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Your submission is saved as {success.status.toLowerCase()}.
        </p>
        <button
          className="mt-4 rounded-md border border-[var(--accent)] bg-white px-4 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:bg-[#f8fbfa]"
          type="button"
          onClick={resetForm}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-md border border-[var(--line)] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="submitter-name">
              Your name
            </label>
            <input
              id="submitter-name"
              className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
              type="text"
              value={submitterName}
              onChange={(event) => setSubmitterName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="submitter-email">
              Reply email
            </label>
            <input
              id="submitter-email"
              className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
              placeholder="name@example.com"
              type="email"
              value={submitterEmail}
              onChange={(event) => setSubmitterEmail(event.target.value)}
            />
          </div>
        </div>
      </div>

      {fields.length ? (
        fields.map((field) => (
          <EndpointFormField
            key={field.id}
            field={field}
            value={fieldValues[field.id]}
            onChange={(value) => setFieldValue(field.id, value)}
          />
        ))
      ) : (
        <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          No fields configured yet.
        </p>
      )}

      <div className="rounded-md border border-[var(--line)] p-4">
        <label className="text-sm font-medium" htmlFor="submission-message">
          Message
        </label>
        <textarea
          id="submission-message"
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
          placeholder="Anything else worth knowing?"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      {errorMessage ? (
        <p
          className="rounded-md border border-[#d19a7a] bg-[#fff8f2] p-3 text-sm leading-6 text-[#7a341b]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-65"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send submission"}
      </button>
    </form>
  );
}

function EndpointFormField({
  field,
  value,
  onChange
}: {
  field: PublicEndpointField;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
}) {
  const id = `field-${field.id}`;

  return (
    <div className="rounded-md border border-[var(--line)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor={id}>
            {field.label}
          </label>
          {field.helpText ? (
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {field.helpText}
            </p>
          ) : null}
        </div>
        {field.required ? (
          <span className="rounded-md bg-[#f2efe7] px-2 py-1 text-xs font-medium text-[var(--muted)]">
            Required
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <FieldControl
          field={field}
          id={id}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

function FieldControl({
  field,
  id,
  value,
  onChange
}: {
  field: PublicEndpointField;
  id: string;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
}) {
  const options = getOptionLabels(field.options);
  const placeholder = getPlaceholder(field);
  const inputClass =
    "w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]";

  switch (field.type) {
    case "LONG_TEXT":
      return (
        <textarea
          id={id}
          className={inputClass}
          placeholder={placeholder}
          required={field.required}
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "EMAIL":
      return (
        <input
          id={id}
          className={inputClass}
          placeholder={placeholder}
          required={field.required}
          type="email"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "URL":
      return (
        <input
          id={id}
          className={inputClass}
          placeholder={placeholder}
          required={field.required}
          type="url"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "DATE":
      return (
        <input
          id={id}
          className={inputClass}
          required={field.required}
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "SELECT":
      return (
        <select
          id={id}
          className={inputClass}
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "MULTI_SELECT": {
      const selectedOptions = Array.isArray(value) ? value : [];

      return (
        <div
          className="space-y-2 rounded-md border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm text-[var(--muted)]"
          id={id}
        >
          {options.length ? (
            options.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={selectedOptions.includes(option)}
                  type="checkbox"
                  value={option}
                  onChange={(event) => {
                    const nextValue = event.target.checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item) => item !== option);

                    onChange(nextValue);
                  }}
                />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
      );
    }
    case "RATING":
      return (
        <div className="flex flex-wrap gap-2" id={id}>
          {[1, 2, 3, 4, 5].map((rating) => {
            const isSelected = value === rating;

            return (
              <label
                key={rating}
                className={
                  isSelected
                    ? "flex h-10 w-10 items-center justify-center rounded-md border border-[var(--accent)] bg-[#eef8f5] text-sm font-semibold text-[var(--accent-strong)]"
                    : "flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] bg-[#fbfaf7] text-sm text-[var(--muted)]"
                }
              >
                <input
                  className="sr-only"
                  checked={isSelected}
                  name={`rating-${field.id}`}
                  required={field.required}
                  type="radio"
                  value={rating}
                  onChange={() => onChange(rating)}
                />
                <span>{rating}</span>
              </label>
            );
          })}
        </div>
      );
    case "SHORT_TEXT":
    default:
      return (
        <input
          id={id}
          className={inputClass}
          placeholder={placeholder}
          required={field.required}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}
