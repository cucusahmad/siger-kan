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
CREATE INDEX "consultation_attachments_consultation_id_created_at_idx" ON "consultation_attachments"("consultation_id", "created_at");

-- CreateIndex
CREATE INDEX "consultation_attachments_message_id_idx" ON "consultation_attachments"("message_id");

-- CreateIndex
CREATE INDEX "consultation_attachments_uploaded_by_id_idx" ON "consultation_attachments"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "quality_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "consultation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
