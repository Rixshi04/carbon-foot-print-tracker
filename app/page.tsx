"use client";

import { FormEvent, useState } from "react";
import jsPDF from "jspdf";
import {
  calculateCarbon,
  getRecommendations,
  CarbonInput,
  CarbonResult
} from "../lib/carbon";

const fields: { key: keyof CarbonInput; label: string; unit: string }[] = [
  { key: "electricityKwh", label: "Electricity", unit: "kWh / month" },
  { key: "fuelLiters", label: "Fuel", unit: "litres / month" },
  { key: "carKm", label: "Car travel", unit: "km / month" },
  { key: "publicTransportKm", label: "Public transport", unit: "km / month" },
  { key: "flightKm", label: "Flights", unit: "km / month" },
  { key: "wasteKg", label: "Waste", unit: "kg / month" }
];

const initialInput: CarbonInput = {
  electricityKwh: 0,
  fuelLiters: 0,
  carKm: 0,
  publicTransportKm: 0,
  flightKm: 0,
  wasteKg: 0
};

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadCsv(input: CarbonInput, result: CarbonResult, recommendations: string[]) {
  const rows = [
    ["Carbon Footprint Summary"],
    ["Generated", new Date().toISOString()],
    [],
    ["Input", "Value", "Unit"],
    ["Electricity", input.electricityKwh, "kWh / month"],
    ["Fuel", input.fuelLiters, "litres / month"],
    ["Car travel", input.carKm, "km / month"],
    ["Public transport", input.publicTransportKm, "km / month"],
    ["Flights", input.flightKm, "km / month"],
    ["Waste", input.wasteKg, "kg / month"],
    [],
    ["Emissions", "kg CO2e"],
    ["Energy", result.breakdown.energy],
    ["Transport", result.breakdown.transport],
    ["Waste", result.breakdown.waste],
    ["Total", result.totalKgCO2e],
    ["Total tonnes", result.totalTonsCO2e],
    [],
    ["Recommendations"],
    ...recommendations.map((item) => [item])
  ];

  const csv = rows.map((row) => row.map((value) => csvCell(value ?? "")).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `carbon-footprint-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(input: CarbonInput, result: CarbonResult, recommendations: string[]) {
  const pdf = new jsPDF();
  let y = 20;

  pdf.setFontSize(20);
  pdf.text("Carbon Footprint Summary", 20, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
  y += 14;

  pdf.setFontSize(16);
  pdf.text(`Total: ${result.totalKgCO2e} kg CO2e / month`, 20, y);
  y += 7;
  pdf.setFontSize(11);
  pdf.text(`Equivalent: ${result.totalTonsCO2e} tonnes CO2e`, 20, y);
  y += 14;

  pdf.setFontSize(14);
  pdf.text("Activity inputs", 20, y);
  y += 8;
  pdf.setFontSize(10);
  fields.forEach((field) => {
    pdf.text(`${field.label}: ${input[field.key]} ${field.unit}`, 24, y);
    y += 6;
  });

  y += 6;
  pdf.setFontSize(14);
  pdf.text("Emissions breakdown", 20, y);
  y += 8;
  pdf.setFontSize(10);
  Object.entries(result.breakdown).forEach(([category, value]) => {
    pdf.text(`${category}: ${value} kg CO2e`, 24, y);
    y += 6;
  });

  y += 6;
  pdf.setFontSize(14);
  pdf.text("Recommendations", 20, y);
  y += 8;
  pdf.setFontSize(10);
  recommendations.forEach((item) => {
    const lines = pdf.splitTextToSize(`• ${item}`, 165);
    pdf.text(lines, 24, y);
    y += lines.length * 5 + 2;
  });

  y += 8;
  pdf.setFontSize(8);
  pdf.text("Prototype estimate. Emission factors are illustrative defaults and are not official reporting factors.", 20, y);

  pdf.save(`carbon-footprint-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function Home() {
  const [input, setInput] = useState<CarbonInput>(initialInput);
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [error, setError] = useState("");

  function updateField(key: keyof CarbonInput, value: string) {
    setInput((current) => ({ ...current, [key]: Number(value) || 0 }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setError("");
      setResult(calculateCarbon(input));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Could not calculate footprint.");
    }
  }

  const recommendations = result ? getRecommendations(result) : [];

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">PERSONAL SUSTAINABILITY</p>
        <h1>Understand your carbon footprint.</h1>
        <p className="subtitle">Enter your monthly activity and get a transparent CO₂e estimate with a category breakdown.</p>
      </section>

      <div className="grid">
        <form className="card form-card" onSubmit={submit}>
          <div className="card-heading"><h2>Monthly activity</h2><span>All fields are optional</span></div>
          {fields.map((field) => (
            <label className="field" key={field.key}>
              <span>{field.label}</span>
              <small>{field.unit}</small>
              <input type="number" min="0" step="any" value={input[field.key]} onChange={(event) => updateField(field.key, event.target.value)} />
            </label>
          ))}
          <button type="submit">Calculate footprint</button>
          {error && <p className="error">{error}</p>}
        </form>

        <section className="card result-card">
          <div className="card-heading"><h2>Your estimate</h2><span>kg CO₂e / month</span></div>
          {result ? (
            <>
              <div className="total">{result.totalKgCO2e.toLocaleString()} <span>kg</span></div>
              <p className="tons">{result.totalTonsCO2e} tonnes CO₂e</p>
              <div className="breakdown">
                {Object.entries(result.breakdown).map(([category, value]) => {
                  const percentage = result.totalKgCO2e ? (value / result.totalKgCO2e) * 100 : 0;
                  return <div className="bar-row" key={category}><div className="bar-label"><span>{category}</span><b>{value} kg</b></div><div className="bar"><i style={{ width: `${percentage}%` }} /></div></div>;
                })}
              </div>
              <div className="recommendations">
                <h3>What to focus on</h3>
                <ul>{recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="export-actions">
                <button type="button" onClick={() => downloadCsv(input, result, recommendations)}>Download CSV</button>
                <button type="button" onClick={() => downloadPdf(input, result, recommendations)}>Download PDF</button>
              </div>
            </>
          ) : <div className="empty">Enter your activity and calculate your footprint to see the breakdown.</div>}
        </section>
      </div>

      <p className="disclaimer">Prototype estimates only. Emission factors are illustrative defaults and should be replaced with documented, region-specific factors before official reporting.</p>
    </main>
  );
}
