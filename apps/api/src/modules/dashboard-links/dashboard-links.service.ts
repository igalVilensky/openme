import { prisma } from "../../db/prisma";
import type {
  DashboardLinkCreateInput,
  DashboardLinkUpdateInput,
} from "./dashboard-links.validators";

export type DashboardLinkResponse = {
  id: string;
  title: string;
  url: string;
  position: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type LinkRecord = {
  id: string;
  title: string;
  url: string;
  position: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ReorderDashboardLinksResult =
  | {
      ok: true;
      links: DashboardLinkResponse[];
    }
  | {
      ok: false;
      reason: "MISMATCH";
    };

const dashboardLinkSelect = {
  id: true,
  title: true,
  url: true,
  position: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toDashboardLinkResponse(link: LinkRecord): DashboardLinkResponse {
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    position: link.position,
    isVisible: link.isVisible,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

function hasExactlyAllLinkIds(
  orderedIds: string[],
  existingIds: string[],
): boolean {
  if (orderedIds.length !== existingIds.length) {
    return false;
  }

  const orderedIdSet = new Set(orderedIds);

  if (orderedIdSet.size !== orderedIds.length) {
    return false;
  }

  return existingIds.every((id) => orderedIdSet.has(id));
}

export async function listDashboardLinks(
  profileId: string,
): Promise<DashboardLinkResponse[]> {
  const links = await prisma.link.findMany({
    where: {
      profileId,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: dashboardLinkSelect,
  });

  return links.map(toDashboardLinkResponse);
}

export async function createDashboardLink(
  profileId: string,
  input: DashboardLinkCreateInput,
): Promise<DashboardLinkResponse> {
  const link = await prisma.$transaction(async (transaction) => {
    const positionAggregate = await transaction.link.aggregate({
      where: {
        profileId,
      },
      _max: {
        position: true,
      },
    });

    return transaction.link.create({
      data: {
        profileId,
        title: input.title,
        url: input.url,
        isVisible: input.isVisible ?? true,
        position: (positionAggregate._max.position ?? -1) + 1,
      },
      select: dashboardLinkSelect,
    });
  });

  return toDashboardLinkResponse(link);
}

export async function updateDashboardLink(
  profileId: string,
  linkId: string,
  input: DashboardLinkUpdateInput,
): Promise<DashboardLinkResponse | null> {
  const existingLink = await prisma.link.findFirst({
    where: {
      id: linkId,
      profileId,
    },
    select: {
      id: true,
    },
  });

  if (!existingLink) {
    return null;
  }

  const link = await prisma.link.update({
    where: {
      id: existingLink.id,
    },
    data: input,
    select: dashboardLinkSelect,
  });

  return toDashboardLinkResponse(link);
}

export async function deleteDashboardLink(
  profileId: string,
  linkId: string,
): Promise<boolean> {
  const existingLink = await prisma.link.findFirst({
    where: {
      id: linkId,
      profileId,
    },
    select: {
      id: true,
    },
  });

  if (!existingLink) {
    return false;
  }

  await prisma.link.delete({
    where: {
      id: existingLink.id,
    },
  });

  return true;
}

export async function reorderDashboardLinks(
  profileId: string,
  orderedIds: string[],
): Promise<ReorderDashboardLinksResult> {
  return prisma.$transaction(async (transaction) => {
    const existingLinks = await transaction.link.findMany({
      where: {
        profileId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = existingLinks.map((link) => link.id);

    if (!hasExactlyAllLinkIds(orderedIds, existingIds)) {
      return {
        ok: false,
        reason: "MISMATCH",
      };
    }

    await Promise.all(
      orderedIds.map((id, position) =>
        transaction.link.updateMany({
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

    const links = await transaction.link.findMany({
      where: {
        profileId,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: dashboardLinkSelect,
    });

    return {
      ok: true,
      links: links.map(toDashboardLinkResponse),
    };
  });
}
