CREATE TABLE "past_certifications" (
    "id" BIGSERIAL NOT NULL,
    "business_id" BIGINT NOT NULL,
    "nama_produk" VARCHAR(200) NOT NULL,
    "nomor_sni" VARCHAR(100),
    "nomor_sppt_sni" VARCHAR(120),
    "nomor_skp" VARCHAR(160),
    "tanggal_terbit_sppt" DATE,
    "tanggal_berakhir_sppt" DATE,
    "status_sertifikasi" VARCHAR(50) NOT NULL,
    "keterangan" TEXT,
    "nama_dokumen" VARCHAR(255),
    "document_storage_key" VARCHAR(500),
    "document_mime_type" VARCHAR(100),
    "document_size" BIGINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "past_certifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "past_certifications_business_id_deleted_at_idx"
ON "past_certifications"("business_id", "deleted_at");

CREATE INDEX "past_certifications_business_id_status_sertifikasi_idx"
ON "past_certifications"("business_id", "status_sertifikasi");

CREATE INDEX "past_certifications_tanggal_berakhir_sppt_idx"
ON "past_certifications"("tanggal_berakhir_sppt");

ALTER TABLE "past_certifications"
ADD CONSTRAINT "past_certifications_business_id_fkey"
FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
