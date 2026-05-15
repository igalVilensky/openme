import { prisma } from "../../db/prisma";
import type { DashboardProfileUpdateInput } from "./dashboard-profile.validators";

export type DashboardProfileResponse = {
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
  isPublic: boolean;
};

const dashboardProfileSelect = {
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
  isPublic: true,
} as const;

export async function getDashboardProfile(
  profileId: string,
): Promise<DashboardProfileResponse | null> {
  return prisma.profile.findUnique({
    where: {
      id: profileId,
    },
    select: dashboardProfileSelect,
  });
}

export async function updateDashboardProfile(
  profileId: string,
  input: DashboardProfileUpdateInput,
): Promise<DashboardProfileResponse> {
  return prisma.profile.update({
    where: {
      id: profileId,
    },
    data: input,
    select: dashboardProfileSelect,
  });
}
