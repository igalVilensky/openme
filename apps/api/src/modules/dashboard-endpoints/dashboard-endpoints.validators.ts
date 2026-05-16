import {
  EndpointMethod,
  EndpointStatus,
  EndpointVisibility,
  FieldType,
  Priority,
} from "../../generated/prisma/client";

export type DashboardEndpointCreateInput = {
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string | null;
  visibility: EndpointVisibility;
  status: EndpointStatus;
};

export type DashboardEndpointUpdateInput = {
  slug?: string;
  method?: EndpointMethod;
  title?: string;
  description?: string | null;
  visibility?: EndpointVisibility;
  status?: EndpointStatus;
};

export type DashboardReorderInput = {
  orderedIds: string[];
};

export type DashboardEndpointFieldCreateInput = {
  type: FieldType;
  label: string;
  helpText: string | null;
  placeholder: string | null;
  options: string[] | null;
  required?: boolean;
};

export type DashboardEndpointFieldUpdateInput = {
  type?: FieldType;
  label?: string;
  helpText?: string | null;
  placeholder?: string | null;
  options?: string[] | null;
  required?: boolean;
};

export type DashboardEndpointBoundaryCreateInput = {
  title: string;
  description: string;
  priority: Priority;
  isActive?: boolean;
};

export type DashboardEndpointBoundaryUpdateInput = {
  title?: string;
  description?: string;
  priority?: Priority;
  isActive?: boolean;
};

type ValidationResult<TValue> =
  | {
      ok: true;
      value: TValue;
    }
  | {
      ok: false;
      errors: string[];
    };

const allowedMethods = new Set<string>(Object.values(EndpointMethod));
const allowedVisibilities = new Set<string>(Object.values(EndpointVisibility));
const allowedStatuses = new Set<string>(Object.values(EndpointStatus));
const allowedFieldTypes = new Set<string>(Object.values(FieldType));
const allowedPriorities = new Set<string>(Object.values(Priority));
const optionFieldTypes = new Set<FieldType>([
  FieldType.SELECT,
  FieldType.MULTI_SELECT,
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeNullableText(value: string): string | null {
  const normalized = normalizeText(value);

  return normalized || null;
}

function validateRequiredText(
  value: unknown,
  fieldName: string,
  maxLength: number,
  errors: string[],
): string | undefined {
  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string`);
    return undefined;
  }

  const normalized = normalizeText(value);

  if (!normalized) {
    errors.push(`${fieldName} is required`);
    return undefined;
  }

  if (normalized.length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer`);
    return undefined;
  }

  return normalized;
}

function validateNullableText(
  value: unknown,
  fieldName: string,
  maxLength: number,
  errors: string[],
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string or null`);
    return undefined;
  }

  const normalized = normalizeNullableText(value);

  if (normalized && normalized.length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer`);
    return undefined;
  }

  return normalized;
}

function validateSlug(value: unknown, errors: string[]): string | undefined {
  if (typeof value !== "string") {
    errors.push("slug must be a string");
    return undefined;
  }

  const slug = value.trim();

  if (slug.startsWith("/")) {
    errors.push("slug must not start with a slash");
    return undefined;
  }

  if (slug.length < 2 || slug.length > 50) {
    errors.push("slug must be 2 to 50 characters");
    return undefined;
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    errors.push(
      "slug may only contain lowercase letters, numbers, and hyphens, with no leading or trailing hyphen",
    );
    return undefined;
  }

  return slug;
}

