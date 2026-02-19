import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/** Usuário retornado por getCurrentUser (inclui isActive do schema). */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  approvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const SESSION_COOKIE_NAME = "jacare_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user as CurrentUser;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function isAdminRole(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function userRoleLabel(role: UserRole) {
  return isAdminRole(role) ? "admin" : "cliente";
}
