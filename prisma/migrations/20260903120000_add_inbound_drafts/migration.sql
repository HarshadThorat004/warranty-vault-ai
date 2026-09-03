-- AlterTable
ALTER TABLE "User" ADD COLUMN "inboundSlug" TEXT;

CREATE UNIQUE INDEX "User_inboundSlug_key" ON "User"("inboundSlug");

-- CreateTable
CREATE TABLE "InboundDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fromEmail" TEXT,
    "subject" TEXT,
    "resendEmailId" TEXT,
    "extracted" JSONB,
    "files" JSONB,
    "acceptedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InboundDraft_resendEmailId_key" ON "InboundDraft"("resendEmailId");
CREATE INDEX "InboundDraft_userId_status_idx" ON "InboundDraft"("userId", "status");
CREATE INDEX "InboundDraft_householdId_status_idx" ON "InboundDraft"("householdId", "status");

ALTER TABLE "InboundDraft" ADD CONSTRAINT "InboundDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InboundDraft" ADD CONSTRAINT "InboundDraft_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;
