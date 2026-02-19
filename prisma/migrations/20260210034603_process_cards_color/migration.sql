-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "siteTitle" TEXT NOT NULL DEFAULT 'Jacare Veiculos',
    "logoUrl" TEXT NOT NULL DEFAULT '/logo-jacare.png',
    "logoScale" INTEGER NOT NULL DEFAULT 56,
    "homeBackgroundUrl" TEXT,
    "homeBackgroundColor" TEXT NOT NULL DEFAULT '#090b10',
    "processCardsBackgroundColor" TEXT NOT NULL DEFAULT '#10141d',
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
INSERT INTO "new_SiteSettings" ("facebookUrl", "footerAddress", "footerEmail", "footerHours", "footerPhone", "homeBackgroundColor", "homeBackgroundUrl", "id", "instagramUrl", "logoScale", "logoUrl", "metaAccessToken", "metaAppId", "metaAppSecret", "siteTitle", "updatedAt", "whatsappUrl") SELECT "facebookUrl", "footerAddress", "footerEmail", "footerHours", "footerPhone", "homeBackgroundColor", "homeBackgroundUrl", "id", "instagramUrl", "logoScale", "logoUrl", "metaAccessToken", "metaAppId", "metaAppSecret", "siteTitle", "updatedAt", "whatsappUrl" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
