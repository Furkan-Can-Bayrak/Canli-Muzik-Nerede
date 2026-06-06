import { getApiBaseUrl } from "@/lib/api";

/** Origin for Socket.IO (same host as REST). */
export function getSocketOrigin(): string {
  try {
    return getApiBaseUrl();
  } catch {
    return "";
  }
}
