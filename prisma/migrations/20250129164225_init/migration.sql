-- CreateTable
CREATE TABLE "Shipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "destination" TEXT NOT NULL,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "totalWeight" REAL NOT NULL DEFAULT 0.0,
    "totalVolume" REAL NOT NULL DEFAULT 0.0,
    "driverName" TEXT,
    "driverVehicle" TEXT,
    "dateClosed" DATETIME
);

-- CreateTable
CREATE TABLE "PartialShipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiverName" TEXT,
    "receiverPhone" TEXT,
    "receiverAddress" TEXT,
    "length" REAL NOT NULL DEFAULT 0.0,
    "width" REAL NOT NULL DEFAULT 0.0,
    "height" REAL NOT NULL DEFAULT 0.0,
    "weight" REAL NOT NULL DEFAULT 0.0,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "amountPaid" REAL NOT NULL DEFAULT 0.0,
    "paymentStatus" TEXT,
    "shipmentId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "PartialShipment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartialShipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "balance" REAL NOT NULL DEFAULT 0.0
);
