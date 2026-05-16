export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type EndpointMethod = "GET" | "POST";
export type EndpointVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";
export type EndpointStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type FieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "URL"
  | "SELECT"
  | "MULTI_SELECT"
  | "RATING"
  | "DATE";
export type BoundaryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DashboardEndpointSummary = {
  id: string;
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string | null;
  visibility: EndpointVisibility;
  status: EndpointStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
  fieldCount: number;
  boundaryCount: number;
  submissionCount: number;
};

export type DashboardEndpointField = {
  id: string;
  type: FieldType;
  label: string;
  helpText: string | null;
  placeholder: string | null;
  options: JsonValue;
  required: boolean;
  position: number;
};

export type DashboardEndpointBoundary = {
  id: string;
  title: string;
  description: string;
  priority: BoundaryPriority;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardEndpointDetail = {
  id: string;
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string | null;
  visibility: EndpointVisibility;
  status: EndpointStatus;
  position: number;
  submissionCount: number;
  fields: DashboardEndpointField[];
  boundaries: DashboardEndpointBoundary[];
  createdAt: string;
  updatedAt: string;
};

export type EndpointMetadataFormState = {
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string;
  visibility: EndpointVisibility;
  status: EndpointStatus;
};

export type FieldFormState = {
  type: FieldType;
  label: string;
  helpText: string;
  placeholder: string;
  options: string;
  required: boolean;
};

export type BoundaryFormState = {
  title: string;
  description: string;
  priority: BoundaryPriority;
  isActive: boolean;
};

export const endpointMethods: EndpointMethod[] = ["POST", "GET"];
export const endpointVisibilities: EndpointVisibility[] = [
  "PUBLIC",
  "PRIVATE",
  "UNLISTED",
];
export const endpointStatuses: EndpointStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];
export const fieldTypes: FieldType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "EMAIL",
  "URL",
  "SELECT",
  "MULTI_SELECT",
  "RATING",
  "DATE",
];
export const boundaryPriorities: BoundaryPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const emptyEndpointMetadataForm: EndpointMetadataFormState = {
  slug: "",
  method: "POST",
  title: "",
  description: "",
  visibility: "PUBLIC",
  status: "DRAFT",
};

export const emptyFieldForm: FieldFormState = {
  type: "LONG_TEXT",
  label: "",
  helpText: "",
  placeholder: "",
  options: "",
  required: true,
};

export const emptyBoundaryForm: BoundaryFormState = {
  title: "",
  description: "",
  priority: "MEDIUM",
  isActive: true,
};

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function nullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed || null;
}

export function toMetadataForm(
  endpoint: DashboardEndpointDetail | DashboardEndpointSummary,
): EndpointMetadataFormState {
  return {
    slug: endpoint.slug,
    method: endpoint.method,
    title: endpoint.title,
    description: endpoint.description ?? "",
    visibility: endpoint.visibility,
    status: endpoint.status,
  };
}

export function getMetadataPayload(form: EndpointMetadataFormState) {
  return {
    slug: form.slug.trim(),
    method: form.method,
    title: form.title.trim(),
    description: nullableText(form.description),
    visibility: form.visibility,
    status: form.status,
  };
}

export function isPublicEndpoint(
  endpoint: Pick<DashboardEndpointSummary, "status" | "visibility">,
): boolean {
  return endpoint.status === "PUBLISHED" && endpoint.visibility !== "PRIVATE";
}
