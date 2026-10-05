export type CarbonInput = {
  electricityKwh: number;
  fuelLiters: number;
  carKm: number;
  publicTransportKm: number;
  flightKm: number;
  wasteKg: number;
};

export type CarbonResult = {
  totalKgCO2e: number;
  totalTonsCO2e: number;
  breakdown: {
    energy: number;
    transport: number;
    waste: number;
  };
};

export const EMISSION_FACTORS = {
  electricityKgCO2ePerKwh: 0.7,
  fuelKgCO2ePerLiter: 2.31,
  carKgCO2ePerKm: 0.17,
  publicTransportKgCO2ePerKm: 0.08,
  flightKgCO2ePerKm: 0.25,
  wasteKgCO2ePerKg: 0.5
};

export function calculateCarbon(input: CarbonInput): CarbonResult {
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${key} must be a non-negative number.`);
    }
  }

  const energy =
    input.electricityKwh * EMISSION_FACTORS.electricityKgCO2ePerKwh +
    input.fuelLiters * EMISSION_FACTORS.fuelKgCO2ePerLiter;

  const transport =
    input.carKm * EMISSION_FACTORS.carKgCO2ePerKm +
    input.publicTransportKm * EMISSION_FACTORS.publicTransportKgCO2ePerKm +
    input.flightKm * EMISSION_FACTORS.flightKgCO2ePerKm;

  const waste = input.wasteKg * EMISSION_FACTORS.wasteKgCO2ePerKg;
  const totalKgCO2e = energy + transport + waste;

  return {
    totalKgCO2e: Number(totalKgCO2e.toFixed(2)),
    totalTonsCO2e: Number((totalKgCO2e / 1000).toFixed(3)),
    breakdown: {
      energy: Number(energy.toFixed(2)),
      transport: Number(transport.toFixed(2)),
      waste: Number(waste.toFixed(2))
    }
  };
}

export function getRecommendations(result: CarbonResult) {
  const recommendations: string[] = [];

  if (result.breakdown.energy > result.totalKgCO2e * 0.4) {
    recommendations.push("Energy is your largest contributor. Reduce electricity use or switch to lower-carbon power.");
  }
  if (result.breakdown.transport > result.totalKgCO2e * 0.4) {
    recommendations.push("Transport is a major contributor. Combine trips and prefer public transport where practical.");
  }
  if (result.breakdown.waste > result.totalKgCO2e * 0.2) {
    recommendations.push("Waste is significant. Increase recycling, reuse items, and reduce avoidable waste.");
  }
  if (!recommendations.length) {
    recommendations.push("Your footprint is spread across categories. Focus on the largest category first for the biggest reduction.");
  }

  return recommendations;
}
