ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'INVOICED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'PAYMENT_SUBMITTED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'PAYMENT_VERIFIED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'AUDIT_SCHEDULED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'SCHEDULE_CONFIRMED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'AUDIT_COMPLETED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'CORRECTIVE_ACTION_REQUIRED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'CORRECTIVE_ACTION_SUBMITTED';
ALTER TYPE "CertificationApplicationStatus" ADD VALUE 'CORRECTIVE_ACTION_VERIFIED';

ALTER TYPE "CertificationDocumentType" ADD VALUE 'PAYMENT_PROOF';
ALTER TYPE "CertificationDocumentType" ADD VALUE 'AUDIT_REPORT';
ALTER TYPE "CertificationDocumentType" ADD VALUE 'CORRECTIVE_ACTION_PROOF';

ALTER TABLE "certification_applications"
  ADD COLUMN "fee_details" JSONB,
  ADD COLUMN "proposed_evaluators" JSONB,
  ADD COLUMN "assigned_evaluators" JSONB,
  ADD COLUMN "payment_submitted_at" TIMESTAMPTZ(3),
  ADD COLUMN "payment_verified_at" TIMESTAMPTZ(3),
  ADD COLUMN "audit_schedule" JSONB,
  ADD COLUMN "schedule_confirmed_at" TIMESTAMPTZ(3),
  ADD COLUMN "audit_report" JSONB,
  ADD COLUMN "corrective_action_notes" TEXT,
  ADD COLUMN "corrective_action_verified_at" TIMESTAMPTZ(3);
