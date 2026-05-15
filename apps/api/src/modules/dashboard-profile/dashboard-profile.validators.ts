export type DashboardProfileUpdateInput = {
  displayName?: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  languages?: string[];
  status?: string | null;
  currentFocus?: string | null;
  avatarUrl?: string | null;
  isPublic?: boolean;
};

type DashboardProfileValidationResult =
  | {
      ok: true;
      value: DashboardProfileUpdateInput;
    }
  | {
      ok: false;
      errors: string[];
    };

type NullableStringField = Exclude<
  keyof DashboardProfileUpdateInput,
  "displayName" | "languages" | "isPublic"
>;

const nullableStringMaxLengths: Record<NullableStringField, number> = {
  headline: 140,
  bio: 800,
  location: 120,
  status: 140,
  currentFocus: 180,
  avatarUrl: 2048,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeNullableText(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized || null;
}

function isValidAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateNullableStringField(
  body: Record<string, unknown>,
  field: NullableStringField,
  output: DashboardProfileUpdateInput,
  errors: string[],
): void {
  if (!(field in body)) {
    return;
  }

  const value = body[field];

  if (value === null) {
    output[field] = null;
    return;
  }

  if (typeof value !== "string") {
    errors.push(`${field} must be a string or null`);
    return;
  }

  const normalized = normalizeNullableText(value);
  const maxLength = nullableStringMaxLengths[field];

  if (normalized && normalized.length > maxLength) {
    errors.push(`${field} must be ${maxLength} characters or fewer`);
    return;
  }

  if (field === "avatarUrl" && normalized && !isValidAvatarUrl(normalized)) {
    errors.push("avatarUrl must be a valid http or https URL");
    return;
  }

  output[field] = normalized;
}

export function validateDashboardProfileUpdateBody(
  body: unknown,
): DashboardProfileValidationResult {
  const errors: string[] = [];
  const value: DashboardProfileUpdateInput = {};

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  if ("username" in body) {
    errors.push("username cannot be changed yet");
  }

  if ("displayName" in body) {
    if (typeof body.displayName !== "string") {
      errors.push("displayName must be a string");
    } else {
      const displayName = normalizeOptionalText(body.displayName);

      if (displayName.length > 80) {
        errors.push("displayName must be 80 characters or fewer");
      } else {
        value.displayName = displayName;
      }
    }
  }

  validateNullableStringField(body, "headline", value, errors);
  validateNullableStringField(body, "bio", value, errors);
  validateNullableStringField(body, "location", value, errors);
  validateNullableStringField(body, "status", value, errors);
  validateNullableStringField(body, "currentFocus", value, errors);
  validateNullableStringField(body, "avatarUrl", value, errors);

  if ("languages" in body) {
    if (!Array.isArray(body.languages)) {
      errors.push("languages must be an array of strings");
    } else {
      const languageErrors: string[] = [];
      const languages = body.languages
        .map((language) =>
          typeof language === "string" ? normalizeOptionalText(language) : null,
        )
        .filter((language): language is string => Boolean(language));

      if (body.languages.some((language) => typeof language !== "string")) {
        languageErrors.push("languages must only contain strings");
      }

      if (languages.length > 8) {
        languageErrors.push("languages must contain 8 items or fewer");
      }

      const tooLongLanguage = languages.find(
        (language) => language.length > 40,
      );

      if (tooLongLanguage) {
        languageErrors.push("each language must be 40 characters or fewer");
      }

      if (languageErrors.length) {
        errors.push(...languageErrors);
      } else {
        value.languages = languages;
      }
    }
  }

  if ("isPublic" in body) {
    if (typeof body.isPublic !== "boolean") {
      errors.push("isPublic must be a boolean");
    } else {
      value.isPublic = body.isPublic;
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
