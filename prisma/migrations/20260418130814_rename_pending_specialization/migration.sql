/*
  Warnings:

  - You are about to drop the column `specialization` on the `PendingRegistration` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PendingRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specializations" TEXT,
    "experience" INTEGER,
    "licenseNumber" TEXT,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PendingRegistration" ("codeHash", "createdAt", "email", "experience", "expiresAt", "id", "licenseNumber", "name", "passwordHash", "phone", "role", "updatedAt") SELECT "codeHash", "createdAt", "email", "experience", "expiresAt", "id", "licenseNumber", "name", "passwordHash", "phone", "role", "updatedAt" FROM "PendingRegistration";
DROP TABLE "PendingRegistration";
ALTER TABLE "new_PendingRegistration" RENAME TO "PendingRegistration";
CREATE UNIQUE INDEX "PendingRegistration_email_key" ON "PendingRegistration"("email");
CREATE INDEX "PendingRegistration_expiresAt_idx" ON "PendingRegistration"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
