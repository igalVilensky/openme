import Link from "next/link";

import { ApiClientError, apiClient } from "@/lib/api-client";
import { formatHandle, normalizeUsernameSlug } from "@/lib/username";
import { PublicEndpointForm } from "./submission-form";

type EndpointPageProps = {
  params: Promise<{
    username: string;
    endpointSlug: string;
  }>;
};

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

type PublicEndpoint = {
  profile: {
    username: string;
    displayName: string | null;
  };
  endpoint: {
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
    description: string | null;
    fields: PublicEndpointField[];
    boundaries: Array<{
      id: string;
      title: string;
      description: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    }>;
  };
};

function normalizeEndpointSlug(segment: string): string {
  return decodeURIComponent(segment).replace(/^\/+/, "");
}

async function getPublicEndpoint(
  usernameSlug: string,
  endpointSlug: string
): Promise<PublicEndpoint | null> {
  try {
    return await apiClient<PublicEndpoint>(
      `/public/profiles/${encodeURIComponent(usernameSlug)}/endpoints/${encodeURIComponent(endpointSlug)}`,
      {
        cache: "no-store"
      }
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

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
    return options
      .map(toOptionLabel)
      .filter((label): label is string => Boolean(label));
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
    case "DATE":
      return "";
    case "SELECT":
      return "Select an option";
    case "MULTI_SELECT":
      return "Multiple choices";
    case "RATING":
      return "Rating";
    case "SHORT_TEXT":
    default:
      return "Short answer";
  }
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FieldControl({ field }: { field: PublicEndpointField }) {
  const id = `field-${field.id}`;
  const options = getOptionLabels(field.options);
  const placeholder = getPlaceholder(field);
  const inputClass =
    "w-full rounded-md border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm text-[var(--muted)] disabled:cursor-not-allowed";

  switch (field.type) {
    case "LONG_TEXT":
      return (
        <textarea
          id={id}
          className={inputClass}
          disabled
          placeholder={placeholder}
          rows={4}
        />
      );
    case "EMAIL":
      return (
        <input
          id={id}
          className={inputClass}
          disabled
          placeholder={placeholder}
          type="email"
        />
      );
    case "URL":
      return (
        <input
          id={id}
          className={inputClass}
          disabled
          placeholder={placeholder}
          type="url"
        />
      );
    case "DATE":
      return <input id={id} className={inputClass} disabled type="date" />;
    case "SELECT":
      return (
        <select id={id} className={inputClass} disabled defaultValue="">
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "MULTI_SELECT":
      return (
        <div
          className="space-y-2 rounded-md border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm text-[var(--muted)]"
          id={id}
        >
          {options.length ? (
            options.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input className="h-4 w-4" disabled type="checkbox" />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
      );
    case "RATING":
      return (
        <div className="flex flex-wrap gap-2" id={id}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <label
              key={rating}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] bg-[#fbfaf7] text-sm text-[var(--muted)]"
            >
              <input
                className="sr-only"
                disabled
                name={`rating-${field.id}`}
                type="radio"
                value={rating}
              />
              <span>{rating}</span>
            </label>
          ))}
        </div>
      );
    case "SHORT_TEXT":
    default:
      return (
        <input
          id={id}
          className={inputClass}
          disabled
          placeholder={placeholder}
          type="text"
        />
      );
  }
}

function EndpointField({ field }: { field: PublicEndpointField }) {
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
        <FieldControl field={field} />
      </div>
    </div>
  );
}

function EndpointNotFound({
  handle,
  usernameSlug
}: {
  handle: string;
  usernameSlug: string;
}) {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href={`/${usernameSlug}`} className="text-base font-semibold">
            {handle}
          </Link>
          <Link
            href="/"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            OpenMe
          </Link>
        </header>

        <section className="py-10">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--accent)]">
              Public endpoint
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
              Not available
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              This public endpoint is not available.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function PublicEndpointPage({
  params
}: EndpointPageProps) {
  const { username, endpointSlug } = await params;
  const usernameSlug = normalizeUsernameSlug(username);
  const requestedSlug = normalizeEndpointSlug(endpointSlug);
  const publicEndpoint = await getPublicEndpoint(usernameSlug, requestedSlug);
  const handle = formatHandle(publicEndpoint?.profile.username ?? usernameSlug);

  if (!publicEndpoint) {
    return <EndpointNotFound handle={handle} usernameSlug={usernameSlug} />;
  }

  const { endpoint, profile } = publicEndpoint;
  const profileHandle = formatHandle(profile.username);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link
            href={`/${profile.username}`}
            className="text-base font-semibold"
          >
            {profileHandle}
          </Link>
          <Link
            href="/"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            OpenMe
          </Link>
        </header>

        <section className="py-10">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p
                  className={
                    endpoint.method === "GET"
                      ? "text-sm font-semibold text-[var(--ink-blue)]"
                      : "text-sm font-semibold text-[var(--accent)]"
                  }
                >
                  {endpoint.method}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[0]">
                  {endpoint.title}
                </h1>
                <p className="mt-2 font-mono text-lg text-[var(--muted)]">
                  /{endpoint.slug}
                </p>
                {endpoint.description ? (
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                    {endpoint.description}
                  </p>
                ) : null}
              </div>
              <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
                {profile.displayName ?? profileHandle}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section>
                <h2 className="text-sm font-semibold">
                  {endpoint.method === "POST" ? "Submit" : "Fields"}
                </h2>
                <div className="mt-3 space-y-3">
                  {endpoint.method === "POST" ? (
                    <PublicEndpointForm
                      endpointSlug={endpoint.slug}
                      fields={endpoint.fields}
                      username={profile.username}
                    />
                  ) : endpoint.fields.length ? (
                    endpoint.fields.map((field) => (
                      <EndpointField key={field.id} field={field} />
                    ))
                  ) : (
                    <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                      No fields configured yet.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold">Boundaries</h2>
                <div className="mt-3 space-y-3">
                  {endpoint.boundaries.length ? (
                    endpoint.boundaries.map((boundary) => (
                      <div
                        key={boundary.id}
                        className="rounded-md border border-[var(--line)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">
                            {boundary.title}
                          </p>
                          <span className="rounded-md bg-[#f2efe7] px-2 py-1 text-xs font-medium text-[var(--muted)]">
                            {formatEnumLabel(boundary.priority)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {boundary.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                      No active boundaries.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
