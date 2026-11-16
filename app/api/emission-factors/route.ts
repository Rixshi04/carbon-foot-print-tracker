import { getEmissionFactorSet } from "../../../lib/emission-factors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const factorSet = await getEmissionFactorSet();
    return Response.json(factorSet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load emission factors.";
    return Response.json({ error: message }, { status: 503 });
  }
}
