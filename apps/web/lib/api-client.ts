export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

async function getApiErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;

    return (
      body.error?.message ??
      `OpenMe API request failed with status ${response.status}`
    );
  } catch {
    return `OpenMe API request failed with status ${response.status}`;
  }
}

export async function apiClient<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    credentials: init?.credentials ?? "include",
    headers,
  });

  if (!response.ok) {
    throw new ApiClientError(
      await getApiErrorMessage(response),
      response.status,
    );
  }

  return response.json() as Promise<TResponse>;
}
