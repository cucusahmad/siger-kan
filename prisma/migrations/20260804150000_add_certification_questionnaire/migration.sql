-- CreateTable
CREATE TABLE "kuisioner_sertifikasi" (
    "id" BIGSERIAL NOT NULL,
    "application_id" BIGINT NOT NULL,
    "applicant_information" JSONB NOT NULL,
    "product_information" JSONB NOT NULL,
    "production_information" JSONB NOT NULL,
    "business_legality" JSONB NOT NULL,
    "human_resources" JSONB NOT NULL,
    "certifications_and_products" JSONB NOT NULL,
    "marketing_channels" JSONB NOT NULL,
    "quality_system_answers" JSONB NOT NULL,
    "sni_evaluation" JSONB NOT NULL,
    "other_notes" VARCHAR(2000),
    "declaration_accepted" BOOLEAN NOT NULL DEFAULT false,
    "signatory_name" VARCHAR(160),
    "signatory_position" VARCHAR(160),
    "approval_date" DATE,
    "signature_storage_key" VARCHAR(500),
    "stamp_storage_key" VARCHAR(500),
    "electronic_signature_accepted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "kuisioner_sertifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kuisioner_sertifikasi_application_id_key" ON "kuisioner_sertifikasi"("application_id");

-- CreateIndex
CREATE INDEX "kuisioner_sertifikasi_submitted_at_deleted_at_idx" ON "kuisioner_sertifikasi"("submitted_at", "deleted_at");

-- AddForeignKey
ALTER TABLE "kuisioner_sertifikasi"
ADD CONSTRAINT "kuisioner_sertifikasi_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "certification_applications"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
