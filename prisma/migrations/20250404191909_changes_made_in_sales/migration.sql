/*
  Warnings:

  - Added the required column `sales_made_by` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "sales_made_by" TEXT NOT NULL;
