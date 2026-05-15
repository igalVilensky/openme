import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";

import {
  FieldType,
  EndpointMethod,
  EndpointStatus,
  EndpointVisibility,
  PrismaClient,
} from "../src/generated/prisma/client";

const appEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "../..", ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: appEnvPath, override: true });

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://openme:openme@localhost:5432/openme_dev";

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const demoPasswordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: {
      email: "demo@openme.local",
    },
    create: {
      email: "demo@openme.local",
      name: "Demo User",
      passwordHash: demoPasswordHash,
    },
    update: {
      name: "Demo User",
      passwordHash: demoPasswordHash,
    },
  });

  const profile = await prisma.profile.upsert({
    where: {
      username: "demo",
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
      isPublic: true,
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
      isPublic: true,
    },
  });

  await prisma.link.deleteMany({
    where: {
      profileId: profile.id,
    },
  });

  await prisma.endpoint.deleteMany({
    where: {
      profileId: profile.id,
    },
  });

  await prisma.link.createMany({
    data: [
      {
        profileId: profile.id,
        title: "GitHub",
        url: "https://github.com/openme-demo",
        position: 0,
      },
      {
        profileId: profile.id,
        title: "Portfolio",
        url: "https://example.com",
        position: 1,
      },
    ],
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
        position: 0,
      },
      {
        profileId: profile.id,
        slug: "collaborate",
        method: EndpointMethod.POST,
        title: "Collaborate",
        description: "Suggest a focused collaboration or project.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 1,
      },
      {
        profileId: profile.id,
        slug: "ask-me",
        method: EndpointMethod.POST,
        title: "Ask me",
        description: "Ask a thoughtful question.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 2,
      },
      {
        profileId: profile.id,
        slug: "feedback",
        method: EndpointMethod.POST,
        title: "Feedback",
        description: "Share constructive feedback.",
        visibility: EndpointVisibility.PUBLIC,
        status: EndpointStatus.PUBLISHED,
        position: 3,
      },
    ],
  });

  const endpoints = await prisma.endpoint.findMany({
    where: {
      profileId: profile.id,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const endpointBySlug = new Map(
    endpoints.map((endpoint) => [endpoint.slug, endpoint]),
  );

  function requireEndpoint(slug: string) {
    const endpoint = endpointBySlug.get(slug);

    if (!endpoint) {
      throw new Error(`Missing seeded endpoint: ${slug}`);
    }

    return endpoint;
  }

  const collaborateEndpoint = requireEndpoint("collaborate");
  const askMeEndpoint = requireEndpoint("ask-me");
  const feedbackEndpoint = requireEndpoint("feedback");

  await prisma.endpointField.createMany({
    data: [
      {
        endpointId: collaborateEndpoint.id,
        type: FieldType.LONG_TEXT,
        label: "What do you want to build?",
        placeholder: "Describe the project, problem, or collaboration idea.",
        required: true,
        position: 0,
      },
      {
        endpointId: collaborateEndpoint.id,
        type: FieldType.LONG_TEXT,
        label: "Why do you think I am relevant?",
        placeholder: "Share the context that made you reach out.",
        required: true,
        position: 1,
      },
      {
        endpointId: collaborateEndpoint.id,
        type: FieldType.SELECT,
        label: "Is this paid, open-source, experimental, or just an idea?",
        options: ["Paid", "Open-source", "Experimental", "Just an idea"],
        required: true,
        position: 2,
      },
      {
        endpointId: askMeEndpoint.id,
        type: FieldType.LONG_TEXT,
        label: "Your question",
        placeholder: "Ask a thoughtful question.",
        required: true,
        position: 0,
      },
      {
        endpointId: feedbackEndpoint.id,
        type: FieldType.LONG_TEXT,
        label: "Feedback",
        placeholder: "Share what worked, what did not, or what could improve.",
        required: true,
        position: 0,
      },
      {
        endpointId: feedbackEndpoint.id,
        type: FieldType.RATING,
        label: "Rating",
        required: false,
        position: 1,
      },
    ],
  });

  await prisma.endpointBoundary.createMany({
    data: endpoints.map((endpoint) => ({
      endpointId: endpoint.id,
      title: "Useful and respectful",
      description:
        endpoint.slug === "now"
          ? "Keep requests related to current work and interests."
          : "Send specific, respectful requests that are easy to understand.",
      priority: "MEDIUM",
    })),
  });

  console.log("Seeded demo public profile at /demo");
  console.log("Seeded local-only demo login: demo@openme.local / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
