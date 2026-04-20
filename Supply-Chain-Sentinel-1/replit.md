# MSME Supply Chain Risk Predictor

## Overview

A full-stack supply chain risk management web application for MSMEs. Monitors supplier performance, delivery timelines, demand trends, and raw material cost fluctuations in real time.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS
- **Charts**: Recharts
- **Routing**: Wouter
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

1. **Historical Orders Analysis** — Upload/input CSV, view demand trends via line charts
2. **Supplier Performance Scoring** — Score suppliers 0-100 based on on-time delivery, defect rate, response time
3. **Delivery Timeline Tracker** — Flag delayed/at-risk deliveries with Red/Yellow/Green risk indicators
4. **Demand Forecasting** — 30-day forecast based on historical order data with trend analysis
5. **Currency Alerts** — Raw material cost fluctuation alerts via Open Exchange Rates API (optional)
6. **CSV Upload** — Bulk import orders, suppliers, or deliveries

## Pages

- `/` — Dashboard with summary cards, demand trend chart, supplier risk bar chart
- `/suppliers` — Supplier list with risk scores and filtering
- `/orders` — Historical orders with demand trend visualization
- `/deliveries` — Delivery tracker with delay flags
- `/forecast` — 30-day demand prediction chart
- `/alerts` — Risk alerts management center
- `/upload` — CSV bulk import

## API Endpoints

- `GET /api/dashboard-summary` — Aggregated metrics
- `GET /api/risks` — Risk scores per supplier
- `GET /api/suppliers` — All suppliers
- `POST /api/suppliers` — Create supplier
- `GET /api/orders` — Historical orders
- `POST /api/orders` — Create order
- `GET /api/demand-trends` — Monthly demand aggregation
- `GET /api/deliveries` — Delivery list with risk flags
- `POST /api/deliveries` — Log delivery
- `GET /api/forecast` — 30-day demand forecast
- `GET /api/alerts` — Active risk alerts
- `GET /api/currency-rates` — Currency rates (mock + live via OXR_APP_ID env var)
- `POST /api/upload` — CSV import

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Schema

- `suppliers` — Supplier records with reliability scoring
- `orders` — Historical purchase orders
- `deliveries` — Delivery tracking with risk computation
- `alerts` — Risk alerts (delay_risk, supplier_risk, demand_spike, cost_alert, low_stock)

## Notes

- The api-zod `src/index.ts` must only export from `./generated/api` (not `./generated/types`) to avoid duplicate export conflicts after codegen. Re-fix after running codegen.
- Open Exchange Rates: Set `OXR_APP_ID` environment variable for live currency data; falls back to mock rates.
- Risk scoring uses weighted formula: 50% on-time delivery rate + 30% defect score + 20% response time score.
