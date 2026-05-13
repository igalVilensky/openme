import { prisma } from "../../db/prisma";
import {
  EndpointStatus,
  EndpointVisibility
} from "../../generated/prisma/client";

export type PublicProfileResponse = {
  id: string;
  username: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  languages: string[];
  status: string | null;
  currentFocus: string | null;
  avatarUrl: string | null;
  links: Array<{
    id: string;
    title: string;
    url: string;
    position: number;
  }>;
  endpoints: Array<{
    id: string;
    slug: string;
    method: "GET" | "POST";
    title: string;
    description: string | null;
    position: number;
    boundaries: Array<{
      id: string;
      title: string;
      description: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    }>;
  }>;
};

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

export async function getPublicProfileByUsername(
  usernameParam: string
): Promise<PublicProfileResponse | null> {
  const username = normalizeUsername(usernameParam);

  if (!username) {
    return null;
  }

  return prisma.profile.findFirst({
    where: {
      username,
      isPublic: true
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      headline: true,
      bio: true,
      location: true,
      languages: true,
      status: true,
      currentFocus: true,
      avatarUrl: true,
      links: {
        where: {
          isVisible: true
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          url: true,
          position: true
        }
      },
      endpoints: {
        where: {
          status: EndpointStatus.PUBLISHED,
          visibility: EndpointVisibility.PUBLIC
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          slug: true,
          method: true,
          title: true,
          description: true,
          position: true,
          boundaries: {
            where: {
              isActive: true
            },
            orderBy: {
              createdAt: "asc"
            },
            select: {
              id: true,
              title: true,
              description: true,
              priority: true
            }
          }
        }
      }
    }
  });
}
