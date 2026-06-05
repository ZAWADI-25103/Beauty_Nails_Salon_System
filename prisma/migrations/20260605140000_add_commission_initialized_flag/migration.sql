-- AlterTable
ALTER TABLE "commissions"
ADD COLUMN "commissionInitializedAtAppointmentCompletion" BOOLEAN NOT NULL DEFAULT false;
