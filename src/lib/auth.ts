import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-dev-secret"
);
const TOKEN_EXPIRY = "24h";

// ──── JWT utilities ────
export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "MEMBER";
    };
  } catch {
    return null;
  }
}

// ──── Credentials verification ────
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return null;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "ADMIN" | "MEMBER",
  };
}
