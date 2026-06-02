export type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user as
    | { id: string; name: string; email: string; role: "ADMIN" | "MEMBER" }
    | undefined;
}

export function isAdmin(role?: string) {
  return role === "ADMIN";
}
