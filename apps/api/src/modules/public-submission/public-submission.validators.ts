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
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const submitterNameMaxLength = 120;
const emailMaxLength = 254;
const messageMaxLength = 5000;
const shortTextMaxLength = 300;
const longTextMaxLength = 5000;
const urlMaxLength = 2000;
const multiSelectMaxItems = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalString(
  value: unknown,
  label: string,
  maxLength: number,
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

  if (trimmed.length > maxLength) {
    errors.push(`${label} must be ${maxLength} characters or fewer`);
    return null;
  }

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
  return value.length <= emailMaxLength && emailPattern.test(value);
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
  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
  maxLength: number,
  data: Record<string, Prisma.InputJsonValue>,
  errors: string[]
): void {
  if (typeof value !== "string") {
    errors.push(`${field.label} must be a string`);
    return;
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    errors.push(`${field.label} must be ${maxLength} characters or fewer`);
    return;
  }

  data[field.id] = trimmed;
}

function validateFieldValue(
  field: PublicSubmissionField,
  value: unknown,
  data: Record<string, Prisma.InputJsonValue>,
  errors: string[]
): void {
  switch (field.type) {
    case "SHORT_TEXT":
      addStringField(field, value, shortTextMaxLength, data, errors);
      return;
    case "LONG_TEXT":
      addStringField(field, value, longTextMaxLength, data, errors);
      return;
    case "EMAIL":
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      const email = value.trim();

      if (!isValidEmail(email)) {
        errors.push(`${field.label} must be a valid email address`);
        return;
      }

      data[field.id] = email;
      return;
    case "URL":
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      const url = value.trim();

      if (url.length > urlMaxLength) {
        errors.push(`${field.label} must be ${urlMaxLength} characters or fewer`);
        return;
      }

      if (!isValidUrl(url)) {
        errors.push(`${field.label} must be a valid URL`);
        return;
      }

      data[field.id] = url;
      return;
    case "DATE":
      if (typeof value !== "string") {
        errors.push(`${field.label} must be a string`);
        return;
      }

      const date = value.trim();

      if (!isValidDateString(date)) {
        errors.push(`${field.label} must be a valid YYYY-MM-DD date`);
        return;
      }

      data[field.id] = date;
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

      if (!options.length) {
        errors.push(`${field.label} does not have configured options`);
        return;
      }

      if (!options.includes(selected)) {
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

      if (value.length > multiSelectMaxItems) {
        errors.push(
          `${field.label} must include ${multiSelectMaxItems} options or fewer`
        );
        return;
      }

      const selected = value.map((item) => {
        return typeof item === "string" ? item.trim() : "";
      });

      if (!selected.every((item) => typeof item === "string" && item)) {
        errors.push(`${field.label} must contain only non-empty strings`);
        return;
      }

      const options = getOptionTexts(field.options);

      if (!options.length) {
        errors.push(`${field.label} does not have configured options`);
        return;
      }

      const invalidOption = selected.find((item) => !options.includes(item));

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
    submitterNameMaxLength,
    errors
  );
  const submitterEmail = parseOptionalString(
    body.submitterEmail,
    "submitterEmail",
    emailMaxLength,
    errors
  );
  const message = parseOptionalString(
    body.message,
    "message",
    messageMaxLength,
    errors
  );

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
