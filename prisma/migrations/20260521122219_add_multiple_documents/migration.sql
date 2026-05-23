/*
  Warnings:

  - You are about to drop the column `fileName` on the `Document` table. All the data in the column will be lost.
  - Made the column `fileType` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileName",
ADD COLUMN     "documentType" TEXT,
ALTER COLUMN "fileType" SET NOT NULL;
