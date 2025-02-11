/*
  Warnings:

  - You are about to drop the column `height` on the `PartialShipment` table. All the data in the column will be lost.
  - You are about to drop the column `length` on the `PartialShipment` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `PartialShipment` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `PartialShipment` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "PackageDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "length" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "partialShipmentId" INTEGER NOT NULL,
    CONSTRAINT "PackageDetail_partialShipmentId_fkey" FOREIGN KEY ("partialShipmentId") REFERENCES "PartialShipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartialShipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiverName" TEXT,
    "receiverPhone" TEXT,
    "receiverAddress" TEXT,
    "volume" REAL NOT NULL DEFAULT 0.0,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "amountPaid" REAL NOT NULL DEFAULT 0.0,
    "paymentStatus" TEXT,
    "paymentResponsibility" TEXT,
    "shipmentId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "PartialShipment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartialShipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PartialShipment" ("amountPaid", "cost", "customerId", "id", "paymentResponsibility", "paymentStatus", "receiverAddress", "receiverName", "receiverPhone", "shipmentId", "volume") SELECT "amountPaid", "cost", "customerId", "id", "paymentResponsibility", "paymentStatus", "receiverAddress", "receiverName", "receiverPhone", "shipmentId", "volume" FROM "PartialShipment";
DROP TABLE "PartialShipment";
ALTER TABLE "new_PartialShipment" RENAME TO "PartialShipment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
