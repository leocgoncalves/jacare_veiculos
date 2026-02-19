-- CreateTable
CREATE TABLE "TestDrive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "note" TEXT,
    "preferredDate" DATETIME NOT NULL,
    "scheduledDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminObservation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vehicleId" TEXT NOT NULL,
    CONSTRAINT "TestDrive_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "siteTitle" TEXT NOT NULL DEFAULT 'Jacare Veiculos',
    "logoUrl" TEXT NOT NULL DEFAULT '/logo-jacare.png',
    "logoScale" INTEGER NOT NULL DEFAULT 56,
    "homeBackgroundUrl" TEXT,
    "footerAddress" TEXT NOT NULL DEFAULT 'Av. Comercial, 1000 - Centro, Sao Paulo - SP',
    "footerPhone" TEXT NOT NULL DEFAULT '(11) 0000-0000',
    "footerEmail" TEXT NOT NULL DEFAULT 'contato@jacareveiculos.com.br',
    "footerHours" TEXT NOT NULL DEFAULT 'Segunda a Sexta: 08h as 18h | Sabado: 08h as 14h',
    "instagramUrl" TEXT NOT NULL DEFAULT 'https://instagram.com',
    "facebookUrl" TEXT NOT NULL DEFAULT 'https://facebook.com',
    "whatsappUrl" TEXT NOT NULL DEFAULT 'https://wa.me/5500000000000',
    "metaAppId" TEXT,
    "metaAppSecret" TEXT,
    "metaAccessToken" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL DEFAULT 'Nao informado',
    "model" TEXT NOT NULL DEFAULT 'Nao informado',
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "km" INTEGER NOT NULL,
    "transmission" TEXT NOT NULL DEFAULT 'Nao informado',
    "fuel" TEXT NOT NULL DEFAULT 'Nao informado',
    "priceInCents" INTEGER NOT NULL,
    "shortSpecs" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isWeeklyHighlight" BOOLEAN NOT NULL DEFAULT false,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "laudoStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ipvaStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "manualChaveStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "prontaEntrega" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Vehicle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("createdAt", "createdById", "description", "id", "ipvaStatus", "isPublished", "isWeeklyHighlight", "km", "laudoStatus", "manualChaveStatus", "name", "priceInCents", "prontaEntrega", "shortSpecs", "type", "updatedAt", "year") SELECT "createdAt", "createdById", "description", "id", "ipvaStatus", "isPublished", "isWeeklyHighlight", "km", "laudoStatus", "manualChaveStatus", "name", "priceInCents", "prontaEntrega", "shortSpecs", "type", "updatedAt", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE INDEX "Vehicle_isPublished_isWeeklyHighlight_isSold_deletedAt_idx" ON "Vehicle"("isPublished", "isWeeklyHighlight", "isSold", "deletedAt");
CREATE INDEX "Vehicle_type_priceInCents_year_idx" ON "Vehicle"("type", "priceInCents", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TestDrive_vehicleId_status_idx" ON "TestDrive"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "TestDrive_preferredDate_idx" ON "TestDrive"("preferredDate");
