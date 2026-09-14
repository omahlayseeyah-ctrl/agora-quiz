import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type SessionRole = "student" | "admin";

export interface SessionPayload {
  sub: string; // user id
  role: SessionRole;
  [key: string]: unknown;
}

const STUDENT_COOKIE = "agora_student_session";
const ADMIN_COOKIE = "agora_admin_session";

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET environment variable.");
  return new TextEncoder().encode(secret);
}

async function sign(payload: SessionPayload, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

async function verify(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createStudentSession(studentId: string) {
  const token = await sign({ sub: studentId, role: "student" }, "30d");
  cookies().set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function createAdminSession(adminId: string) {
  const token = await sign({ sub: adminId, role: "admin" }, "12h");
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getStudentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export function clearStudentSession() {
  cookies().delete(STUDENT_COOKIE);
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}
