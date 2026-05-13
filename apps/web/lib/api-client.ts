export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiClient<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    headers
  });

  if (!response.ok) {
    throw new ApiClientError(
      `OpenMe API request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json() as Promise<TResponse>;
}
