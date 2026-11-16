-- CreateTable
CREATE TABLE "CarbonCalculation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "vehicleMethod" TEXT NOT NULL,
    "electricityKwh" REAL NOT NULL DEFAULT 0,
    "fuelLiters" REAL NOT NULL DEFAULT 0,
    "carKm" REAL NOT NULL DEFAULT 0,
    "publicTransportKm" REAL NOT NULL DEFAULT 0,
    "flightKm" REAL NOT NULL DEFAULT 0,
    "wasteKg" REAL NOT NULL DEFAULT 0,
    "energyKg" REAL NOT NULL,
    "transportKg" REAL NOT NULL,
    "wasteEmissionsKg" REAL NOT NULL,
    "totalKgCO2e" REAL NOT NULL,
    "totalTonsCO2e" REAL NOT NULL,
    "factorVersion" TEXT NOT NULL,
    "electricityFactor" REAL NOT NULL,
    "fuelFactor" REAL NOT NULL,
    "carDistanceFactor" REAL NOT NULL,
    "publicTransportFactor" REAL NOT NULL,
    "flightFactor" REAL NOT NULL,
    "wasteFactor" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "kgCO2ePerUnit" REAL NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'DEFAULT',
    "version" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CarbonCalculation_period_idx" ON "CarbonCalculation"("period");

-- CreateIndex
CREATE INDEX "CarbonCalculation_createdAt_idx" ON "CarbonCalculation"("createdAt");

-- CreateIndex
CREATE INDEX "EmissionFactor_region_idx" ON "EmissionFactor"("region");
