/*
  Warnings:

  - Added the required column `accountType` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "accountType" "AccountType" NOT NULL;
