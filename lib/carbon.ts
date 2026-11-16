export type CarbonInput = {
  electricityKwh: number;
  /** Vehicle fuel consumed during the month. Use instead of carKm, not alongside it. */
  fuelLiters: number;
  /** Vehicle distance during the month. Use instead of fuelLiters, not alongside it. */
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

/**
 * Illustrative prototype factors only. They are not region-specific or suitable
 * for official reporting without a documented methodology and source review.
 */
export const EMISSION_FACTORS = {
  electricityKgCO2ePerKwh: 0.7,
  fuelKgCO2ePerLiter: 2.31,
  carKgCO2ePerKm: 0.17,
  publicTransportKgCO2ePerKm: 0.08,
  flightKgCO2ePerKm: 0.25,
  wasteKgCO2ePerKg: 0.5
};

export type CarbonEmissionFactors = typeof EMISSION_FACTORS;

function roundKg(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateCarbon(
  input: CarbonInput,
  factors: CarbonEmissionFactors = EMISSION_FACTORS
): CarbonResult {
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${key} must be a finite, non-negative number.`);
    }
  }

  // Fuel-based and distance-based car estimates are alternative methods.
  // Accepting both would count the same vehicle activity twice.
  if (input.fuelLiters > 0 && input.carKm > 0) {
    throw new Error("Choose either vehicle fuel or car distance; do not enter both for the same reporting period.");
  }

  const energyRaw = input.electricityKwh * factors.electricityKgCO2ePerKwh;
  const transportRaw =
    input.fuelLiters * factors.fuelKgCO2ePerLiter +
    input.carKm * factors.carKgCO2ePerKm +
    input.publicTransportKm * factors.publicTransportKgCO2ePerKm +
    input.flightKm * factors.flightKgCO2ePerKm;
  const wasteRaw = input.wasteKg * factors.wasteKgCO2ePerKg;

  if (![energyRaw, transportRaw, wasteRaw].every(Number.isFinite)) {
    throw new Error("The calculated emissions are too large to process. Check the activity values.");
  }

  // Round categories first, then derive the displayed total from those same
  // rounded values so the breakdown always adds up to the displayed total.
  const breakdown = {
    energy: roundKg(energyRaw),
    transport: roundKg(transportRaw),
    waste: roundKg(wasteRaw)
  };
  const totalKgCO2e = roundKg(
    breakdown.energy + breakdown.transport + breakdown.waste
  );

  if (!Number.isFinite(totalKgCO2e)) {
    throw new Error("The calculated total is too large to process. Check the activity values.");
  }

  return {
    totalKgCO2e,
    totalTonsCO2e: Number((totalKgCO2e / 1000).toFixed(3)),
    breakdown
  };
}

export function getRecommendations(result: CarbonResult): string[] {
  const recommendations: string[] = [];

  if (result.totalKgCO2e <= 0) {
    return ["No emissions were calculated. Enter your monthly activity to receive tailored recommendations."];
  }

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
