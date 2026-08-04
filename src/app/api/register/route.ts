import bcrypt from "bcryptjs";

import { getRequestIp, jsonError, jsonSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const requestIp = getRequestIp(req);
    const body = await req.json();
    const validatedFields = registerSchema.safeParse(body);

    if (!validatedFields.success) {
      return jsonError("Invalid fields", 400, {
        details: validatedFields.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = validatedFields.data;
    const normalizedEmail = email.trim().toLowerCase();
    const rateLimit = consumeRateLimit({
      key: `register:${requestIp}:${normalizedEmail}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return jsonError("Too many registration attempts. Please try again later.", 429);
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return jsonError("User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return jsonSuccess({ success: true }, 201);
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return jsonError("Something went wrong");
  }
}