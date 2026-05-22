const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("API path must start with '/'.");
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

