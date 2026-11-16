const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const factors = [
  {
    key: "electricityKgCO2ePerKwh",
    label: "Electricity",
    unit: "kWh",
    kgCO2ePerUnit: 0.7
  },
  {
    key: "fuelKgCO2ePerLiter",
    label: "Vehicle fuel",
    unit: "litre",
    kgCO2ePerUnit: 2.31
  },
  {
    key: "carKgCO2ePerKm",
    label: "Car distance",
    unit: "km",
    kgCO2ePerUnit: 0.17
  },
  {
    key: "publicTransportKgCO2ePerKm",
    label: "Public transport",
    unit: "km",
    kgCO2ePerUnit: 0.08
  },
  {
    key: "flightKgCO2ePerKm",
    label: "Flight",
    unit: "km",
    kgCO2ePerUnit: 0.25
  },
  {
    key: "wasteKgCO2ePerKg",
    label: "Waste",
    unit: "kg",
    kgCO2ePerUnit: 0.5
  }
];

async function main() {
  for (const factor of factors) {
    await prisma.emissionFactor.upsert({
      where: { key: factor.key },
      update: {
        ...factor,
        region: "DEFAULT",
        version: "illustrative-v1",
        source: "Illustrative prototype default; not an official or region-specific factor."
      },
      create: {
        ...factor,
        region: "DEFAULT",
        version: "illustrative-v1",
        source: "Illustrative prototype default; not an official or region-specific factor."
      }
    });
  }
  console.log(`Seeded ${factors.length} illustrative emission factors.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
