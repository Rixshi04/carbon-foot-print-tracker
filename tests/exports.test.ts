import { buildCsv, createPdf, EXPORT_FIELDS } from "../lib/exports";
import { CarbonInput, CarbonResult } from "../lib/carbon";

const input: CarbonInput = {
  electricityKwh: 100, fuelLiters: 10, carKm: 0,
  publicTransportKm: 20, flightKm: 0, wasteKg: 5
};

const result: CarbonResult = {
  totalKgCO2e: 255.25,
  totalTonsCO2e: 0.255,
  breakdown: { energy: 70, transport: 182.75, waste: 2.5 }
};

describe("CSV export", () => {
  test("contains inputs, breakdown, total, and recommendations", () => {
    const csv = buildCsv(input, result, ["Reduce electricity use."], new Date("2026-01-02T03:04:05.000Z"));
    expect(csv).toContain('"Carbon Footprint Summary"');
    expect(csv).toContain('"Electricity","100","kWh / month"');
    expect(csv).toContain('"Vehicle fuel","10","litres / month (fuel method)"');
    expect(csv).toContain('"Energy","70"');
    expect(csv).toContain('"Transport","182.75"');
    expect(csv).toContain('"Total","255.25"');
    expect(csv).toContain('"Reduce electricity use."');
    expect(csv).toContain('"2026-01-02T03:04:05.000Z"');
  });

  test("escapes commas and quotes safely", () => {
    const csv = buildCsv(input, result, ['Reduce "avoidable", waste.']);
    expect(csv).toContain('"Reduce ""avoidable"", waste."');
  });
});

describe("PDF export", () => {
  test("creates a non-empty PDF with the expected page count", () => {
    const pdf = createPdf(input, result, ["Reduce electricity use."], new Date("2026-01-02T03:04:05.000Z"));
    const output = pdf.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(100);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  test("includes all activity fields in the generated document", () => {
    const pdf = createPdf(input, result, ["Recommendation"]);
    const text = pdf.output("datauristring");
    expect(text.startsWith("data:application/pdf;")).toBe(true);
    expect(EXPORT_FIELDS).toHaveLength(6);
  });
});
