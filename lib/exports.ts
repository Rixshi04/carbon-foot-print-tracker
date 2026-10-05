import jsPDF from "jspdf";
import { CarbonInput, CarbonResult } from "./carbon";

export const EXPORT_FIELDS: { key: keyof CarbonInput; label: string; unit: string }[] = [
  { key: "electricityKwh", label: "Electricity", unit: "kWh / month" },
  { key: "fuelLiters", label: "Fuel", unit: "litres / month" },
  { key: "carKm", label: "Car travel", unit: "km / month" },
  { key: "publicTransportKm", label: "Public transport", unit: "km / month" },
  { key: "flightKm", label: "Flights", unit: "km / month" },
  { key: "wasteKg", label: "Waste", unit: "kg / month" }
];

export function buildCsv(input: CarbonInput, result: CarbonResult, recommendations: string[], generatedAt = new Date()): string {
  const rows: (string | number)[][] = [
    ["Carbon Footprint Summary"], ["Generated", generatedAt.toISOString()], [],
    ["Input", "Value", "Unit"],
    ...EXPORT_FIELDS.map((field) => [field.label, input[field.key], field.unit]),
    [], ["Emissions", "kg CO2e"], ["Energy", result.breakdown.energy],
    ["Transport", result.breakdown.transport], ["Waste", result.breakdown.waste],
    ["Total", result.totalKgCO2e], ["Total tonnes", result.totalTonsCO2e], [],
    ["Recommendations"], ...recommendations.map((item) => [item])
  ];
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return rows.map((row) => row.map((value) => cell(value ?? "")).join(",")).join("\n");
}

export function createPdf(input: CarbonInput, result: CarbonResult, recommendations: string[], generatedAt = new Date()): jsPDF {
  const pdf = new jsPDF();
  let y = 20;
  pdf.setFontSize(20); pdf.text("Carbon Footprint Summary", 20, y); y += 10;
  pdf.setFontSize(10); pdf.text(`Generated: ${generatedAt.toLocaleString()}`, 20, y); y += 14;
  pdf.setFontSize(16); pdf.text(`Total: ${result.totalKgCO2e} kg CO2e / month`, 20, y); y += 7;
  pdf.setFontSize(11); pdf.text(`Equivalent: ${result.totalTonsCO2e} tonnes CO2e`, 20, y); y += 14;
  pdf.setFontSize(14); pdf.text("Activity inputs", 20, y); y += 8; pdf.setFontSize(10);
  EXPORT_FIELDS.forEach((field) => { pdf.text(`${field.label}: ${input[field.key]} ${field.unit}`, 24, y); y += 6; });
  y += 6; pdf.setFontSize(14); pdf.text("Emissions breakdown", 20, y); y += 8; pdf.setFontSize(10);
  Object.entries(result.breakdown).forEach(([category, value]) => { pdf.text(`${category}: ${value} kg CO2e`, 24, y); y += 6; });
  y += 6; pdf.setFontSize(14); pdf.text("Recommendations", 20, y); y += 8; pdf.setFontSize(10);
  recommendations.forEach((item) => { const lines = pdf.splitTextToSize(`• ${item}`, 165); pdf.text(lines, 24, y); y += lines.length * 5 + 2; });
  pdf.setFontSize(8); pdf.text("Prototype estimate. Emission factors are illustrative defaults and are not official reporting factors.", 20, y + 8);
  return pdf;
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export function downloadPdf(pdf: jsPDF, filename: string): void { pdf.save(filename); }
