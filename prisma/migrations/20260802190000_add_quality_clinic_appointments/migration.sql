-- CreateEnum
CREATE TYPE "QualityClinicAppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "quality_clinic_appointments" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "requester_id" BIGINT NOT NULL,
    "consultant_id" BIGINT,
    "topic" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "preferred_at" TIMESTAMPTZ(3) NOT NULL,
    "scheduled_at" TIMESTAMPTZ(3),
    "location" VARCHAR(300),
    "consultant_note" TEXT,
    "status" "QualityClinicAppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "quality_clinic_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quality_clinic_appointments_business_id_status_preferred_at_idx" ON "quality_clinic_appointments"("business_id", "status", "preferred_at");

-- CreateIndex
CREATE INDEX "quality_clinic_appointments_requester_id_created_at_idx" ON "quality_clinic_appointments"("requester_id", "created_at");

-- CreateIndex
CREATE INDEX "quality_clinic_appointments_consultant_id_status_scheduled_at_idx" ON "quality_clinic_appointments"("consultant_id", "status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "quality_clinic_appointments" ADD CONSTRAINT "quality_clinic_appointments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_clinic_appointments" ADD CONSTRAINT "quality_clinic_appointments_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_clinic_appointments" ADD CONSTRAINT "quality_clinic_appointments_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
