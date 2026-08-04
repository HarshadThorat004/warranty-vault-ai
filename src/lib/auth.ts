import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import {
  findOrCreateOAuthUser,
  findOrCreateOtpUser,
  normalizeEmail,
  verifyEmailOtp,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

function getJwtUserId(token: JWT) {
  return typeof token.id === "string" ? token.id : token.sub;
}

function buildProviders(): NextAuthOptions["providers"] {
  const providers: NextAuthOptions["providers"] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const email = normalizeEmail(credentials.email);
        const loginLimit = consumeRateLimit({
          key: `auth:credentials:${email}`,
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });

        if (!loginLimit.success) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    CredentialsProvider({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          throw new Error("Missing email or code");
        }

        const email = normalizeEmail(credentials.email);
        const otpLimit = consumeRateLimit({
          key: `auth:otp-verify:${email}`,
          limit: 20,
          windowMs: 15 * 60 * 1000,
        });

        if (!otpLimit.success) {
          throw new Error("Too many OTP attempts. Please try again later.");
        }

        const verified = await verifyEmailOtp(email, credentials.code);

        if (!verified.ok) {
          throw new Error(verified.error);
        }

        const user = await findOrCreateOtpUser(verified.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    })
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: buildProviders(),

  session: {
    strategy: "jwt",
  },

  // Keep OAuth cookies host-compatible on local HTTP.
  useSecureCookies: process.env.NODE_ENV === "production",

  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials" || account.provider === "email-otp") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      const dbUser = await findOrCreateOAuthUser({
        email: user.email,
        name: user.name,
        image: user.image,
      });

      user.id = dbUser.id;
      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        if (target.origin === baseUrl) {
          return url;
        }
      } catch {
        // fall through
      }

      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      } else if (token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizeEmail(token.email) },
          select: { id: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const userId = getJwtUserId(token);

        if (userId) {
          session.user.id = userId;
        }
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export function getEnabledOAuthProviders() {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  };
}