function validateEnum<TValue extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: Set<string>,
  errors: string[],
): TValue | undefined {
  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string`);
    return undefined;
  }

  if (!allowedValues.has(value)) {
    errors.push(
      `${fieldName} must be one of: ${Array.from(allowedValues).join(", ")}`,
    );
    return undefined;
  }

  return value as TValue;
}

function validateOptionalBoolean(
  body: Record<string, unknown>,
  fieldName: string,
  errors: string[],
): boolean | undefined {
  if (!(fieldName in body)) {
    return undefined;
  }

  if (typeof body[fieldName] !== "boolean") {
    errors.push(`${fieldName} must be a boolean`);
    return undefined;
  }

  return body[fieldName];
}

function validateOptions(
  value: unknown,
  type: FieldType,
  errors: string[],
): string[] | null | undefined {
  if (value === undefined || value === null) {
    if (optionFieldTypes.has(type)) {
      errors.push("options are required for select fields");
      return undefined;
    }

    return null;
  }

  if (!Array.isArray(value)) {
    errors.push("options must be an array of strings or null");
    return undefined;
  }

  const options = value.map((option) =>
    typeof option === "string" ? normalizeText(option) : null,
  );

  if (options.some((option) => option === null)) {
    errors.push("options must only contain strings");
    return undefined;
  }

  const normalizedOptions = options.filter((option): option is string =>
    Boolean(option),
  );

  if (!optionFieldTypes.has(type)) {
    if (normalizedOptions.length > 0) {
      errors.push("options must be empty for this field type");
      return undefined;
    }

    return null;
  }

  if (normalizedOptions.length < 1 || normalizedOptions.length > 12) {
    errors.push("options must contain 1 to 12 items");
    return undefined;
  }

  if (normalizedOptions.some((option) => option.length > 80)) {
    errors.push("each option must be 80 characters or fewer");
    return undefined;
  }

  return normalizedOptions;
}

function validateOptionalOptions(
  value: unknown,
  errors: string[],
): string[] | null | undefined {
  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    errors.push("options must be an array of strings or null");
    return undefined;
  }

  const options = value.map((option) =>
    typeof option === "string" ? normalizeText(option) : null,
  );

  if (options.some((option) => option === null)) {
    errors.push("options must only contain strings");
    return undefined;
  }

  const normalizedOptions = options.filter((option): option is string =>
    Boolean(option),
  );

  if (normalizedOptions.length > 12) {
    errors.push("options must contain 12 items or fewer");
    return undefined;
  }

  if (normalizedOptions.some((option) => option.length > 80)) {
    errors.push("each option must be 80 characters or fewer");
    return undefined;
  }

  return normalizedOptions.length ? normalizedOptions : null;
}

function validateOrderedIds(body: unknown): ValidationResult<DashboardReorderInput> {
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if (!Array.isArray(body.orderedIds)) {
    return {
      ok: false,
      errors: ["orderedIds must be an array of strings"],
    };
  }

  if (body.orderedIds.some((id) => typeof id !== "string" || !id.trim())) {
    return {
      ok: false,
      errors: ["orderedIds must only contain non-empty strings"],
    };
  }

  return {
    ok: true,
    value: {
      orderedIds: body.orderedIds,
    },
  };
}

export function validateDashboardEndpointCreateBody(
  body: unknown,
): ValidationResult<DashboardEndpointCreateInput> {
  const errors: string[] = [];
  const value: Partial<DashboardEndpointCreateInput> = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if (!("slug" in body)) {
    errors.push("slug is required");
  } else {
    value.slug = validateSlug(body.slug, errors);
  }

  if (!("method" in body)) {
    errors.push("method is required");
  } else {
    value.method = validateEnum<EndpointMethod>(
      body.method,
      "method",
      allowedMethods,
      errors,
    );
  }

  if (!("title" in body)) {
    errors.push("title is required");
  } else {
    value.title = validateRequiredText(body.title, "title", 100, errors);
  }

  value.description =
    "description" in body
      ? (validateNullableText(body.description, "description", 500, errors) ??
        null)
      : null;

  if (!("visibility" in body)) {
    errors.push("visibility is required");
  } else {
    value.visibility = validateEnum<EndpointVisibility>(
      body.visibility,
      "visibility",
      allowedVisibilities,
      errors,
    );
  }

  if (!("status" in body)) {
    errors.push("status is required");
  } else {
    value.status = validateEnum<EndpointStatus>(
      body.status,
      "status",
      allowedStatuses,
      errors,
    );
  }

  if (
    errors.length ||
    !value.slug ||
    !value.method ||
    !value.title ||
    !value.visibility ||
    !value.status
  ) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      slug: value.slug,
      method: value.method,
      title: value.title,
      description: value.description ?? null,
      visibility: value.visibility,
      status: value.status,
    },
  };
}

export function validateDashboardEndpointUpdateBody(
  body: unknown,
): ValidationResult<DashboardEndpointUpdateInput> {
  const errors: string[] = [];
  const value: DashboardEndpointUpdateInput = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if ("profileId" in body) {
    errors.push("profileId cannot be changed");
  }

  if ("slug" in body) {
    const slug = validateSlug(body.slug, errors);

    if (slug) {
      value.slug = slug;
    }
  }

  if ("method" in body) {
    const method = validateEnum<EndpointMethod>(
      body.method,
      "method",
      allowedMethods,
      errors,
    );

    if (method) {
      value.method = method;
    }
  }

  if ("title" in body) {
    const title = validateRequiredText(body.title, "title", 100, errors);

    if (title) {
      value.title = title;
    }
  }

  if ("description" in body) {
    value.description =
      validateNullableText(body.description, "description", 500, errors) ??
      null;
  }

  if ("visibility" in body) {
    const visibility = validateEnum<EndpointVisibility>(
      body.visibility,
      "visibility",
      allowedVisibilities,
      errors,
    );

    if (visibility) {
      value.visibility = visibility;
    }
  }

  if ("status" in body) {
    const status = validateEnum<EndpointStatus>(
      body.status,
      "status",
      allowedStatuses,
      errors,
    );

    if (status) {
      value.status = status;
    }
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value,
  };
}

export function validateDashboardEndpointReorderBody(
  body: unknown,
): ValidationResult<DashboardReorderInput> {
  return validateOrderedIds(body);
}

export function validateDashboardEndpointFieldCreateBody(
  body: unknown,
): ValidationResult<DashboardEndpointFieldCreateInput> {
  const errors: string[] = [];
  const value: Partial<DashboardEndpointFieldCreateInput> = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if (!("type" in body)) {
    errors.push("type is required");
  } else {
    value.type = validateEnum<FieldType>(
      body.type,
      "type",
      allowedFieldTypes,
      errors,
    );
  }

  if (!("label" in body)) {
    errors.push("label is required");
  } else {
    value.label = validateRequiredText(body.label, "label", 120, errors);
  }

  value.helpText =
    "helpText" in body
      ? (validateNullableText(body.helpText, "helpText", 240, errors) ?? null)
      : null;
  value.placeholder =
    "placeholder" in body
      ? (validateNullableText(body.placeholder, "placeholder", 160, errors) ??
        null)
      : null;

  if (value.type) {
    value.options = validateOptions(body.options, value.type, errors) ?? null;
  }

  const required = validateOptionalBoolean(body, "required", errors);

  if (required !== undefined) {
    value.required = required;
  }

  if (errors.length || !value.type || !value.label) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      type: value.type,
      label: value.label,
      helpText: value.helpText ?? null,
      placeholder: value.placeholder ?? null,
      options: value.options ?? null,
      required: value.required,
    },
  };
}

export function validateDashboardEndpointFieldUpdateBody(
  body: unknown,
): ValidationResult<DashboardEndpointFieldUpdateInput> {
  const errors: string[] = [];
  const value: DashboardEndpointFieldUpdateInput = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if ("endpointId" in body) {
    errors.push("endpointId cannot be changed");
  }

  if ("type" in body) {
    const type = validateEnum<FieldType>(
      body.type,
      "type",
      allowedFieldTypes,
      errors,
    );

    if (type) {
      value.type = type;
    }
  }

  if ("label" in body) {
    const label = validateRequiredText(body.label, "label", 120, errors);

    if (label) {
      value.label = label;
    }
  }

  if ("helpText" in body) {
    value.helpText =
      validateNullableText(body.helpText, "helpText", 240, errors) ?? null;
  }

  if ("placeholder" in body) {
    value.placeholder =
      validateNullableText(body.placeholder, "placeholder", 160, errors) ??
      null;
  }

  if ("options" in body) {
    const options = validateOptionalOptions(body.options, errors);

    if (options !== undefined) {
      value.options = options;
    }
  }

  const required = validateOptionalBoolean(body, "required", errors);

  if (required !== undefined) {
    value.required = required;
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value,
  };
}

export function validateDashboardEndpointFieldReorderBody(
  body: unknown,
): ValidationResult<DashboardReorderInput> {
  return validateOrderedIds(body);
}

export function validateDashboardEndpointBoundaryCreateBody(
  body: unknown,
): ValidationResult<DashboardEndpointBoundaryCreateInput> {
  const errors: string[] = [];
  const value: Partial<DashboardEndpointBoundaryCreateInput> = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if (!("title" in body)) {
    errors.push("title is required");
  } else {
    value.title = validateRequiredText(body.title, "title", 120, errors);
  }

  if (!("description" in body)) {
    errors.push("description is required");
  } else {
    value.description = validateRequiredText(
      body.description,
      "description",
      400,
      errors,
    );
  }

  if ("priority" in body) {
    value.priority = validateEnum<Priority>(
      body.priority,
      "priority",
      allowedPriorities,
      errors,
    );
  } else {
    value.priority = Priority.MEDIUM;
  }

  const isActive = validateOptionalBoolean(body, "isActive", errors);

  if (isActive !== undefined) {
    value.isActive = isActive;
  }

  if (errors.length || !value.title || !value.description || !value.priority) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      title: value.title,
      description: value.description,
      priority: value.priority,
      isActive: value.isActive,
    },
  };
}

export function validateDashboardEndpointBoundaryUpdateBody(
  body: unknown,
): ValidationResult<DashboardEndpointBoundaryUpdateInput> {
  const errors: string[] = [];
  const value: DashboardEndpointBoundaryUpdateInput = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if ("endpointId" in body) {
    errors.push("endpointId cannot be changed");
  }

  if ("title" in body) {
    const title = validateRequiredText(body.title, "title", 120, errors);

    if (title) {
      value.title = title;
    }
  }

  if ("description" in body) {
    const description = validateRequiredText(
      body.description,
      "description",
      400,
      errors,
    );

    if (description) {
      value.description = description;
    }
  }

  if ("priority" in body) {
    const priority = validateEnum<Priority>(
      body.priority,
      "priority",
      allowedPriorities,
      errors,
    );

    if (priority) {
      value.priority = priority;
    }
  }

  const isActive = validateOptionalBoolean(body, "isActive", errors);

  if (isActive !== undefined) {
    value.isActive = isActive;
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value,
  };
}

export function needsOptions(type: FieldType): boolean {
  return optionFieldTypes.has(type);
}
