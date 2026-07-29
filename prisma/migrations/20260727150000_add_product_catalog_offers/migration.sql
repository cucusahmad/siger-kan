CREATE TABLE "product_offers" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "buyer_business_id" BIGINT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "delivery_address" VARCHAR(500) NOT NULL,
    "valid_until" DATE NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BusinessOfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(3),
    "response_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "product_offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_offers_product_id_buyer_business_id_key"
ON "product_offers"("product_id", "buyer_business_id");

CREATE INDEX "product_offers_buyer_business_id_status_deleted_at_idx"
ON "product_offers"("buyer_business_id", "status", "deleted_at");

CREATE INDEX "product_offers_product_id_status_deleted_at_idx"
ON "product_offers"("product_id", "status", "deleted_at");

ALTER TABLE "product_offers"
ADD CONSTRAINT "product_offers_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_offers"
ADD CONSTRAINT "product_offers_buyer_business_id_fkey"
FOREIGN KEY ("buyer_business_id") REFERENCES "businesses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
