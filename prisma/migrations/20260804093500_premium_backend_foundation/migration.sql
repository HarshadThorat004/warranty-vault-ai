-- Add periodKey so reminders can be scoped to an expiry cycle.
ALTER TABLE "NotificationLog"
ADD COLUMN "periodKey" TEXT NOT NULL DEFAULT 'legacy';

UPDATE "NotificationLog"
SET "periodKey" = COALESCE(
  TO_CHAR("Product"."warrantyExpiry", 'YYYY-MM-DD'),
  'none'
)
FROM "Product"
WHERE "Product"."id" = "NotificationLog"."productId";

ALTER TABLE "NotificationLog"
ALTER COLUMN "periodKey" DROP DEFAULT;

DROP INDEX IF EXISTS "NotificationLog_productId_type_channel_key";

CREATE INDEX IF NOT EXISTS "Product_userId_idx"
ON "Product"("userId");

CREATE INDEX IF NOT EXISTS "Product_warrantyExpiry_idx"
ON "Product"("warrantyExpiry");

CREATE INDEX IF NOT EXISTS "Product_userId_warrantyExpiry_idx"
ON "Product"("userId", "warrantyExpiry");

CREATE INDEX IF NOT EXISTS "Document_productId_idx"
ON "Document"("productId");

CREATE INDEX IF NOT EXISTS "NotificationLog_userId_channel_sentAt_idx"
ON "NotificationLog"("userId", "channel", "sentAt");

CREATE UNIQUE INDEX "NotificationLog_productId_type_channel_periodKey_key"
ON "NotificationLog"("productId", "type", "channel", "periodKey");
