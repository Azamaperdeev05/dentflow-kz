import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { logSecurityEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/secret-crypto";
import { deriveDeviceFingerprint, updateLoginRiskSignal } from "@/lib/security-risk";
import { verifyTwoFactorCode } from "@/lib/two-factor";

function extractRequestMeta(request?: Request) {
  const ipAddress = request?.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request?.headers.get("x-real-ip") ?? "unknown";
  const userAgent = request?.headers.get("user-agent") ?? "unknown";
  const deviceFingerprint = deriveDeviceFingerprint(userAgent);

  return {
    ipAddress,
    userAgent,
    deviceFingerprint,
  };
}

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
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        const totpCode = String(credentials?.totpCode ?? "").trim();
        const meta = extractRequestMeta(request);

        if (!email || !password) {
          await logSecurityEvent({
            eventType: "AUTH",
            action: "LOGIN_FAILED",
            resource: "SESSION",
            status: "FAILED",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            deviceFingerprint: meta.deviceFingerprint,
            metadata: { reason: "MISSING_CREDENTIALS", email },
          });
          throw new Error("Email және құпия сөз міндетті");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          const risk = await updateLoginRiskSignal({
            email,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            isSuccess: false,
          });

          await logSecurityEvent({
            eventType: "AUTH",
            action: "LOGIN_FAILED",
            resource: "SESSION",
            status: "FAILED",
            riskScore: risk.riskScore,
            isSuspicious: risk.isSuspicious,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            deviceFingerprint: meta.deviceFingerprint,
            metadata: { reason: "USER_NOT_FOUND", email, failedAttempts: risk.failedAttempts },
          });
          throw new Error("Email немесе құпия сөз қате");
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          const risk = await updateLoginRiskSignal({
            userId: user.id,
            email,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            isSuccess: false,
          });

          await logSecurityEvent({
            userId: user.id,
            userRole: user.role,
            eventType: "AUTH",
            action: "LOGIN_FAILED",
            resource: "SESSION",
            status: "FAILED",
            riskScore: risk.riskScore,
            isSuspicious: risk.isSuspicious,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            deviceFingerprint: meta.deviceFingerprint,
            metadata: { reason: "INVALID_PASSWORD", failedAttempts: risk.failedAttempts },
          });
          throw new Error("Email немесе құпия сөз қате");
        }

        if (!user.isVerified) {
          await logSecurityEvent({
            userId: user.id,
            userRole: user.role,
            eventType: "AUTH",
            action: "LOGIN_FAILED",
            resource: "SESSION",
            status: "FAILED",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            deviceFingerprint: meta.deviceFingerprint,
            metadata: { reason: "EMAIL_NOT_VERIFIED" },
          });
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.twoFactorEnabled) {
          const secret = decryptSecret(user.twoFactorSecret);
          if (!secret) {
            await logSecurityEvent({
              userId: user.id,
              userRole: user.role,
              eventType: "AUTH",
              action: "LOGIN_FAILED",
              resource: "SESSION",
              status: "FAILED",
              ipAddress: meta.ipAddress,
              userAgent: meta.userAgent,
              deviceFingerprint: meta.deviceFingerprint,
              metadata: { reason: "TWO_FACTOR_NOT_CONFIGURED" },
            });
            throw new Error("TWO_FACTOR_NOT_CONFIGURED");
          }

          if (!(await verifyTwoFactorCode(secret, totpCode))) {
            const risk = await updateLoginRiskSignal({
              userId: user.id,
              email,
              ipAddress: meta.ipAddress,
              userAgent: meta.userAgent,
              isSuccess: false,
            });

            await logSecurityEvent({
              userId: user.id,
              userRole: user.role,
              eventType: "AUTH",
              action: "LOGIN_FAILED",
              resource: "SESSION",
              status: "FAILED",
              riskScore: risk.riskScore,
              isSuspicious: risk.isSuspicious,
              ipAddress: meta.ipAddress,
              userAgent: meta.userAgent,
              deviceFingerprint: meta.deviceFingerprint,
              metadata: { reason: "TWO_FACTOR_INVALID", failedAttempts: risk.failedAttempts },
            });
            throw new Error("TWO_FACTOR_INVALID");
          }
        }

        const risk = await updateLoginRiskSignal({
          userId: user.id,
          email,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          isSuccess: true,
        });

        await logSecurityEvent({
          userId: user.id,
          userRole: user.role,
          eventType: "AUTH",
          action: "LOGIN_SUCCESS",
          resource: "SESSION",
          status: "SUCCESS",
          riskScore: risk.riskScore,
          isSuspicious: risk.isSuspicious,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          deviceFingerprint: meta.deviceFingerprint,
          metadata: { failedAttemptsBeforeSuccess: risk.failedAttempts },
        });

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
  events: {
    async signOut(message) {
      const tokenRole = "token" in message ? (message.token?.role as string | undefined) : undefined;
      const tokenUserId = "token" in message ? message.token?.sub : undefined;

      await logSecurityEvent({
        userId: tokenUserId,
        userRole: tokenRole,
        eventType: "AUTH",
        action: "LOGOUT",
        resource: "SESSION",
        status: "SUCCESS",
      });
    },
  },
});
