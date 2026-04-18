import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/secret-crypto";
import { verifyTwoFactorCode } from "@/lib/two-factor";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        const totpCode = String(credentials?.totpCode ?? "").trim();

        if (!email || !password) {
          throw new Error("Email және құпия сөз міндетті");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("Email немесе құпия сөз қате");
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          throw new Error("Email немесе құпия сөз қате");
        }

        if (!user.isVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.twoFactorEnabled) {
          const secret = decryptSecret(user.twoFactorSecret);
          if (!secret) {
            throw new Error("TWO_FACTOR_NOT_CONFIGURED");
          }

          if (!(await verifyTwoFactorCode(secret, totpCode))) {
            throw new Error("TWO_FACTOR_INVALID");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "PATIENT";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
