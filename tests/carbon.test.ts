import { calculateCarbon, getRecommendations } from "../lib/carbon";

const zeroInput = {
  electricityKwh: 0, fuelLiters: 0, carKm: 0,
  publicTransportKm: 0, flightKm: 0, wasteKg: 0
};

describe("calculateCarbon", () => {
  test("calculates energy, transport, waste, and total emissions", () => {
    const result = calculateCarbon({
      electricityKwh: 100,
      fuelLiters: 10,
      carKm: 0,
      publicTransportKm: 50,
      flightKm: 100,
      wasteKg: 20
    });

    expect(result.breakdown.energy).toBe(70);
    expect(result.breakdown.transport).toBe(52.1);
    expect(result.breakdown.waste).toBe(10);
    expect(result.totalKgCO2e).toBe(132.1);
    expect(result.totalTonsCO2e).toBe(0.132);
  });

  test("calculates distance-based car emissions", () => {
    const result = calculateCarbon({ ...zeroInput, carKm: 100 });
    expect(result.breakdown.transport).toBe(17);
    expect(result.breakdown.energy).toBe(0);
  });

  test("calculates fuel-based car emissions as transport, not household energy", () => {
    const result = calculateCarbon({ ...zeroInput, fuelLiters: 10 });
    expect(result.breakdown.transport).toBe(23.1);
    expect(result.breakdown.energy).toBe(0);
  });

  test("rejects simultaneous fuel and distance vehicle estimates", () => {
    expect(() => calculateCarbon({
      ...zeroInput, fuelLiters: 10, carKm: 100
    })).toThrow("Choose either vehicle fuel or car distance");
  });

  test("accepts zero activity", () => {
    expect(calculateCarbon(zeroInput).totalKgCO2e).toBe(0);
  });

  test("rejects negative values", () => {
    expect(() => calculateCarbon({
      ...zeroInput, electricityKwh: -1
    })).toThrow("electricityKwh must be a finite, non-negative number.");
  });

  test("rejects non-finite values", () => {
    expect(() => calculateCarbon({
      ...zeroInput, electricityKwh: Number.NaN
    })).toThrow();
  });

  test("rejects values that overflow during emission calculation", () => {
    expect(() => calculateCarbon({
      ...zeroInput, electricityKwh: Number.MAX_VALUE
    })).toThrow("calculated emissions are too large");
  });

  test("displayed categories add up to the displayed total", () => {
    const result = calculateCarbon({
      ...zeroInput,
      electricityKwh: 1.01,
      publicTransportKm: 1.03,
      wasteKg: 1.07
    });
    const categoryTotal = result.breakdown.energy + result.breakdown.transport + result.breakdown.waste;
    expect(result.totalKgCO2e).toBe(categoryTotal);
  });
});

describe("getRecommendations", () => {
  test("flags high energy contribution", () => {
    const result = calculateCarbon({ ...zeroInput, electricityKwh: 1000 });
    expect(getRecommendations(result)[0]).toMatch(/Energy is your largest contributor/);
  });

  test("returns a data-entry prompt when emissions are zero", () => {
    const result = calculateCarbon(zeroInput);
    expect(getRecommendations(result)[0]).toMatch(/No emissions were calculated/);
  });

  test("returns at least one recommendation for a non-zero footprint", () => {
    const result = calculateCarbon({
      ...zeroInput, electricityKwh: 1, publicTransportKm: 1, wasteKg: 1
    });
    expect(getRecommendations(result).length).toBeGreaterThan(0);
  });
});
