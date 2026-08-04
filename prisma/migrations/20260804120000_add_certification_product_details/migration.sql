ALTER TYPE "CertificationDocumentType" ADD VALUE IF NOT EXISTS 'APPLICANT_IDENTITY';
ALTER TYPE "CertificationDocumentType" ADD VALUE IF NOT EXISTS 'APPLICANT_TAX_ID';
ALTER TYPE "CertificationDocumentType" ADD VALUE IF NOT EXISTS 'BUSINESS_LEGALITY';
ALTER TYPE "CertificationDocumentType" ADD VALUE IF NOT EXISTS 'QUALITY_GUIDE';
ALTER TYPE "CertificationDocumentType" ADD VALUE IF NOT EXISTS 'BUSINESS_CERTIFICATES';
ALTER TYPE "CertificationDocumentType" ADD VALUE IF NOT EXISTS 'SNI_MARK_ILLUSTRATION';

CREATE TABLE "rujukan_sni" (
  "id" BIGSERIAL PRIMARY KEY,
  "judul_standar" VARCHAR(200) NOT NULL,
  "nomor_sni" VARCHAR(80) NOT NULL UNIQUE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(3)
);

CREATE TABLE "certification_application_sni" (
  "id" BIGSERIAL PRIMARY KEY,
  "application_id" BIGINT NOT NULL,
  "rujukan_sni_id" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "certification_application_sni_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "certification_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "certification_application_sni_rujukan_sni_id_fkey" FOREIGN KEY ("rujukan_sni_id") REFERENCES "rujukan_sni"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "certification_application_sni_application_id_rujukan_sni_id_key" UNIQUE ("application_id", "rujukan_sni_id")
);

CREATE INDEX "rujukan_sni_judul_standar_idx" ON "rujukan_sni"("judul_standar");
CREATE INDEX "rujukan_sni_is_active_deleted_at_idx" ON "rujukan_sni"("is_active", "deleted_at");
CREATE INDEX "certification_application_sni_rujukan_sni_id_idx" ON "certification_application_sni"("rujukan_sni_id");

INSERT INTO "rujukan_sni" ("judul_standar", "nomor_sni") VALUES
  ('Abon Ikan, Krustasea dan Moluska', 'SNI 7690:2019'),
  ('Kerupuk Ikan, Udang dan Moluska', 'SNI 8272:2016'),
  ('Pempek', 'SNI 7661:2019'),
  ('Bandeng Duri Lunak', 'SNI 4106:2017'),
  ('Bandeng Cabut Duri', 'SNI 7316:2009'),
  ('Bakso Ikan', 'SNI 7266:2017'),
  ('Kerupuk Ikan, Udang dan Moluska Siap Makan', 'SNI 8646:2018'),
  ('Daging Rajungan Rebus Dingin', 'SNI 4224:2015'),
  ('Fillet Patin Beku', 'SNI 8606:2020'),
  ('Ikan Asap', 'SNI 2725:2013'),
  ('Ikan Renyah', 'SNI 7760:2013'),
  ('Keripik Kulit Ikan Goreng', 'SNI 9013:2021')
ON CONFLICT ("nomor_sni") DO NOTHING;
