import { prisma } from "../../db/prisma";
import {
  FieldType,
  Prisma,
  type EndpointMethod,
  type EndpointStatus,
  type EndpointVisibility,
  type Priority,
} from "../../generated/prisma/client";
import type {
  DashboardEndpointBoundaryCreateInput,
  DashboardEndpointBoundaryUpdateInput,
  DashboardEndpointCreateInput,
  DashboardEndpointFieldCreateInput,
  DashboardEndpointFieldUpdateInput,
  DashboardEndpointUpdateInput,
} from "./dashboard-endpoints.validators";
import { needsOptions } from "./dashboard-endpoints.validators";

export type DashboardEndpointSummary = {
  id: string;
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string | null;
  visibility: EndpointVisibility;
  status: EndpointStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
  fieldCount: number;
  boundaryCount: number;
  submissionCount: number;
};

export type DashboardEndpointFieldResponse = {
  id: string;
  type: FieldType;
  label: string;
  helpText: string | null;
  placeholder: string | null;
  options: Prisma.JsonValue | null;
  required: boolean;
  position: number;
};

export type DashboardEndpointBoundaryResponse = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardEndpointDetail = {
  id: string;
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string | null;
  visibility: EndpointVisibility;
  status: EndpointStatus;
  position: number;
  submissionCount: number;
  fields: DashboardEndpointFieldResponse[];
  boundaries: DashboardEndpointBoundaryResponse[];
  createdAt: string;
  updatedAt: string;
};

type EndpointSummaryRecord = {
  id: string;
  slug: string;
  method: EndpointMethod;
  title: string;
  description: string | null;
  visibility: EndpointVisibility;
  status: EndpointStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    fields: number;
    boundaries: number;
    submissions: number;
  };
};

type FieldRecord = {
  id: string;
  type: FieldType;
  label: string;
  helpText: string | null;
  placeholder: string | null;
  options: Prisma.JsonValue | null;
  required: boolean;
  position: number;
};

type BoundaryRecord = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type EndpointDetailRecord = Omit<EndpointSummaryRecord, "_count"> & {
  _count: {
    submissions: number;
  };
  fields: FieldRecord[];
  boundaries: BoundaryRecord[];
};

type MutationResult<TValue> =
  | {
      ok: true;
      value: TValue;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "SLUG_CONFLICT" | "INVALID_FIELD_OPTIONS";
    };

type DeleteEndpointResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "HAS_SUBMISSIONS";
    };

type ReorderResult<TValue> =
  | {
      ok: true;
      value: TValue;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "MISMATCH";
    };

const endpointSummarySelect = {
  id: true,
  slug: true,
  method: true,
  title: true,
  description: true,
  visibility: true,
  status: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      fields: true,
      boundaries: true,
      submissions: true,
    },
  },
} as const;

const fieldSelect = {
  id: true,
  type: true,
  label: true,
  helpText: true,
  placeholder: true,
  options: true,
  required: true,
  position: true,
} as const;

const boundarySelect = {
  id: true,
  title: true,
  description: true,
  priority: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const endpointDetailSelect = {
  id: true,
  slug: true,
  method: true,
  title: true,
  description: true,
  visibility: true,
  status: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      submissions: true,
    },
  },
  fields: {
    orderBy: [
      { position: "asc" },
      { createdAt: "asc" },
    ] as Prisma.EndpointFieldOrderByWithRelationInput[],
    select: fieldSelect,
  },
  boundaries: {
    orderBy: [
      { createdAt: "asc" },
    ] as Prisma.EndpointBoundaryOrderByWithRelationInput[],
    select: boundarySelect,
  },
} as const;

function toEndpointSummary(
  endpoint: EndpointSummaryRecord,
): DashboardEndpointSummary {
  return {
    id: endpoint.id,
    slug: endpoint.slug,
    method: endpoint.method,
    title: endpoint.title,
    description: endpoint.description,
    visibility: endpoint.visibility,
    status: endpoint.status,
    position: endpoint.position,
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString(),
    fieldCount: endpoint._count.fields,
    boundaryCount: endpoint._count.boundaries,
    submissionCount: endpoint._count.submissions,
  };
}

