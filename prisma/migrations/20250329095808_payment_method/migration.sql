/*
  Warnings:

  - Added the required column `payment_method` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "payment_method" TEXT NOT NULL;
