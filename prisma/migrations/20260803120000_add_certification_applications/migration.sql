CREATE TYPE "CertificationApplicationType" AS ENUM ('INITIAL', 'RECERTIFICATION', 'SCOPE_EXTENSION');
CREATE TYPE "CertificationApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISION_REQUIRED', 'RESUBMITTED', 'VERIFIED');
CREATE TYPE "CertificationDocumentType" AS ENUM ('APPLICATION_LETTER', 'BUSINESS_LICENSE', 'PRODUCT_SPECIFICATION', 'QUALITY_DOCUMENT', 'PRODUCTION_PROCESS', 'OTHER');

CREATE TABLE "certification_applications" (
  "id" BIGSERIAL PRIMARY KEY,
  "application_number" VARCHAR(60) UNIQUE,
  "business_id" BIGINT NOT NULL,
  "applicant_user_id" BIGINT NOT NULL,
  "type" "CertificationApplicationType" NOT NULL,
  "status" "CertificationApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "applicant_snapshot" JSONB NOT NULL,
  "contact_person" JSONB,
  "certificate_recipient" JSONB,
  "product_information" JSONB,
  "manufacturing_information" JSONB,
  "requirements_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "license_agreement_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "submitted_at" TIMESTAMPTZ(3),
  "reviewed_by_id" BIGINT,
  "reviewed_at" TIMESTAMPTZ(3),
  "review_notes" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "certification_applications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "certification_applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "certification_applications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "certification_application_documents" (
  "id" BIGSERIAL PRIMARY KEY,
  "application_id" BIGINT NOT NULL,
  "document_type" "CertificationDocumentType" NOT NULL,
  "document_name" VARCHAR(200) NOT NULL,
  "original_file_name" VARCHAR(255) NOT NULL,
  "storage_key" VARCHAR(500) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "file_size" BIGINT NOT NULL,
  "uploaded_by_id" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "certification_application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "certification_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "certification_application_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "certification_application_histories" (
  "id" BIGSERIAL PRIMARY KEY,
  "application_id" BIGINT NOT NULL,
  "status" "CertificationApplicationStatus" NOT NULL,
  "notes" TEXT,
  "actor_user_id" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "certification_application_histories_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "certification_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "certification_application_histories_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "certification_applications_business_id_status_deleted_at_idx" ON "certification_applications"("business_id", "status", "deleted_at");
CREATE INDEX "certification_applications_applicant_user_id_created_at_idx" ON "certification_applications"("applicant_user_id", "created_at");
CREATE INDEX "certification_applications_reviewed_by_id_status_idx" ON "certification_applications"("reviewed_by_id", "status");
CREATE INDEX "certification_application_documents_application_id_deleted_at_idx" ON "certification_application_documents"("application_id", "deleted_at");
CREATE INDEX "certification_application_documents_uploaded_by_id_idx" ON "certification_application_documents"("uploaded_by_id");
CREATE INDEX "certification_application_histories_application_id_created_at_idx" ON "certification_application_histories"("application_id", "created_at");
CREATE INDEX "certification_application_histories_actor_user_id_idx" ON "certification_application_histories"("actor_user_id");
