type RegisterValidationResult =
  | {
      ok: true;
      value: {
        email: string;
        password: string;
        username: string;
        displayName: string;
      };
    }
  | {
      ok: false;
      errors: string[];
    };

type LoginValidationResult =
  | {
      ok: true;
      value: {
        email: string;
        password: string;
      };
    }
  | {
      ok: false;
      errors: string[];
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-z0-9-]{3,30}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateRegisterBody(body: unknown): RegisterValidationResult {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const displayName =
    typeof body.displayName === "string"
      ? normalizeDisplayName(body.displayName)
      : "";

  if (!emailPattern.test(email)) {
    errors.push("email must be a valid email address");
  }

  if (password.length < 8) {
    errors.push("password must be at least 8 characters");
  }

  if (username.startsWith("@")) {
    errors.push("username must not start with @");
  }

  if (!usernamePattern.test(username)) {
    errors.push(
      "username must be 3-30 characters using lowercase letters, numbers, and hyphen",
    );
  }

  if (!displayName) {
    errors.push("displayName is required");
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      email,
      password,
      username,
      displayName,
    },
  };
}

export function validateLoginBody(body: unknown): LoginValidationResult {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"],
    };
  }

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!emailPattern.test(email)) {
    errors.push("email must be a valid email address");
  }

  if (!password) {
    errors.push("password is required");
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      email,
      password,
    },
  };
}
