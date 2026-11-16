/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST, GET } from "../app/api/calculations/route";
import { GET as getEmissionFactors } from "../app/api/emission-factors/route";
import { prisma } from "../lib/prisma";

const period = "2099-01";
const input = {
  electricityKwh: 100,
  fuelLiters: 0,
  carKm: 25,
  publicTransportKm: 10,
  flightKm: 0,
  wasteKg: 5
};

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/calculations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("SQLite + Prisma calculation API", () => {
  beforeEach(async () => {
    await prisma.carbonCalculation.deleteMany({ where: { period } });
  });

  afterAll(async () => {
    await prisma.carbonCalculation.deleteMany({ where: { period } });
    await prisma.$disconnect();
  });

  test("serves the seeded database emission factors", async () => {
    const response = await getEmissionFactors();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.version).toBe("illustrative-v1");
    expect(payload.factors.electricityKgCO2ePerKwh).toBe(0.7);
    expect(payload.factors.fuelKgCO2ePerLiter).toBe(2.31);
  });

  test("validates, calculates and persists a monthly calculation", async () => {
    const response = await POST(postRequest({
      period,
      vehicleMethod: "distance",
      input
    }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.calculation.period).toBe(period);
    expect(payload.calculation.totalKgCO2e).toBeGreaterThan(0);
    expect(payload.calculation.factorVersion).toBe("illustrative-v1");

    const persisted = await prisma.carbonCalculation.findUnique({
      where: { id: payload.calculation.id }
    });
    expect(persisted).not.toBeNull();
    expect(persisted?.electricityFactor).toBe(0.7);
    expect(persisted?.carDistanceFactor).toBe(0.17);
  });

  test("returns saved calculations for the requested month", async () => {
    await POST(postRequest({ period, vehicleMethod: "distance", input }));

    const request = new NextRequest(
      `http://localhost/api/calculations?period=${period}`
    );
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.calculations).toHaveLength(1);
    expect(payload.calculations[0].period).toBe(period);
  });

  test("rejects conflicting vehicle methods before writing to the database", async () => {
    const response = await POST(postRequest({
      period,
      vehicleMethod: "distance",
      input: { ...input, fuelLiters: 10 }
    }));

    expect(response.status).toBe(400);
    expect(await prisma.carbonCalculation.count({ where: { period } })).toBe(0);
  });
});
