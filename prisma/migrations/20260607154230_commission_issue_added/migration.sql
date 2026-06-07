-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'commission_issue_reported';

-- AlterTable
ALTER TABLE "appointment_transfers" ALTER COLUMN "transferFeePercentage" SET DEFAULT 70.0;
