/*
  Warnings:

  - You are about to drop the column `type` on the `financial_accounts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,code]` on the table `financial_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `level` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `financial_accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "financial_accounts" DROP COLUMN "type",
ADD COLUMN     "canReceiveMovement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "parentId" TEXT,
ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_userId_code_key" ON "financial_accounts"("userId", "code");

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