function toFieldResponse(field: FieldRecord): DashboardEndpointFieldResponse {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    placeholder: field.placeholder,
    options: field.options,
    required: field.required,
    position: field.position,
  };
}

function toBoundaryResponse(
  boundary: BoundaryRecord,
): DashboardEndpointBoundaryResponse {
  return {
    id: boundary.id,
    title: boundary.title,
    description: boundary.description,
    priority: boundary.priority,
    isActive: boundary.isActive,
    createdAt: boundary.createdAt.toISOString(),
    updatedAt: boundary.updatedAt.toISOString(),
  };
}

function toEndpointDetail(endpoint: EndpointDetailRecord): DashboardEndpointDetail {
  return {
    id: endpoint.id,
    slug: endpoint.slug,
    method: endpoint.method,
    title: endpoint.title,
    description: endpoint.description,
    visibility: endpoint.visibility,
    status: endpoint.status,
    position: endpoint.position,
    submissionCount: endpoint._count.submissions,
    fields: endpoint.fields.map(toFieldResponse),
    boundaries: endpoint.boundaries.map(toBoundaryResponse),
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString(),
  };
}

function hasExactlyAllIds(orderedIds: string[], existingIds: string[]): boolean {
  if (orderedIds.length !== existingIds.length) {
    return false;
  }

  const orderedIdSet = new Set(orderedIds);

  if (orderedIdSet.size !== orderedIds.length) {
    return false;
  }

  return existingIds.every((id) => orderedIdSet.has(id));
}

function jsonValueToStringOptions(value: Prisma.JsonValue | null): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const options = value.filter(
    (option): option is string => typeof option === "string" && Boolean(option),
  );

  return options.length ? options : null;
}

