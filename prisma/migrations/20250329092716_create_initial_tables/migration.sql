-- CreateTable
CREATE TABLE "Sales" (
    "id" TEXT NOT NULL,
    "company_name" TEXT,
    "individual_name" TEXT NOT NULL,
    "gst_number" TEXT,
    "phone_number" TEXT NOT NULL,
    "items_purchased" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInfo" (
    "id" TEXT NOT NULL,
    "company_name" TEXT,
    "individual_name" TEXT NOT NULL,
    "gst_number" TEXT,
    "phone_number" TEXT NOT NULL,
    "total_credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesStaffInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "adhaar_card_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesStaffInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" TEXT NOT NULL,
    "name_of_product" TEXT NOT NULL,
    "credit_per_role" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sales_phone_number_key" ON "Sales"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInfo_phone_number_key" ON "CustomerInfo"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "SalesStaffInfo_phone_number_key" ON "SalesStaffInfo"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "SalesStaffInfo_adhaar_card_number_key" ON "SalesStaffInfo"("adhaar_card_number");

-- CreateIndex
CREATE UNIQUE INDEX "Products_name_of_product_key" ON "Products"("name_of_product");
