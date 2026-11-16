import { prisma } from "./prisma";
import {
  CarbonEmissionFactors,
  EMISSION_FACTORS
} from "./carbon";

export async function getEmissionFactorSet(): Promise<{
  factors: CarbonEmissionFactors;
  version: string;
}> {
  const keys = Object.keys(EMISSION_FACTORS) as (keyof CarbonEmissionFactors)[];
  const rows = await prisma.emissionFactor.findMany({
    where: { region: "DEFAULT" }
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const missing = keys.filter((key) => !byKey.has(key));

  if (missing.length) {
    throw new Error(
      `Emission factors are not seeded. Missing: ${missing.join(", ")}. Run npm run db:seed.`
    );
  }

  const versions = new Set(keys.map((key) => byKey.get(key)!.version));
  if (versions.size !== 1) {
    throw new Error("The active emission factors have inconsistent versions.");
  }

  const factors = Object.fromEntries(
    keys.map((key) => [key, byKey.get(key)!.kgCO2ePerUnit])
  ) as CarbonEmissionFactors;

  return { factors, version: [...versions][0] };
}
