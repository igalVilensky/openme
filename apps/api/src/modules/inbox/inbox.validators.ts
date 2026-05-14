import { SubmissionStatus } from "../../generated/prisma/client";

export const allowedInboxStatuses = [
  SubmissionStatus.NEW,
  SubmissionStatus.REVIEWED,
  SubmissionStatus.REPLIED,
  SubmissionStatus.ARCHIVED,
  SubmissionStatus.BLOCKED
] as const;

export type InboxStatus = (typeof allowedInboxStatuses)[number];

type StatusValidationResult =
  | {
      ok: true;
      value: {
        status: InboxStatus;
      };
    }
  | {
      ok: false;
      errors: string[];
    };

const allowedStatusSet = new Set<string>(allowedInboxStatuses);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateInboxStatusBody(
  body: unknown
): StatusValidationResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: ["Request body must be an object"]
    };
  }

  if (typeof body.status !== "string") {
    return {
      ok: false,
      errors: ["status must be a string"]
    };
  }

  if (!allowedStatusSet.has(body.status)) {
    return {
      ok: false,
      errors: [
        `status must be one of: ${allowedInboxStatuses.join(", ")}`
      ]
    };
  }

  return {
    ok: true,
    value: {
      status: body.status as InboxStatus
    }
  };
}
