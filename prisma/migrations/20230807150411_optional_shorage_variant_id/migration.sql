-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShortageProductPair" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "shortageOrganizationId" TEXT NOT NULL,
    "shortageProductId" TEXT NOT NULL,
    "shortageVariantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ShortageProductPair" ("createdAt", "id", "productId", "productVariantId", "shop", "shortageOrganizationId", "shortageProductId", "shortageVariantId") SELECT "createdAt", "id", "productId", "productVariantId", "shop", "shortageOrganizationId", "shortageProductId", "shortageVariantId" FROM "ShortageProductPair";
DROP TABLE "ShortageProductPair";
ALTER TABLE "new_ShortageProductPair" RENAME TO "ShortageProductPair";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
