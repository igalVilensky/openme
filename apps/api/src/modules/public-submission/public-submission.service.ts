import { prisma } from "../../db/prisma";
import { HttpError } from "../../errors/http-error";
import {
  EndpointMethod,
  EndpointStatus,
  EndpointVisibility,
  SubmissionStatus
} from "../../generated/prisma/client";
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
      method: true,
      status: true,
      visibility: true,
      fields: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          type: true,
          label: true,
          options: true,
          required: true
        }
      }
    }
  });

  if (!endpoint) {
    throw new HttpError(404, "Public endpoint not found");
  }

  if (
    endpoint.status !== EndpointStatus.PUBLISHED ||
    endpoint.visibility !== EndpointVisibility.PUBLIC
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

  return {
    id: submission.id,
    status: SubmissionStatus.NEW,
    createdAt: submission.createdAt.toISOString(),
    message: "Submission received"
  };
}
