import { calculateCarbon, getRecommendations } from "../lib/carbon";

describe("calculateCarbon", () => {
  test("calculates energy, transport, waste, and total emissions", () => {
    const result = calculateCarbon({
      electricityKwh: 100,
      fuelLiters: 10,
      carKm: 100,
      publicTransportKm: 50,
      flightKm: 100,
      wasteKg: 20
    });

    expect(result.breakdown.energy).toBe(93.1);
    expect(result.breakdown.transport).toBe(38.5);
    expect(result.breakdown.waste).toBe(10);
    expect(result.totalKgCO2e).toBe(141.6);
    expect(result.totalTonsCO2e).toBe(0.142);
  });

  test("accepts zero activity", () => {
    expect(calculateCarbon({
      electricityKwh: 0, fuelLiters: 0, carKm: 0,
      publicTransportKm: 0, flightKm: 0, wasteKg: 0
    }).totalKgCO2e).toBe(0);
  });

  test("rejects negative values", () => {
    expect(() => calculateCarbon({
      electricityKwh: -1, fuelLiters: 0, carKm: 0,
      publicTransportKm: 0, flightKm: 0, wasteKg: 0
    })).toThrow("electricityKwh must be a non-negative number.");
  });

  test("rejects non-finite values", () => {
    expect(() => calculateCarbon({
      electricityKwh: Number.NaN, fuelLiters: 0, carKm: 0,
      publicTransportKm: 0, flightKm: 0, wasteKg: 0
    })).toThrow();
  });
});

describe("getRecommendations", () => {
  test("flags high energy contribution", () => {
    const result = calculateCarbon({
      electricityKwh: 1000, fuelLiters: 0, carKm: 0,
      publicTransportKm: 0, flightKm: 0, wasteKg: 0
    });
    expect(getRecommendations(result)[0]).toMatch(/Energy is your largest contributor/);
  });

  test("always returns at least one recommendation", () => {
    const result = calculateCarbon({
      electricityKwh: 0, fuelLiters: 0, carKm: 0,
      publicTransportKm: 0, flightKm: 0, wasteKg: 0
    });
    expect(getRecommendations(result).length).toBeGreaterThan(0);
  });
});
