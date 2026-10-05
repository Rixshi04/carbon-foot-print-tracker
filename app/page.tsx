"use client";

import { FormEvent, useState } from "react";
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
        <p className="subtitle">
          Enter your monthly activity and get a transparent CO₂e estimate with a category breakdown.
        </p>
      </section>

      <div className="grid">
        <form className="card form-card" onSubmit={submit}>
          <div className="card-heading">
            <h2>Monthly activity</h2>
            <span>All fields are optional</span>
          </div>
          {fields.map((field) => (
            <label className="field" key={field.key}>
              <span>{field.label}</span>
              <small>{field.unit}</small>
              <input
                type="number"
                min="0"
                step="any"
                value={input[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          ))}
          <button type="submit">Calculate footprint</button>
          {error && <p className="error">{error}</p>}
        </form>

        <section className="card result-card">
          <div className="card-heading">
            <h2>Your estimate</h2>
            <span>kg CO₂e / month</span>
          </div>
          {result ? (
            <>
              <div className="total">{result.totalKgCO2e.toLocaleString()} <span>kg</span></div>
              <p className="tons">{result.totalTonsCO2e} tonnes CO₂e</p>
              <div className="breakdown">
                {Object.entries(result.breakdown).map(([category, value]) => {
                  const percentage = result.totalKgCO2e ? (value / result.totalKgCO2e) * 100 : 0;
                  return (
                    <div className="bar-row" key={category}>
                      <div className="bar-label"><span>{category}</span><b>{value} kg</b></div>
                      <div className="bar"><i style={{ width: `${percentage}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <div className="recommendations">
                <h3>What to focus on</h3>
                <ul>{recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </>
          ) : (
            <div className="empty">Enter your activity and calculate your footprint to see the breakdown.</div>
          )}
        </section>
      </div>

      <p className="disclaimer">
        Prototype estimates only. Emission factors are illustrative defaults and should be replaced with
        documented, region-specific factors before being used for official reporting.
      </p>
    </main>
  );
}
