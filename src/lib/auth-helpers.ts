import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
};

export async function getCurrentUser(): Promise<AuthUser | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return undefined;

  const payload = await verifyToken(token);
  return payload ?? undefined;
}

export function isAdmin(role?: string) {
  return role === "ADMIN";
}
