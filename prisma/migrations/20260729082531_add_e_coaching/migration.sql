-- CreateEnum
CREATE TYPE "ConsultationCategory" AS ENUM ('CERTIFICATION', 'TEST_RESULT', 'QUALITY_CLINIC', 'BUSINESS_DEVELOPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');

-- CreateTable
CREATE TABLE "quality_consultations" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "requester_id" BIGINT NOT NULL,
    "consultant_id" BIGINT,
    "subject" VARCHAR(180) NOT NULL,
    "category" "ConsultationCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'WAITING',
    "answered_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "quality_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_messages" (
    "id" BIGSERIAL NOT NULL,
    "consultation_id" BIGINT NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_attachments" (
    "id" BIGSERIAL NOT NULL,
    "consultation_id" BIGINT NOT NULL,
    "message_id" BIGINT,
    "uploaded_by_id" BIGINT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "consultation_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quality_consultations_business_id_status_updated_at_idx" ON "quality_consultations"("business_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "quality_consultations_requester_id_updated_at_idx" ON "quality_consultations"("requester_id", "updated_at");

-- CreateIndex
CREATE INDEX "quality_consultations_consultant_id_status_updated_at_idx" ON "quality_consultations"("consultant_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "quality_consultations_status_created_at_idx" ON "quality_consultations"("status", "created_at");

-- CreateIndex
CREATE INDEX "consultation_messages_consultation_id_created_at_idx" ON "consultation_messages"("consultation_id", "created_at");

-- CreateIndex
CREATE INDEX "consultation_messages_sender_id_created_at_idx" ON "consultation_messages"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "consultation_attachments_consultation_id_created_at_idx" ON "consultation_attachments"("consultation_id", "created_at");
CREATE INDEX "consultation_attachments_message_id_idx" ON "consultation_attachments"("message_id");
CREATE INDEX "consultation_attachments_uploaded_by_id_idx" ON "consultation_attachments"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "quality_consultations" ADD CONSTRAINT "quality_consultations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_consultations" ADD CONSTRAINT "quality_consultations_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_consultations" ADD CONSTRAINT "quality_consultations_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "quality_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "quality_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "consultation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
