export type DashboardLinkCreateInput = {
  title: string;
  url: string;
  isVisible?: boolean;
};

export type DashboardLinkUpdateInput = {
  title?: string;
  url?: string;
  isVisible?: boolean;
};

export type DashboardLinksReorderInput = {
  orderedIds: string[];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateTitle(
  value: unknown,
  fieldName: string,
  errors: string[],
): string | undefined {
  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string`);
    return undefined;
  }

  const title = value.trim();

  if (!title) {
    errors.push(`${fieldName} is required`);
    return undefined;
  }

  if (title.length > 80) {
    errors.push(`${fieldName} must be 80 characters or fewer`);
    return undefined;
  }

  return title;
}

function validateUrl(
  value: unknown,
  fieldName: string,
  errors: string[],
): string | undefined {
  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string`);
    return undefined;
  }

  const url = value.trim();

  if (!url) {
    errors.push(`${fieldName} is required`);
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      errors.push(`${fieldName} must be a valid http or https URL`);
      return undefined;
    }
  } catch {
    errors.push(`${fieldName} must be a valid http or https URL`);
    return undefined;
  }

  return url;
}

function validateOptionalVisibility(
  body: Record<string, unknown>,
  output: DashboardLinkCreateInput | DashboardLinkUpdateInput,
  errors: string[],
): void {
  if (!("isVisible" in body)) {
    return;
  }

  if (typeof body.isVisible !== "boolean") {
    errors.push("isVisible must be a boolean");
    return;
  }

  output.isVisible = body.isVisible;
}

export function validateDashboardLinkCreateBody(
  body: unknown,
): ValidationResult<DashboardLinkCreateInput> {
  const errors: string[] = [];
  const value: Partial<DashboardLinkCreateInput> = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if ("profileId" in body) {
    errors.push("profileId cannot be changed");
  }

  if (!("title" in body)) {
    errors.push("title is required");
  } else {
    value.title = validateTitle(body.title, "title", errors);
  }

  if (!("url" in body)) {
    errors.push("url is required");
  } else {
    value.url = validateUrl(body.url, "url", errors);
  }

  validateOptionalVisibility(body, value, errors);

  if (errors.length || !value.title || !value.url) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      title: value.title,
      url: value.url,
      isVisible: value.isVisible,
    },
  };
}

export function validateDashboardLinkUpdateBody(
  body: unknown,
): ValidationResult<DashboardLinkUpdateInput> {
  const errors: string[] = [];
  const value: DashboardLinkUpdateInput = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if ("profileId" in body) {
    errors.push("profileId cannot be changed");
  }

  if ("title" in body) {
    const title = validateTitle(body.title, "title", errors);

    if (title) {
      value.title = title;
    }
  }

  if ("url" in body) {
    const url = validateUrl(body.url, "url", errors);

    if (url) {
      value.url = url;
    }
  }

  validateOptionalVisibility(body, value, errors);

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

export function validateDashboardLinksReorderBody(
  body: unknown,
): ValidationResult<DashboardLinksReorderInput> {
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
