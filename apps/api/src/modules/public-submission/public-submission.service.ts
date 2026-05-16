import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../errors/http-error";
import {
  EndpointMethod,
  EndpointStatus,
  EndpointVisibility,
  Prisma,
  SubmissionStatus
} from "../../generated/prisma/client";
import {
  analyzeSubmissionWithAiService,
  type AnalyzeSubmissionPayload,
  type AnalyzeSubmissionResult
} from "../../services/ai-client";
import { validatePublicSubmissionBody } from "./public-submission.validators";

export type CreatePublicSubmissionResponse = {
  id: string;
  status: "NEW";
  createdAt: string;
  message: "Submission received";
};

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

function normalizeEndpointSlug(endpointSlug: string): string {
  return endpointSlug.trim().replace(/^\/+/, "").toLowerCase();
}

async function saveSubmissionAnalysis(
  submissionId: string,
  analysis: AnalyzeSubmissionResult
): Promise<void> {
  const raw: Prisma.InputJsonObject = {
    summary: analysis.summary,
    intent: analysis.intent,
    boundaryStatus: analysis.boundaryStatus,
    priority: analysis.priority,
    suggestedReply: analysis.suggestedReply
  };

  await prisma.submissionAnalysis.upsert({
    where: {
      submissionId
    },
    create: {
      submissionId,
      summary: analysis.summary,
      intent: analysis.intent,
      boundaryStatus: analysis.boundaryStatus,
      priority: analysis.priority,
      suggestedReply: analysis.suggestedReply,
      raw
    },
    update: {
      summary: analysis.summary,
      intent: analysis.intent,
      boundaryStatus: analysis.boundaryStatus,
      priority: analysis.priority,
      suggestedReply: analysis.suggestedReply,
      raw
    }
  });
}

async function analyzeAndSaveSubmission(
  payload: AnalyzeSubmissionPayload
): Promise<void> {
  const analysis = await analyzeSubmissionWithAiService(payload);

  await saveSubmissionAnalysis(payload.submission.id, analysis);
}

function queueSubmissionAnalysis(payload: AnalyzeSubmissionPayload): void {
  if (!env.aiEnabled) {
    return;
  }

  void analyzeAndSaveSubmission(payload).catch((error) => {
    console.error(
      `AI analysis failed for submission ${payload.submission.id}`,
      error
    );
  });
}

export async function createPublicSubmission(
  usernameParam: string,
  endpointSlugParam: string,
  body: unknown
): Promise<CreatePublicSubmissionResponse> {
  const username = normalizeUsername(usernameParam);
  const slug = normalizeEndpointSlug(endpointSlugParam);

  if (!username) {
    throw new HttpError(404, "Public profile not found");
  }

  if (!slug) {
    throw new HttpError(404, "Public endpoint not found");
  }

  const profile = await prisma.profile.findUnique({
    where: {
      username
    },
    select: {
      id: true,
      isPublic: true
    }
  });

  if (!profile || !profile.isPublic) {
    throw new HttpError(404, "Public profile not found");
  }

  const endpoint = await prisma.endpoint.findFirst({
    where: {
      profileId: profile.id,
      slug
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      method: true,
      status: true,
      visibility: true,
      profile: {
        select: {
          username: true,
          displayName: true
        }
      },
      fields: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          type: true,
          label: true,
          options: true,
          required: true
        }
      },
      boundaries: {
        where: {
          isActive: true
        },
        orderBy: {
          createdAt: "asc"
        },
        select: {
          title: true,
          description: true,
          priority: true
        }
      }
    }
  });

  if (!endpoint) {
    throw new HttpError(404, "Public endpoint not found");
  }

  if (
    endpoint.status !== EndpointStatus.PUBLISHED ||
    endpoint.visibility === EndpointVisibility.PRIVATE
  ) {
    throw new HttpError(404, "Public endpoint not found");
  }

  if (endpoint.method === EndpointMethod.GET) {
    throw new HttpError(405, "GET endpoints do not accept submissions");
  }

  const validation = validatePublicSubmissionBody(body, endpoint.fields);

  if (!validation.ok) {
    throw new HttpError(
      400,
      `Validation failed: ${validation.errors.join("; ")}`
    );
  }

  const submission = await prisma.submission.create({
    data: {
      endpointId: endpoint.id,
      submitterName: validation.value.submitterName,
      submitterEmail: validation.value.submitterEmail,
      data: validation.value.data,
      message: validation.value.message,
      status: SubmissionStatus.NEW
    },
    select: {
      id: true,
      status: true,
      createdAt: true
    }
  });

  queueSubmissionAnalysis({
    profile: endpoint.profile,
    endpoint: {
      slug: endpoint.slug,
      title: endpoint.title,
      description: endpoint.description,
      boundaries: endpoint.boundaries,
      fields: endpoint.fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type
      }))
    },
    submission: {
      id: submission.id,
      submitterName: validation.value.submitterName,
      submitterEmail: validation.value.submitterEmail,
      message: validation.value.message,
      data: validation.value.data
    }
  });

  return {
    id: submission.id,
    status: SubmissionStatus.NEW,
    createdAt: submission.createdAt.toISOString(),
    message: "Submission received"
  };
}
