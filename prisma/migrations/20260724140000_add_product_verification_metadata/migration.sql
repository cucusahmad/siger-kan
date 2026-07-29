ALTER TABLE "products"
    ADD COLUMN "submitted_at" TIMESTAMPTZ(3),
    ADD COLUMN "verified_by_id" BIGINT;

CREATE INDEX "products_verified_by_id_idx" ON "products"("verified_by_id");

ALTER TABLE "products"
    ADD CONSTRAINT "products_verified_by_id_fkey"
    FOREIGN KEY ("verified_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
