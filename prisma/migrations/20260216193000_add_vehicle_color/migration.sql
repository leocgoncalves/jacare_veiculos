-- Add vehicle color information for UI details.
ALTER TABLE "Vehicle"
ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Nao informado';
