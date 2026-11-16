# Carbon Footprint Tracker

A lightweight Next.js MVP for estimating monthly personal carbon emissions from electricity, vehicle activity, public transport, flights, and waste.

## Features
- Monthly activity input form
- CO₂e estimate in kilograms and tonnes
- Energy / transport / waste breakdown
- Distance-based or fuel-based car calculation mode
- Mutually exclusive car calculation modes to prevent double counting
- Simple visual contribution bars
- Rule-based reduction recommendations
- Client-side and calculation-level validation
- CSV and PDF exports
- Responsive UI

## Tech stack
- Next.js 14
- React 18
- TypeScript
- CSS
- Jest

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Calculation

The prototype uses illustrative emission factors:

| Activity | Factor |
|---|---:|
| Electricity | 0.70 kg CO₂e / kWh |
| Vehicle fuel | 2.31 kg CO₂e / litre |
| Car distance | 0.17 kg CO₂e / km |
| Public transport | 0.08 kg CO₂e / km |
| Flight | 0.25 kg CO₂e / km |
| Waste | 0.50 kg CO₂e / kg |

Household electricity is counted under energy. Vehicle fuel and car distance are counted under transport. For car activity, choose either the fuel-based method or the distance-based method for a reporting period; the calculation engine rejects positive values for both methods to avoid double counting. Public transport and flight activity remain separate transport inputs.

The displayed total is calculated from the rounded category values so the displayed breakdown adds up to the displayed total.

These are prototype defaults, not official reporting factors. They are not region-specific and should not be used for formal carbon accounting. Replace them with documented, region-specific factors and a clearly defined methodology before official reporting.

## Scope

This is a prototype estimator. It does not claim to implement AI recommendations, IoT integration, predictive analytics, gamification, or live utility integrations. The current car-method safeguard assumes the monthly car activity is entered using one method only; it does not support mixing distance and fuel data for different cars in the same reporting period.

## Future improvements
- Region-specific emission-factor configuration and documented sources
- Support for multiple vehicles with per-vehicle calculation methods
- Persistent monthly history
- User accounts
- Historical trend charts
- More detailed transport and flight methodology
- Expanded UI integration and accessibility tests

## Automated tests

The project includes Jest tests for:

- Carbon calculations and input validation
- Alternative vehicle calculation methods and double-counting prevention
- Calculation overflow and displayed-total consistency
- Recommendation rules, including zero-emission input
- CSV contents, values, timestamps, and CSV escaping
- PDF generation and non-empty PDF output

Install dependencies and run:

```bash
npm install
npm test
```

For watch mode:

```bash
npm run test:watch
```

The export logic lives in `lib/exports.ts` so CSV/PDF generation can be tested independently from the browser UI.
