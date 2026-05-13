import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "node:path";

import {
  EndpointMethod,
  EndpointStatus,
  EndpointVisibility,
  PrismaClient
} from "../src/generated/prisma/client";

const appEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "../..", ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: appEnvPath, override: true });

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://openme:openme@localhost:5432/openme_dev";

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@openme.local"
    },
    create: {
      email: "demo@openme.local",
      name: "Demo User"
    },
    update: {
      name: "Demo User"
    }
  });

  const profile = await prisma.profile.upsert({
    where: {
      username: "demo"
    },
    create: {
      userId: user.id,
      username: "demo",
      displayName: "Demo User",
      headline: "Actionable public profile",
      bio: "A sample OpenMe profile showing public endpoints.",
      location: "Internet",
      languages: ["English"],
      status: "Open to useful requests",
      currentFocus: "Showing how OpenMe public profiles work",
      isPublic: true
    },
    update: {
      displayName: "Demo User",
      headline: "Actionable public profile",
      bio: "A sample OpenMe profile showing public endpoints.",
      location: "Internet",
      languages: ["English"],
      status: "Open to useful requests",
      currentFocus: "Showing how OpenMe public profiles work",
      avatarUrl: null,
      isPublic: true
    }
  });

  await prisma.link.deleteMany({
    where: {
      profileId: profile.id
    }
  });

  await prisma.endpoint.deleteMany({
    where: {
      profileId: profile.id
    }
  });

  await prisma.link.createMany({
    data: [
      {
        profileId: profile.id,
        title: "GitHub",
        url: "https://github.com/openme-demo",
        position: 0
      },
      {
        profileId: profile.id,
        title: "Portfolio",
        url: "https://example.com",
        position: 1
      }
    ]
  });

  await prisma.endpoint.createMany({
    data: [
      {
        profileId: profile.id,
        slug: "now",
        method: EndpointMethod.GET,
        title: "Now",
        description: "What Demo User is focused on right now.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 0
      },
      {
        profileId: profile.id,
        slug: "collaborate",
        method: EndpointMethod.POST,
        title: "Collaborate",
        description: "Suggest a focused collaboration or project.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 1
      },
      {
        profileId: profile.id,
        slug: "ask-me",
        method: EndpointMethod.POST,
        title: "Ask me",
        description: "Ask a thoughtful question.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 2
      },
      {
        profileId: profile.id,
        slug: "feedback",
        method: EndpointMethod.POST,
        title: "Feedback",
        description: "Share constructive feedback.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 3
      }
    ]
  });

  const endpoints = await prisma.endpoint.findMany({
    where: {
      profileId: profile.id
    },
    select: {
      id: true,
      slug: true
    }
  });

  await prisma.endpointBoundary.createMany({
    data: endpoints.map((endpoint) => ({
      endpointId: endpoint.id,
      title: "Useful and respectful",
      description:
        endpoint.slug === "now"
          ? "Keep requests related to current work and interests."
          : "Send specific, respectful requests that are easy to understand.",
      priority: "MEDIUM"
    }))
  });

  console.log("Seeded demo public profile at /demo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
