export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function createError(response: Response) {
  if (response.headers.get("Content-Type")?.startsWith("application/json")) {
    try {
      const { error } = await response.json();
      return new ApiError(error, response.status);
    } catch {
      console.warn("unable to decode json response of error");
    }
  }

  return new ApiError(response.statusText, response.status);
}

export type ApiClient = {
  request<T>(endpoint: string, init?: RequestInit): Promise<T>;
  submit<T>(endpoint: string, data?: unknown, init?: RequestInit): Promise<T>;
};

export default function createApiClient(
  origin: string,
  token: string
): ApiClient {
  async function request<T>(endpoint: string, init: RequestInit = {}) {
    const url = new URL(endpoint, `${origin}/metadata/api/`);
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Token ${token}`,
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw await createError(response);
    }

    const json = await response.json();
    return json as T;
  }

  async function submit<T>(
    endpoint: string,
    data: unknown,
    init: RequestInit = {}
  ) {
    return request<T>(endpoint, {
      method: "POST",
      body: data === undefined ? data : JSON.stringify(data),
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  }

  return { request, submit };
}
