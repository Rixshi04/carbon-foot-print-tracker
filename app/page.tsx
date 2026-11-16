"use client";

import { FormEvent, useState } from "react";
import {
  calculateCarbon,
  getRecommendations,
  CarbonInput,
  CarbonResult
} from "../lib/carbon";
import {
  buildCsv,
  createPdf,
  downloadCsv,
  downloadPdf,
  EXPORT_FIELDS
} from "../lib/exports";

type VehicleMethod = "distance" | "fuel";

const fields = EXPORT_FIELDS;

const initialInput: CarbonInput = {
  electricityKwh: 0,
  fuelLiters: 0,
  carKm: 0,
  publicTransportKm: 0,
  flightKm: 0,
  wasteKg: 0
};

export default function Home() {
  const [input, setInput] = useState<CarbonInput>(initialInput);
  const [vehicleMethod, setVehicleMethod] = useState<VehicleMethod>("distance");
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [error, setError] = useState("");

  function updateField(key: keyof CarbonInput, value: string) {
    setInput((current) => ({ ...current, [key]: value === "" ? 0 : Number(value) }));
  }

  function changeVehicleMethod(method: VehicleMethod) {
    setVehicleMethod(method);
    // Clear the previous method so one journey cannot be counted twice.
    setInput((current) => ({ ...current, carKm: 0, fuelLiters: 0 }));
    setResult(null);
    setError("");
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
  const visibleFields = fields.filter((field) => {
    if (field.key === "carKm") return vehicleMethod === "distance";
    if (field.key === "fuelLiters") return vehicleMethod === "fuel";
    return true;
  });

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
          <label className="field">
            <span>Vehicle calculation method</span>
            <small>Choose one method for car emissions</small>
            <select value={vehicleMethod} onChange={(event) => changeVehicleMethod(event.target.value as VehicleMethod)}>
              <option value="distance">Distance travelled (km)</option>
              <option value="fuel">Fuel consumed (litres)</option>
            </select>
          </label>
          <p className="field-help">
            Use either distance or fuel for the same vehicle activity, not both. Public transport and flights are calculated separately.
          </p>
          {visibleFields.map((field) => (
            <label className="field" key={field.key}>
              <span>{field.label}</span>
              <small>{field.unit}</small>
              <input type="number" min="0" step="any" value={input[field.key]} onChange={(event) => updateField(field.key, event.target.value)} />
            </label>
          ))}
          <button type="submit">Calculate footprint</button>
          {error && <p className="error" role="alert">{error}</p>}
        </form>

        <section className="card result-card" aria-live="polite">
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
                <button type="button" onClick={() => downloadCsv(buildCsv(input, result, recommendations), `carbon-footprint-${new Date().toISOString().slice(0, 10)}.csv`)}>Download CSV</button>
                <button type="button" onClick={() => downloadPdf(createPdf(input, result, recommendations), `carbon-footprint-${new Date().toISOString().slice(0, 10)}.pdf`)}>Download PDF</button>
              </div>
            </>
          ) : <div className="empty">Enter your activity and calculate your footprint to see the breakdown.</div>}
        </section>
      </div>

      <p className="disclaimer">Prototype estimates only. Emission factors are illustrative defaults and should be replaced with documented, region-specific factors before official reporting.</p>
    </main>
  );
}
