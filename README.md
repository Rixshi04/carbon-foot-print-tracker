# Carbon Footprint Tracker

A Next.js MVP for estimating monthly personal carbon emissions, saving calculations to SQLite, and reviewing monthly history.

## Features
- Monthly activity input form
- CO₂e estimate in kilograms and tonnes
- Energy / transport / waste breakdown
- Distance-based or fuel-based car calculation mode
- Server-side validation and calculation before saving
- SQLite persistence through Prisma ORM
- Database-backed emission factors with version snapshots on saved calculations
- Monthly saved-calculation history
- CSV and PDF exports
- Responsive UI

## Tech stack
- Next.js 14
- React 18
- TypeScript
- Prisma ORM 6
- SQLite
- Jest

## Local setup

Use Node.js compatible with the installed Next.js and Prisma versions.

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

3. Generate the Prisma client:

```bash
npm run db:generate
```

4. Apply the checked-in SQLite migration:

```bash
npm run db:migrate
```

5. Seed the illustrative emission factors:

```bash
npm run db:seed
```

6. Start the application:

```bash
npm run dev
```

Open http://localhost:3000.

The configured SQLite URL is `file:./dev.db`, resolved relative to `prisma/schema.prisma`. The local database is therefore created at `prisma/dev.db` and is ignored by Git.

## Database design

### CarbonCalculation

Stores a saved calculation, reporting month, input values, category totals, overall totals, vehicle method, timestamps, and the factor version used. The actual factor values used are also snapshotted on each calculation so historical records remain auditable if defaults change later.

### EmissionFactor

Stores each calculation factor, its unit, region label, version, and source note. The API loads the six required `DEFAULT` region factors from SQLite; it does not silently substitute hard-coded values if the database has not been seeded.

The current application is single-user/local and does not implement authentication or user ownership. Do not expose this database-backed deployment publicly with sensitive personal data until authentication and access controls are added.

## Calculation methodology

The seed script currently inserts illustrative prototype defaults:

| Activity | Factor |
|---|---:|
| Electricity | 0.70 kg CO₂e / kWh |
| Vehicle fuel | 2.31 kg CO₂e / litre |
| Car distance | 0.17 kg CO₂e / km |
| Public transport | 0.08 kg CO₂e / km |
| Flight | 0.25 kg CO₂e / km |
| Waste | 0.50 kg CO₂e / kg |

Household electricity is counted under energy. Vehicle fuel and car distance are counted under transport. The UI and API enforce one car calculation method per saved reporting period entry to prevent the same activity being counted twice.

These are not official or region-specific factors. The seed source note explicitly marks them as illustrative. Replace them with verified, documented factors before using the application for formal carbon accounting.

## Database commands

| Command | Purpose |
|---|---|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Apply/create local development migrations |
| `npm run db:seed` | Insert or update the illustrative emission factors |
| `npm run db:studio` | Open Prisma Studio to inspect local database records |

## Tests

Run the calculation and export unit tests:

```bash
npm test
```

The current automated tests cover calculation arithmetic, custom emission factors, vehicle-mode exclusivity, input validation, overflow handling, recommendation rules, and CSV/PDF export generation. API/database integration tests and a full production build should also be run after installing dependencies and initializing the local database.

## Browser UI tests

Playwright runs end-to-end tests against a production Next.js server in Chromium at desktop and mobile viewport sizes.

Run after installing dependencies, generating Prisma Client, applying migrations, seeding the factors, and building the app:

```bash
npx playwright install chromium
npm run test:e2e
```

The browser suite checks:
- Initial page and database-backed emission factor loading
- Vehicle distance/fuel mode switching
- Calculation results and category breakdown
- Saving a calculation and reloading persisted monthly history
- CSV and PDF download events and filenames
- User-visible save failure handling
- Mobile viewport overflow
- Native rejection of negative activity input

In GitHub Actions, Chromium is installed automatically and Playwright HTML reports, traces, screenshots, and videos are retained as artifacts when available.
