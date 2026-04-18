/*
  Warnings:

  - You are about to drop the column `specialization` on the `DoctorProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DoctorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specializations" TEXT NOT NULL DEFAULT '[]',
    "experience" INTEGER NOT NULL DEFAULT 0,
    "licenseNumber" TEXT,
    "education" TEXT,
    "about" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "workDays" TEXT NOT NULL DEFAULT '[]',
    "workHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DoctorProfile" ("about", "education", "experience", "id", "isAvailable", "licenseNumber", "rating", "reviewCount", "slotDuration", "userId", "workDays", "workHoursEnd", "workHoursStart") SELECT "about", "education", "experience", "id", "isAvailable", "licenseNumber", "rating", "reviewCount", "slotDuration", "userId", "workDays", "workHoursEnd", "workHoursStart" FROM "DoctorProfile";
DROP TABLE "DoctorProfile";
ALTER TABLE "new_DoctorProfile" RENAME TO "DoctorProfile";
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
