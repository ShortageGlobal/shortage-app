/*
  Warnings:

  - Added the required column `shortageOrganizationName` to the `ShortageProductPair` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShortageProductPair" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "shortageOrganizationId" TEXT NOT NULL,
    "shortageOrganizationName" TEXT NOT NULL,
    "shortageProductId" TEXT NOT NULL,
    "shortageProductName" TEXT NOT NULL,
    "shortageProductImage" TEXT NOT NULL,
    "shortageVariantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ShortageProductPair" ("createdAt", "id", "productId", "productVariantId", "shop", "shortageOrganizationId", "shortageProductId", "shortageProductImage", "shortageProductName", "shortageVariantId") SELECT "createdAt", "id", "productId", "productVariantId", "shop", "shortageOrganizationId", "shortageProductId", "shortageProductImage", "shortageProductName", "shortageVariantId" FROM "ShortageProductPair";
DROP TABLE "ShortageProductPair";
ALTER TABLE "new_ShortageProductPair" RENAME TO "ShortageProductPair";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
