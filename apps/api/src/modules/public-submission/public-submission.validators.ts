import type {
  FieldType,
  Prisma
} from "../../generated/prisma/client";

export type PublicSubmissionField = {
  id: string;
  type: FieldType;
  label: string;
  options: Prisma.JsonValue | null;
  required: boolean;
};

export type ValidPublicSubmission = {
  submitterName: string | null;
  submitterEmail: string | null;
  data: Record<string, Prisma.InputJsonValue>;
  message: string | null;
};

type ValidationResult =
  | {
      ok: true;
      value: ValidPublicSubmission;
    }
  | {
      ok: false;
      errors: string[];
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalString(
  value: unknown,
  label: string,
  errors: string[]
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${label} must be a string`);
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function isValidEmail(value: string): boolean {
  return emailPattern.test(value);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function asOptionText(value: Prisma.JsonValue): string | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  const optionText = value.label ?? value.name ?? value.value;

  if (
    typeof optionText === "string" ||
    typeof optionText === "number" ||
    typeof optionText === "boolean"
  ) {
    return String(optionText);
  }

  return null;
}

function getOptionTexts(options: Prisma.JsonValue | null): string[] {
  if (!options) {
    return [];
  }

  if (Array.isArray(options)) {
    return [
      ...new Set(
        options
          .map((option) => asOptionText(option))
          .filter((option): option is string => Boolean(option))
      )
    ];
  }

  if (isRecord(options)) {
    const nestedOptions = options.options ?? options.choices ?? options.values;

    if (Array.isArray(nestedOptions)) {
      return getOptionTexts(nestedOptions);
    }
  }

  const singleOption = asOptionText(options);

  return singleOption ? [singleOption] : [];
}

function addStringField(
  field: PublicSubmissionField,
  value: unknown,
  data: Record<string, Prisma.InputJsonValue>,
  errors: string[]
): void {
  if (typeof value !== "string") {
    errors.push(`${field.label} must be a string`);
    return;
  }

  data[field.id] = value.trim();
}

function validateFieldValue(
  field: PublicSubmissionField,
  value: unknown,
  data: Record<string, Prisma.InputJsonValue>,
  errors: string[]
): void {
  switch (field.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      addStringField(field, value, data, errors);
      return;
    case "EMAIL":
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      if (!isValidEmail(value.trim())) {
        errors.push(`${field.label} must be a valid email address`);
        return;
      }

      data[field.id] = value.trim();
      return;
    case "URL":
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      if (!isValidUrl(value.trim())) {
        errors.push(`${field.label} must be a valid URL`);
        return;
      }

      data[field.id] = value.trim();
      return;
    case "DATE":
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      if (!isValidDateString(value.trim())) {
        errors.push(`${field.label} must be a valid date string`);
        return;
      }

      data[field.id] = value.trim();
      return;
    case "RATING":
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        errors.push(`${field.label} must be a number from 1 to 5`);
        return;
      }

      data[field.id] = value;
      return;
    case "SELECT": {
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      const selected = value.trim();
      const options = getOptionTexts(field.options);

      if (options.length > 0 && !options.includes(selected)) {
        errors.push(`${field.label} must match one of: ${options.join(", ")}`);
        return;
      }

      data[field.id] = selected;
      return;
    }
    case "MULTI_SELECT": {
      if (!Array.isArray(value)) {
        errors.push(`${field.label} must be an array`);
        return;
      }

      const selected = value.map((item) =>
        typeof item === "string" ? item.trim() : item
      );

      if (!selected.every((item) => typeof item === "string" && item)) {
        errors.push(`${field.label} must contain only non-empty strings`);
        return;
      }

      const options = getOptionTexts(field.options);
      const invalidOption =
        options.length > 0
          ? selected.find((item) => !options.includes(String(item)))
          : undefined;

      if (invalidOption) {
        errors.push(`${field.label} contains an unsupported option`);
        return;
      }

      data[field.id] = selected;
      return;
    }
    default:
      errors.push(`${field.label} uses an unsupported field type`);
  }
}

export function validatePublicSubmissionBody(
  body: unknown,
  fields: PublicSubmissionField[]
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"]
    };
  }

  const submitterName = parseOptionalString(
    body.submitterName,
    "submitterName",
    errors
  );
  const submitterEmail = parseOptionalString(
    body.submitterEmail,
    "submitterEmail",
    errors
  );
  const message = parseOptionalString(body.message, "message", errors);

  if (submitterEmail && !isValidEmail(submitterEmail)) {
    errors.push("submitterEmail must be a valid email address");
  }

  const submittedData = body.data;

  if (!isRecord(submittedData)) {
    errors.push("data must be an object");

    return {
      ok: false,
      errors
    };
  }

  const fieldIds = new Set(fields.map((field) => field.id));
  const data: Record<string, Prisma.InputJsonValue> = {};

  Object.keys(submittedData).forEach((fieldId) => {
    if (!fieldIds.has(fieldId)) {
      errors.push(`Unknown field id: ${fieldId}`);
    }
  });

  fields.forEach((field) => {
    const value = submittedData[field.id];

    if (!isPresent(value)) {
      if (field.required) {
        errors.push(`${field.label} is required`);
      }

      return;
    }

    validateFieldValue(field, value, data, errors);
  });

  if (errors.length > 0) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    value: {
      submitterName,
      submitterEmail,
      data,
      message
    }
  };
}
