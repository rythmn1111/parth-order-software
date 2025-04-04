/*
  Warnings:

  - Added the required column `credit_worth` to the `CustomerRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerRole" ADD COLUMN     "credit_worth" DOUBLE PRECISION NOT NULL;
