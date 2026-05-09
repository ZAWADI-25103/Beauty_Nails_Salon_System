-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "packageId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_packageId_idx" ON "appointments"("packageId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
