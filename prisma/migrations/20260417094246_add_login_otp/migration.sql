-- CreateTable
CREATE TABLE "LoginOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LoginOtp_userId_idx" ON "LoginOtp"("userId");

-- CreateIndex
CREATE INDEX "LoginOtp_expiresAt_idx" ON "LoginOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginOtp_used_idx" ON "LoginOtp"("used");
