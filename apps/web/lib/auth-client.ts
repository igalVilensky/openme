import { apiClient } from "./api-client";

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    isPublic: boolean;
  };
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  username: string;
  displayName: string;
};

export function getCurrentUser(): Promise<AuthSession> {
  return apiClient<AuthSession>("/auth/me", {
    cache: "no-store",
  });
}

export function login(input: LoginInput): Promise<AuthSession> {
  return apiClient<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return apiClient<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}
