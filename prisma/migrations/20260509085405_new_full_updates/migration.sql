-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'appointment_transfer_request';
ALTER TYPE "NotificationType" ADD VALUE 'appointment_transfer_accepted';
ALTER TYPE "NotificationType" ADD VALUE 'appointment_transfer_rejected';

-- CreateTable
CREATE TABLE "appointment_transfers" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "originalWorkerId" TEXT NOT NULL,
    "newWorkerId" TEXT NOT NULL,
    "transferReason" TEXT,
    "transferFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "transferFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "TransferStatus" NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "appointment_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_transfers_appointmentId_key" ON "appointment_transfers"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_transfers_appointmentId_idx" ON "appointment_transfers"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_transfers_originalWorkerId_idx" ON "appointment_transfers"("originalWorkerId");

-- CreateIndex
CREATE INDEX "appointment_transfers_newWorkerId_idx" ON "appointment_transfers"("newWorkerId");

-- CreateIndex
CREATE INDEX "appointment_transfers_status_idx" ON "appointment_transfers"("status");

-- AddForeignKey
ALTER TABLE "appointment_transfers" ADD CONSTRAINT "appointment_transfers_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_transfers" ADD CONSTRAINT "appointment_transfers_originalWorkerId_fkey" FOREIGN KEY ("originalWorkerId") REFERENCES "worker_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_transfers" ADD CONSTRAINT "appointment_transfers_newWorkerId_fkey" FOREIGN KEY ("newWorkerId") REFERENCES "worker_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
