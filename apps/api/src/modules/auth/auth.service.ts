import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../errors/http-error";
import type { AuthSessionSummary } from "./auth.types";

const PASSWORD_HASH_ROUNDS = 12;
const AUTH_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

type UserWithProfile = {
  id: string;
  email: string;
  name: string | null;
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    isPublic: boolean;
  } | null;
};

function toAuthSummary(user: UserWithProfile): AuthSessionSummary {
  if (!user.profile) {
    throw new HttpError(409, "User profile not found");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    profile: user.profile,
  };
}

function isJwtPayload(value: string | JwtPayload): value is JwtPayload {
  return typeof value !== "string";
}

export function signAuthToken(userId: string): string {
  return jwt.sign({}, env.jwtSecret, {
    expiresIn: AUTH_TOKEN_EXPIRES_IN_SECONDS,
    subject: userId,
  });
}

export function verifyAuthToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (!isJwtPayload(decoded) || typeof decoded.sub !== "string") {
      return null;
    }

    return decoded.sub;
  } catch {
    return null;
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}): Promise<AuthSessionSummary> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered");
  }

  const existingProfile = await prisma.profile.findUnique({
    where: {
      username: input.username,
    },
    select: {
      id: true,
    },
  });

  if (existingProfile) {
    throw new HttpError(409, "Username is already taken");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        email: input.email,
        name: input.displayName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const profile = await transaction.profile.create({
      data: {
        userId: createdUser.id,
        username: input.username,
        displayName: input.displayName,
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        isPublic: true,
      },
    });

    return {
      ...createdUser,
      profile,
    };
  });

  return toAuthSummary(user);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSessionSummary> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      profile: {
        select: {
          id: true,
          username: true,
          displayName: true,
          isPublic: true,
        },
      },
    },
  });

  const passwordMatches =
    user?.passwordHash &&
    (await bcrypt.compare(input.password, user.passwordHash));

  if (!user || !passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  return toAuthSummary(user);
}

export async function getAuthSessionByUserId(
  userId: string,
): Promise<AuthSessionSummary | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      profile: {
        select: {
          id: true,
          username: true,
          displayName: true,
          isPublic: true,
        },
      },
    },
  });

  return user ? toAuthSummary(user) : null;
}
