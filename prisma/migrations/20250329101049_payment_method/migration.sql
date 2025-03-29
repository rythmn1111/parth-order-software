-- CreateTable
CREATE TABLE "CustomerRole" (
    "id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRole_role_name_key" ON "CustomerRole"("role_name");
