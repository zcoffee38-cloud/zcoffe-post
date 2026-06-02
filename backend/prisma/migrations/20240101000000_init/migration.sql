-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'kasir', 'owner');
CREATE TYPE "QueueStatus" AS ENUM ('waiting', 'processing', 'done');
CREATE TYPE "StockLogType" AS ENUM ('in', 'out', 'adjustment');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'qris', 'transfer');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'kasir',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "price" INTEGER NOT NULL,
    "hpp" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "total_profit" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "cash_amount" INTEGER,
    "change_amount" INTEGER,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "transactions_invoice_number_key" ON "transactions"("invoice_number");

CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "hpp" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "queues" (
    "id" TEXT NOT NULL,
    "queue_number" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'waiting',
    "transaction_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "queues_transaction_id_key" ON "queues"("transaction_id");

CREATE TABLE "stock_logs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "StockLogType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "queues" ADD CONSTRAINT "queues_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
