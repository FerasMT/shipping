-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartialShipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiverName" TEXT,
    "receiverPhone" TEXT,
    "receiverAddress" TEXT,
    "length" REAL NOT NULL DEFAULT 0.0,
    "width" REAL NOT NULL DEFAULT 0.0,
    "height" REAL NOT NULL DEFAULT 0.0,
    "weight" REAL NOT NULL DEFAULT 0.0,
    "volume" REAL NOT NULL DEFAULT 0.0,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "amountPaid" REAL NOT NULL DEFAULT 0.0,
    "paymentStatus" TEXT,
    "shipmentId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "PartialShipment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartialShipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PartialShipment" ("amountPaid", "cost", "customerId", "height", "id", "length", "paymentStatus", "receiverAddress", "receiverName", "receiverPhone", "shipmentId", "weight", "width") SELECT "amountPaid", "cost", "customerId", "height", "id", "length", "paymentStatus", "receiverAddress", "receiverName", "receiverPhone", "shipmentId", "weight", "width" FROM "PartialShipment";
DROP TABLE "PartialShipment";
ALTER TABLE "new_PartialShipment" RENAME TO "PartialShipment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
