-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentSlot_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSlot_appointmentId_key" ON "AppointmentSlot"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentSlot_doctorId_idx" ON "AppointmentSlot"("doctorId");

-- CreateIndex
CREATE INDEX "AppointmentSlot_dateTime_idx" ON "AppointmentSlot"("dateTime");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSlot_doctorId_dateTime_key" ON "AppointmentSlot"("doctorId", "dateTime");

-- CreateIndex
CREATE INDEX "LoginOtp_userId_code_used_expiresAt_idx" ON "LoginOtp"("userId", "code", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_senderId_createdAt_idx" ON "Message"("receiverId", "senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_isRead_idx" ON "Message"("senderId", "receiverId", "isRead");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_code_used_expiresAt_idx" ON "PasswordReset"("userId", "code", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_used_createdAt_idx" ON "PasswordReset"("userId", "used", "createdAt");
