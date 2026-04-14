import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { config } from "../config";

const REFRESH_DAYS = 7;

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.isActive) throw { status: 401, message: "Invalid credentials" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw { status: 401, message: "Invalid credentials" };

  const payload = { sub: user.id, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

  await prisma.refreshToken.create({
    data: { id: uuidv4(), userId: user.id, token: refreshToken, expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role, language: user.language },
  };
}

export async function refresh(token: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw { status: 401, message: "Invalid refresh token" };
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw { status: 401, message: "Refresh token expired" };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw { status: 401, message: "User not found" };

  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  return { accessToken };
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function createUser(data: {
  name: string;
  phone: string;
  password: string;
  role: "ADMIN" | "STAFF";
}) {
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw { status: 409, message: "Phone number already registered" };

  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: { name: data.name, phone: data.phone, passwordHash, role: data.role },
    select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true, language: true },
  });
}

export async function updateUser(id: string, data: Partial<{ name: string; isActive: boolean; role: "ADMIN" | "STAFF"; password: string }>) {
  const update: Record<string, unknown> = {};
  if (data.name) update.name = data.name;
  if (typeof data.isActive === "boolean") update.isActive = data.isActive;
  if (data.role) update.role = data.role;
  if (data.password) update.passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.update({
    where: { id },
    data: update,
    select: { id: true, name: true, phone: true, role: true, isActive: true },
  });
}

export async function deleteUser(id: string) {
  await prisma.refreshToken.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}
