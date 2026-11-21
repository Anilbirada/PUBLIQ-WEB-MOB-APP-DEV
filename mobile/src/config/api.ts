import { Platform } from "react-native";

// Production Render Cloud Gateway for real physical Android devices
export const PRODUCTION_API_BASE = "https://publiq-backend-5oyh.onrender.com/api/v1";

export const DEFAULT_API_BASE = PRODUCTION_API_BASE;

let activeApiBase = PRODUCTION_API_BASE;

export function setCustomApiBase(url: string) {
  if (url && url.trim()) {
    activeApiBase = url.trim().replace(/\/$/, "");
  }
}

export function getApiBase(): string {
  return activeApiBase;
}

export async function mobileApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const base = getApiBase();
  const url = `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      let detail = `Error ${res.status}: Failed request`;
      try {
        const body = await res.json();
        detail = body.detail || body.message || detail;
      } catch (_) {}
      throw new Error(detail);
    }

    return await res.json();
  } catch (err: any) {
    // If local fails, attempt cloud fallback if on physical device
    if (activeApiBase !== PRODUCTION_API_BASE && err.message.includes("Network request failed")) {
      console.warn("Local API unreachable, attempting cloud fallback...");
      const fallbackUrl = `${PRODUCTION_API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
      const fallbackRes = await fetch(fallbackUrl, { ...options, headers });
      if (fallbackRes.ok) {
        activeApiBase = PRODUCTION_API_BASE;
        return await fallbackRes.json();
      }
    }
    throw err;
  }
}
