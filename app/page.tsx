"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  calculateCarbon,
  getRecommendations,
  CarbonInput,
  CarbonResult,
  CarbonEmissionFactors,
  EMISSION_FACTORS
} from "../lib/carbon";
import {
  buildCsv,
  createPdf,
  downloadCsv,
  downloadPdf,
  EXPORT_FIELDS
} from "../lib/exports";

type VehicleMethod = "distance" | "fuel";

type SavedCalculation = {
  id: string;
  period: string;
  vehicleMethod: string;
  totalKgCO2e: number;
  totalTonsCO2e: number;
  energyKg: number;
  transportKg: number;
  wasteEmissionsKg: number;
  factorVersion: string;
  createdAt: string;
};

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
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [factors, setFactors] = useState<CarbonEmissionFactors>(EMISSION_FACTORS);
  const [factorVersion, setFactorVersion] = useState("illustrative-v1");
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [error, setError] = useState("");
  const [databaseError, setDatabaseError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/emission-factors")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load database emission factors.");
        return data as { factors: CarbonEmissionFactors; version: string };
      })
      .then((data) => {
        if (!active) return;
        setFactors(data.factors);
        setFactorVersion(data.version);
      })
      .catch((err) => {
        if (active) setDatabaseError(err instanceof Error ? err.message : "Database factors are unavailable.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/calculations?period=${encodeURIComponent(period)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load calculation history.");
        return data as { calculations: SavedCalculation[] };
      })
      .then((data) => {
        if (active) {
          setHistory(data.calculations);
          setDatabaseError("");
        }
      })
      .catch((err) => {
        if (active) setDatabaseError(err instanceof Error ? err.message : "Database is unavailable.");
      });
    return () => { active = false; };
  }, [period]);

  function updateField(key: keyof CarbonInput, value: string) {
    setInput((current) => ({ ...current, [key]: value === "" ? 0 : Number(value) }));
    setSavedMessage("");
  }

  function changeVehicleMethod(method: VehicleMethod) {
    setVehicleMethod(method);
    setInput((current) => ({ ...current, carKm: 0, fuelLiters: 0 }));
    setResult(null);
    setError("");
    setSavedMessage("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setError("");
      setSavedMessage("");
      setResult(calculateCarbon(input, factors));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Could not calculate footprint.");
    }
  }

  async function saveCalculation() {
    if (!result) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, vehicleMethod, input })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this calculation.");

      const calculation = data.calculation as SavedCalculation;
      setHistory((current) => [calculation, ...current.filter((item) => item.id !== calculation.id)]);
      setResult({
        totalKgCO2e: calculation.totalKgCO2e,
        totalTonsCO2e: calculation.totalTonsCO2e,
        breakdown: {
          energy: calculation.energyKg,
          transport: calculation.transportKg,
          waste: calculation.wasteEmissionsKg
        }
      });
      setFactorVersion(calculation.factorVersion);
      setSavedMessage("Calculation saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this calculation.");
    } finally {
      setSaving(false);
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
        <p className="subtitle">Enter your monthly activity, save estimates and review your calculation history.</p>
      </section>

      <div className="grid">
        <form className="card form-card" onSubmit={submit}>
          <div className="card-heading"><h2>Monthly activity</h2><span>All fields are optional</span></div>
          <label className="field">
            <span>Reporting month</span>
            <small>Month this activity belongs to</small>
            <input type="month" value={period} onChange={(event) => { setPeriod(event.target.value); setResult(null); setSavedMessage(""); setError(""); }} required />
          </label>
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
          {savedMessage && <p className="success" role="status">{savedMessage}</p>}
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
                <button type="button" disabled={saving} onClick={saveCalculation}>{saving ? "Saving..." : "Save calculation"}</button>
                <button type="button" onClick={() => downloadCsv(buildCsv(input, result, recommendations), `carbon-footprint-${period}.csv`)}>Download CSV</button>
                <button type="button" onClick={() => downloadPdf(createPdf(input, result, recommendations), `carbon-footprint-${period}.pdf`)}>Download PDF</button>
              </div>
              <p className="field-help">Emission factor version: {factorVersion}</p>
            </>
          ) : <div className="empty">Enter your activity and calculate your footprint to see the breakdown.</div>}
        </section>
      </div>

      <section className="card history-card">
        <div className="card-heading"><h2>Saved calculations</h2><span>{period}</span></div>
        {databaseError && <p className="error" role="alert">{databaseError} Set up the local database using the README instructions.</p>}
        {!databaseError && history.length === 0 && <p className="empty">No saved calculations for this month yet. Calculate your footprint and select Save calculation.</p>}
        {history.length > 0 && (
          <div className="history-list">
            {history.map((item) => (
              <div className="history-row" key={item.id}>
                <div>
                  <strong>{item.totalKgCO2e.toLocaleString()} kg CO₂e</strong>
                  <small>{new Date(item.createdAt).toLocaleString()} · {item.vehicleMethod} method · {item.factorVersion}</small>
                </div>
                <span>{item.totalTonsCO2e} t</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="disclaimer">Prototype estimates only. Seeded emission factors are illustrative defaults, not official or region-specific reporting factors.</p>
    </main>
  );
}
