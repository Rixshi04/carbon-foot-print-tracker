# Carbon Footprint Tracker

A lightweight Next.js MVP for estimating monthly personal carbon emissions from electricity, fuel, transport, flights, and waste.

## Features
- Monthly activity input form
- CO₂e estimate in kilograms and tonnes
- Energy / transport / waste breakdown
- Simple visual contribution bars
- Rule-based reduction recommendations
- Client-side validation
- Responsive UI

## Tech stack
- Next.js 14
- React 18
- TypeScript
- CSS

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
| Fuel | 2.31 kg CO₂e / litre |
| Car | 0.17 kg CO₂e / km |
| Public transport | 0.08 kg CO₂e / km |
| Flight | 0.25 kg CO₂e / km |
| Waste | 0.50 kg CO₂e / kg |

Total = energy + transport + waste.

These are prototype defaults, not official reporting factors. Replace them with documented, region-specific factors before formal carbon accounting.

## Scope

This repository previously contained project documentation and diagrams but no runnable application source. The current implementation turns the core calculation concept into a working MVP.

It does not claim to implement the previously described AI recommendations, IoT integration, predictive analytics, gamification, or live utility integrations.

## Future improvements
- Region-specific emission-factor configuration
- Persistent monthly history
- CSV/PDF export
- User accounts
- Historical trend charts
- More detailed transport and flight methodology
- Documented factor sources