import { NextRequest } from "next/server";
import { CarbonInput, calculateCarbon } from "../../../lib/carbon";
import { getEmissionFactorSet } from "../../../lib/emission-factors";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

const inputKeys: (keyof CarbonInput)[] = [
  "electricityKwh",
  "fuelLiters",
  "carKm",
  "publicTransportKm",
  "flightKm",
  "wasteKg"
];

function parseInput(value: unknown): CarbonInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Activity input must be an object.");
  }

  const source = value as Record<string, unknown>;
  const input = {} as CarbonInput;

  for (const key of inputKeys) {
    const field = source[key];
    if (typeof field !== "number" || !Number.isFinite(field) || field < 0) {
      throw new Error(`${key} must be a finite, non-negative number.`);
    }
    input[key] = field;
  }

  return input;
}

function validPeriod(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period");
  if (period !== null && !validPeriod(period)) {
    return Response.json({ error: "Period must use YYYY-MM format." }, { status: 400 });
  }

  try {
    const calculations = await prisma.carbonCalculation.findMany({
      where: period ? { period } : undefined,
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        period: true,
        vehicleMethod: true,
        totalKgCO2e: true,
        totalTonsCO2e: true,
        energyKg: true,
        transportKg: true,
        wasteEmissionsKg: true,
        factorVersion: true,
        createdAt: true
      }
    });

    return Response.json({ calculations });
  } catch {
    return Response.json({ error: "Could not retrieve saved calculations." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Request body must be an object.");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must contain valid JSON." }, { status: 400 });
  }

  if (!validPeriod(body.period)) {
    return Response.json({ error: "Period must use YYYY-MM format." }, { status: 400 });
  }

  const vehicleMethod = body.vehicleMethod;
  if (vehicleMethod !== "distance" && vehicleMethod !== "fuel") {
    return Response.json({ error: "Choose a valid vehicle calculation method." }, { status: 400 });
  }

  let input: CarbonInput;
  try {
    input = parseInput(body.input);
    if (vehicleMethod === "distance" && input.fuelLiters > 0) {
      throw new Error("Fuel input is not allowed when distance-based mode is selected.");
    }
    if (vehicleMethod === "fuel" && input.carKm > 0) {
      throw new Error("Car distance is not allowed when fuel-based mode is selected.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid activity input.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const { factors, version } = await getEmissionFactorSet();
    const result = calculateCarbon(input, factors);
    const calculation = await prisma.carbonCalculation.create({
      data: {
        period: body.period,
        vehicleMethod,
        ...input,
        energyKg: result.breakdown.energy,
        transportKg: result.breakdown.transport,
        wasteEmissionsKg: result.breakdown.waste,
        totalKgCO2e: result.totalKgCO2e,
        totalTonsCO2e: result.totalTonsCO2e,
        factorVersion: version,
        electricityFactor: factors.electricityKgCO2ePerKwh,
        fuelFactor: factors.fuelKgCO2ePerLiter,
        carDistanceFactor: factors.carKgCO2ePerKm,
        publicTransportFactor: factors.publicTransportKgCO2ePerKm,
        flightFactor: factors.flightKgCO2ePerKm,
        wasteFactor: factors.wasteKgCO2ePerKg
      },
      select: {
        id: true,
        period: true,
        vehicleMethod: true,
        totalKgCO2e: true,
        totalTonsCO2e: true,
        energyKg: true,
        transportKg: true,
        wasteEmissionsKg: true,
        factorVersion: true,
        createdAt: true
      }
    });

    return Response.json({ calculation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save calculation.";
    const status = message.includes("Emission factors") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
