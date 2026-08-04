import bcrypt from "bcryptjs";
import { addMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  const value = Math.floor(Math.random() * max);
  return String(value).padStart(OTP_LENGTH, "0");
}

export async function createEmailOtp(email: string) {
  const normalized = normalizeEmail(email);
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = addMinutes(new Date(), OTP_TTL_MINUTES);

  await prisma.emailOtp.deleteMany({
    where: { email: normalized },
  });

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });

  await prisma.emailOtp.create({
    data: {
      email: normalized,
      codeHash,
      expiresAt,
      userId: user?.id,
    },
  });

  return { email: normalized, code, expiresAt };
}

export async function verifyEmailOtp(email: string, code: string) {
  const normalized = normalizeEmail(email);
  const otp = await prisma.emailOtp.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { ok: false as const, error: "No code found. Request a new one." };
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.delete({ where: { id: otp.id } });
    return { ok: false as const, error: "Code expired. Request a new one." };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { id: otp.id } });
    return {
      ok: false as const,
      error: "Too many attempts. Request a new code.",
    };
  }

  const matches = await bcrypt.compare(code.trim(), otp.codeHash);

  if (!matches) {
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, error: "Invalid code" };
  }

  await prisma.emailOtp.deleteMany({
    where: { email: normalized },
  });

  return { ok: true as const, email: normalized };
}

export async function findOrCreateOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = normalizeEmail(input.email);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (
      (input.name && !existing.name) ||
      (input.image && !existing.image)
    ) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name ?? input.name ?? null,
          image: existing.image ?? input.image ?? null,
        },
      });
    }

    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      name: input.name ?? null,
      image: input.image ?? null,
      password: null,
    },
  });
}

export async function findOrCreateOtpUser(email: string) {
  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email: normalized,
      password: null,
    },
  });
}
