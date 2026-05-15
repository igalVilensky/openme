import { prisma } from "../../db/prisma";
import type {
  BoundaryStatus,
  FieldType,
  Prisma,
  Priority,
  SubmissionStatus,
} from "../../generated/prisma/client";
import type { InboxStatus } from "./inbox.validators";

// Legacy demo-only owner context. The authenticated dashboard routes below use
// the current owner's profile id; these wrappers keep the public demo flow alive.
const DEMO_OWNER_USERNAME = "demo";
const PREVIEW_LENGTH = 140;

type JsonRecord = Record<string, Prisma.JsonValue>;

export type InboxSubmissionSummary = {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  submitterName: string | null;
  submitterEmail: string | null;
  message: string | null;
  preview: string | null;
  endpoint: {
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
  };
};

export type InboxSubmissionDetail = {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  submitterName: string | null;
  submitterEmail: string | null;
  message: string | null;
  data: Prisma.JsonValue;
  endpoint: {
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
    fields: Array<{
      id: string;
      type: FieldType;
      label: string;
      position: number;
    }>;
  };
  analysis: {
    summary: string | null;
    intent: string | null;
    boundaryStatus: BoundaryStatus;
    priority: Priority;
    suggestedReply: string | null;
  } | null;
};

function isJsonRecord(value: Prisma.JsonValue): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function truncatePreview(value: string): string | null {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length <= PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, PREVIEW_LENGTH - 1)}...`;
}

function jsonValueToPreview(value: Prisma.JsonValue): string | null {
  if (typeof value === "string") {
    return truncatePreview(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const itemPreviews = value
      .map((item) => jsonValueToPreview(item))
      .filter((item): item is string => Boolean(item));

    return truncatePreview(itemPreviews.join(", "));
  }

  if (isJsonRecord(value)) {
    const preferredValue = value.label ?? value.name ?? value.value;

    if (preferredValue !== undefined) {
      return jsonValueToPreview(preferredValue);
    }

    return truncatePreview(JSON.stringify(value));
  }

  return null;
}

function derivePreview(
  message: string | null,
  data: Prisma.JsonValue,
): string | null {
  if (message) {
    const messagePreview = truncatePreview(message);

    if (messagePreview) {
      return messagePreview;
    }
  }

  if (!isJsonRecord(data)) {
    return jsonValueToPreview(data);
  }

  const firstValue = Object.values(data).find((value) =>
    Boolean(jsonValueToPreview(value)),
  );

  return firstValue ? jsonValueToPreview(firstValue) : null;
}

function toSubmissionSummary(submission: {
  id: string;
  status: SubmissionStatus;
  createdAt: Date;
  submitterName: string | null;
  submitterEmail: string | null;
  message: string | null;
  data: Prisma.JsonValue;
  endpoint: {
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
  };
}): InboxSubmissionSummary {
  return {
    id: submission.id,
    status: submission.status,
    createdAt: submission.createdAt.toISOString(),
    submitterName: submission.submitterName,
    submitterEmail: submission.submitterEmail,
    message: submission.message,
    preview: derivePreview(submission.message, submission.data),
    endpoint: submission.endpoint,
  };
}

async function getDemoProfileId(): Promise<string | null> {
  const profile = await prisma.profile.findUnique({
    where: {
      username: DEMO_OWNER_USERNAME,
    },
    select: {
      id: true,
    },
  });

  return profile?.id ?? null;
}

export async function listInboxSubmissions(
  profileId: string,
): Promise<InboxSubmissionSummary[]> {
  const submissions = await prisma.submission.findMany({
    where: {
      endpoint: {
        profileId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      submitterName: true,
      submitterEmail: true,
      message: true,
      data: true,
      endpoint: {
        select: {
          id: true,
          slug: true,
          method: true,
          title: true,
        },
      },
    },
  });

  return submissions.map(toSubmissionSummary);
}

export async function listDemoInboxSubmissions(): Promise<
  InboxSubmissionSummary[]
> {
  const profileId = await getDemoProfileId();

  return profileId ? listInboxSubmissions(profileId) : [];
}

export async function getInboxSubmission(
  profileId: string,
  submissionId: string,
): Promise<InboxSubmissionDetail | null> {
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      endpoint: {
        profileId,
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      submitterName: true,
      submitterEmail: true,
      message: true,
      data: true,
      endpoint: {
        select: {
          id: true,
          slug: true,
          method: true,
          title: true,
          fields: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              type: true,
              label: true,
              position: true,
            },
          },
        },
      },
      analysis: {
        select: {
          summary: true,
          intent: true,
          boundaryStatus: true,
          priority: true,
          suggestedReply: true,
        },
      },
    },
  });

  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    status: submission.status,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    submitterName: submission.submitterName,
    submitterEmail: submission.submitterEmail,
    message: submission.message,
    data: submission.data,
    endpoint: submission.endpoint,
    analysis: submission.analysis,
  };
}

export async function getDemoInboxSubmission(
  submissionId: string,
): Promise<InboxSubmissionDetail | null> {
  const profileId = await getDemoProfileId();

  return profileId ? getInboxSubmission(profileId, submissionId) : null;
}

export async function updateInboxSubmissionStatus(
  profileId: string,
  submissionId: string,
  status: InboxStatus,
): Promise<InboxSubmissionSummary | null> {
  const existingSubmission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      endpoint: {
        profileId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingSubmission) {
    return null;
  }

  const submission = await prisma.submission.update({
    where: {
      id: existingSubmission.id,
    },
    data: {
      status,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      submitterName: true,
      submitterEmail: true,
      message: true,
      data: true,
      endpoint: {
        select: {
          id: true,
          slug: true,
          method: true,
          title: true,
        },
      },
    },
  });

  return toSubmissionSummary(submission);
}

export async function updateDemoInboxSubmissionStatus(
  submissionId: string,
  status: InboxStatus,
): Promise<InboxSubmissionSummary | null> {
  const profileId = await getDemoProfileId();

  return profileId
    ? updateInboxSubmissionStatus(profileId, submissionId, status)
    : null;
}
