import { env } from "../config/env";
import type {
  BoundaryStatus,
  FieldType,
  Priority
} from "../generated/prisma/client";

const boundaryStatuses = [
  "FITS",
  "UNCLEAR",
  "VIOLATES",
  "NEEDS_REVIEW"
] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type AnalyzeSubmissionPayload = {
  profile: {
    username: string;
    displayName: string | null;
  };
  endpoint: {
    slug: string;
    title: string;
    description: string | null;
    boundaries: Array<{
      title: string;
      description: string;
      priority: Priority;
    }>;
    fields: Array<{
      id: string;
      label: string;
      type: FieldType;
    }>;
  };
  submission: {
    id: string;
    submitterName: string | null;
    submitterEmail: string | null;
    message: string | null;
    data: Record<string, unknown>;
  };
};

export type AnalyzeSubmissionResult = {
  summary: string;
  intent: string;
  boundaryStatus: BoundaryStatus;
  priority: Priority;
  suggestedReply: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundaryStatus(value: unknown): value is BoundaryStatus {
  return (
    typeof value === "string" &&
    (boundaryStatuses as readonly string[]).includes(value)
  );
}

function isPriority(value: unknown): value is Priority {
  return (
    typeof value === "string" && (priorities as readonly string[]).includes(value)
  );
}

function validateAnalyzeSubmissionResult(
  value: unknown
): AnalyzeSubmissionResult {
  if (!isRecord(value)) {
    throw new Error("AI service response must be an object");
  }

  const {
    summary,
    intent,
    boundaryStatus,
    priority,
    suggestedReply
  } = value;

  if (
    typeof summary !== "string" ||
    typeof intent !== "string" ||
    !isBoundaryStatus(boundaryStatus) ||
    !isPriority(priority) ||
    typeof suggestedReply !== "string"
  ) {
    throw new Error("AI service response did not match expected analysis shape");
  }

  return {
    summary,
    intent,
    boundaryStatus,
    priority,
    suggestedReply
  };
}

export async function analyzeSubmissionWithAiService(
  payload: AnalyzeSubmissionPayload
): Promise<AnalyzeSubmissionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${env.aiServiceUrl}/analyze-submission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`AI service returned HTTP ${response.status}`);
    }

    return validateAnalyzeSubmissionResult(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
