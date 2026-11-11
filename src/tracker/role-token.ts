export const ROLE_TOKEN_KEY = "marsa-role";

export function readRoleToken() {
  if (typeof window === "undefined") return undefined;
  return window.sessionStorage.getItem(ROLE_TOKEN_KEY) ?? undefined;
}
