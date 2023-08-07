-- CreateTable
CREATE TABLE "ShortageProductPair" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "shortageOrganizationId" TEXT NOT NULL,
    "shortageProductId" TEXT NOT NULL,
    "shortageVariantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