async function endpointBelongsToProfile(
  profileId: string,
  endpointId: string,
): Promise<boolean> {
  const endpoint = await prisma.endpoint.findFirst({
    where: {
      id: endpointId,
      profileId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(endpoint);
}

async function endpointSlugExists(
  profileId: string,
  slug: string,
  exceptEndpointId?: string,
): Promise<boolean> {
  const endpoint = await prisma.endpoint.findFirst({
    where: {
      profileId,
      slug,
      ...(exceptEndpointId
        ? {
            NOT: {
              id: exceptEndpointId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  return Boolean(endpoint);
}

export async function listDashboardEndpoints(
  profileId: string,
): Promise<DashboardEndpointSummary[]> {
  const endpoints = await prisma.endpoint.findMany({
    where: {
      profileId,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: endpointSummarySelect,
  });

  return endpoints.map(toEndpointSummary);
}

export async function createDashboardEndpoint(
  profileId: string,
  input: DashboardEndpointCreateInput,
): Promise<MutationResult<DashboardEndpointSummary>> {
  if (await endpointSlugExists(profileId, input.slug)) {
    return {
      ok: false,
      reason: "SLUG_CONFLICT",
    };
  }

  const endpoint = await prisma.$transaction(async (transaction) => {
    const positionAggregate = await transaction.endpoint.aggregate({
      where: {
        profileId,
      },
      _max: {
        position: true,
      },
    });

    return transaction.endpoint.create({
      data: {
        profileId,
        slug: input.slug,
        method: input.method,
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        status: input.status,
        position: (positionAggregate._max.position ?? -1) + 1,
      },
      select: endpointSummarySelect,
    });
  });

  return {
    ok: true,
    value: toEndpointSummary(endpoint),
  };
}

export async function getDashboardEndpoint(
  profileId: string,
  endpointId: string,
): Promise<DashboardEndpointDetail | null> {
  const endpoint = await prisma.endpoint.findFirst({
    where: {
      id: endpointId,
      profileId,
    },
    select: endpointDetailSelect,
  });

  return endpoint ? toEndpointDetail(endpoint) : null;
}

export async function updateDashboardEndpoint(
  profileId: string,
  endpointId: string,
  input: DashboardEndpointUpdateInput,
): Promise<MutationResult<DashboardEndpointDetail>> {
  const existingEndpoint = await prisma.endpoint.findFirst({
    where: {
      id: endpointId,
      profileId,
    },
    select: {
      id: true,
    },
  });

  if (!existingEndpoint) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  if (
    input.slug &&
    (await endpointSlugExists(profileId, input.slug, existingEndpoint.id))
  ) {
    return {
      ok: false,
      reason: "SLUG_CONFLICT",
    };
  }

  const endpoint = await prisma.endpoint.update({
    where: {
      id: existingEndpoint.id,
    },
    data: input,
    select: endpointDetailSelect,
  });

  return {
    ok: true,
    value: toEndpointDetail(endpoint),
  };
}

export async function deleteDashboardEndpoint(
  profileId: string,
  endpointId: string,
): Promise<DeleteEndpointResult> {
  const existingEndpoint = await prisma.endpoint.findFirst({
    where: {
      id: endpointId,
      profileId,
    },
    select: {
      id: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!existingEndpoint) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  if (existingEndpoint._count.submissions > 0) {
    return {
      ok: false,
      reason: "HAS_SUBMISSIONS",
    };
  }

  await prisma.endpoint.delete({
    where: {
      id: existingEndpoint.id,
    },
  });

  return {
    ok: true,
  };
}

export async function reorderDashboardEndpoints(
  profileId: string,
  orderedIds: string[],
): Promise<ReorderResult<DashboardEndpointSummary[]>> {
  return prisma.$transaction(async (transaction) => {
    const existingEndpoints = await transaction.endpoint.findMany({
      where: {
        profileId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = existingEndpoints.map((endpoint) => endpoint.id);

    if (!hasExactlyAllIds(orderedIds, existingIds)) {
      return {
        ok: false,
        reason: "MISMATCH",
      };
    }

    await Promise.all(
      orderedIds.map((id, position) =>
        transaction.endpoint.updateMany({
          where: {
            id,
            profileId,
          },
          data: {
            position,
          },
        }),
      ),
    );

    const endpoints = await transaction.endpoint.findMany({
      where: {
        profileId,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: endpointSummarySelect,
    });

    return {
      ok: true,
      value: endpoints.map(toEndpointSummary),
    };
  });
}

export async function createDashboardEndpointField(
  profileId: string,
  endpointId: string,
  input: DashboardEndpointFieldCreateInput,
): Promise<MutationResult<DashboardEndpointFieldResponse>> {
  if (!(await endpointBelongsToProfile(profileId, endpointId))) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  const field = await prisma.$transaction(async (transaction) => {
    const positionAggregate = await transaction.endpointField.aggregate({
      where: {
        endpointId,
      },
      _max: {
        position: true,
      },
    });

    return transaction.endpointField.create({
      data: {
        endpointId,
        type: input.type,
        label: input.label,
        helpText: input.helpText,
        placeholder: input.placeholder,
        options: input.options ?? Prisma.JsonNull,
        required: input.required ?? false,
        position: (positionAggregate._max.position ?? -1) + 1,
      },
      select: fieldSelect,
    });
  });

  return {
    ok: true,
    value: toFieldResponse(field),
  };
}

export async function updateDashboardEndpointField(
  profileId: string,
  endpointId: string,
  fieldId: string,
  input: DashboardEndpointFieldUpdateInput,
): Promise<MutationResult<DashboardEndpointFieldResponse>> {
  const existingField = await prisma.endpointField.findFirst({
    where: {
      id: fieldId,
      endpointId,
      endpoint: {
        profileId,
      },
    },
    select: {
      id: true,
      type: true,
      options: true,
    },
  });

  if (!existingField) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  const nextType = input.type ?? existingField.type;
  const hasOptionsInput = Object.prototype.hasOwnProperty.call(input, "options");
  const nextOptions = hasOptionsInput
    ? (input.options ?? null)
    : jsonValueToStringOptions(existingField.options);
  const data: Prisma.EndpointFieldUpdateInput = {};

  if (input.type) {
    data.type = input.type;
  }

  if (input.label) {
    data.label = input.label;
  }

  if (Object.prototype.hasOwnProperty.call(input, "helpText")) {
    data.helpText = input.helpText;
  }

  if (Object.prototype.hasOwnProperty.call(input, "placeholder")) {
    data.placeholder = input.placeholder;
  }

  if (input.required !== undefined) {
    data.required = input.required;
  }

  if (needsOptions(nextType)) {
    if (!nextOptions || nextOptions.length === 0) {
      return {
        ok: false,
        reason: "INVALID_FIELD_OPTIONS",
      };
    }

    if (hasOptionsInput) {
      data.options = nextOptions;
    }
  } else {
    if (hasOptionsInput && input.options && input.options.length > 0) {
      return {
        ok: false,
        reason: "INVALID_FIELD_OPTIONS",
      };
    }

    if (input.type || hasOptionsInput) {
      data.options = Prisma.JsonNull;
    }
  }

  const field = await prisma.endpointField.update({
    where: {
      id: existingField.id,
    },
    data,
    select: fieldSelect,
  });

  return {
    ok: true,
    value: toFieldResponse(field),
  };
}

export async function deleteDashboardEndpointField(
  profileId: string,
  endpointId: string,
  fieldId: string,
): Promise<boolean> {
  const existingField = await prisma.endpointField.findFirst({
    where: {
      id: fieldId,
      endpointId,
      endpoint: {
        profileId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingField) {
    return false;
  }

  await prisma.endpointField.delete({
    where: {
      id: existingField.id,
    },
  });

  return true;
}

export async function reorderDashboardEndpointFields(
  profileId: string,
  endpointId: string,
  orderedIds: string[],
): Promise<ReorderResult<DashboardEndpointFieldResponse[]>> {
  return prisma.$transaction(async (transaction) => {
    const endpoint = await transaction.endpoint.findFirst({
      where: {
        id: endpointId,
        profileId,
      },
      select: {
        id: true,
      },
    });

    if (!endpoint) {
      return {
        ok: false,
        reason: "NOT_FOUND",
      };
    }

    const existingFields = await transaction.endpointField.findMany({
      where: {
        endpointId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = existingFields.map((field) => field.id);

    if (!hasExactlyAllIds(orderedIds, existingIds)) {
      return {
        ok: false,
        reason: "MISMATCH",
      };
    }

    await Promise.all(
      orderedIds.map((id, position) =>
        transaction.endpointField.updateMany({
          where: {
            id,
            endpointId,
          },
          data: {
            position,
          },
        }),
      ),
    );

    const fields = await transaction.endpointField.findMany({
      where: {
        endpointId,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: fieldSelect,
    });

    return {
      ok: true,
      value: fields.map(toFieldResponse),
    };
  });
}

export async function createDashboardEndpointBoundary(
  profileId: string,
  endpointId: string,
  input: DashboardEndpointBoundaryCreateInput,
): Promise<MutationResult<DashboardEndpointBoundaryResponse>> {
  if (!(await endpointBelongsToProfile(profileId, endpointId))) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  const boundary = await prisma.endpointBoundary.create({
    data: {
      endpointId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      isActive: input.isActive ?? true,
    },
    select: boundarySelect,
  });

  return {
    ok: true,
    value: toBoundaryResponse(boundary),
  };
}

export async function updateDashboardEndpointBoundary(
  profileId: string,
  endpointId: string,
  boundaryId: string,
  input: DashboardEndpointBoundaryUpdateInput,
): Promise<MutationResult<DashboardEndpointBoundaryResponse>> {
  const existingBoundary = await prisma.endpointBoundary.findFirst({
    where: {
      id: boundaryId,
      endpointId,
      endpoint: {
        profileId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingBoundary) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  const boundary = await prisma.endpointBoundary.update({
    where: {
      id: existingBoundary.id,
    },
    data: input,
    select: boundarySelect,
  });

  return {
    ok: true,
    value: toBoundaryResponse(boundary),
  };
}

export async function deleteDashboardEndpointBoundary(
  profileId: string,
  endpointId: string,
  boundaryId: string,
): Promise<boolean> {
  const existingBoundary = await prisma.endpointBoundary.findFirst({
    where: {
      id: boundaryId,
      endpointId,
      endpoint: {
        profileId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingBoundary) {
    return false;
  }

  await prisma.endpointBoundary.delete({
    where: {
      id: existingBoundary.id,
    },
  });

  return true;
}
