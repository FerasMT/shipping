-- CreateTable
CREATE TABLE "PartialShipmentItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weight" REAL NOT NULL,
    "origin" TEXT NOT NULL,
    "hscode" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "value" REAL NOT NULL,
    "partialShipmentId" INTEGER NOT NULL,
    CONSTRAINT "PartialShipmentItem_partialShipmentId_fkey" FOREIGN KEY ("partialShipmentId") REFERENCES "PartialShipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
