# 🍔 # Burger Analytics Dashboard

An interactive analytics dashboard for a multi-outlet burger business, built on a ~300,000-row Excel export of order line items.

**Live app:** https://burger-analytics-dashboard.onrender.com/
(Hosted on Render's free tier, so the first load after inactivity can take about 50 seconds while the service wakes up.)

**Stack:** React (Vite) · FastAPI · DuckDB · SQL

---

## Features

- **KPIs:** total revenue, total orders, average order value (AOV), number of outlets
- **Visualizations:** daily revenue trend, revenue and orders by outlet, top products by revenue
- **Filters:** Group (menu category), Order Type, Brand. All KPIs and charts update together
- **Business insights:** short observations generated from the currently filtered data

---

## Setup and run locally

**Prerequisites:** Python 3.10+, Node.js 18+

```bash
# 1. Backend
cd backend
pip install fastapi uvicorn duckdb pandas openpyxl
python etl.py                # optional: rebuilds data/analytics.duckdb from data.xlsx
uvicorn app:app --reload     # API at http://localhost:8000

# 2. Frontend (new terminal)
cd frontend-app
npm install
npm run dev                  # app at http://localhost:5173
```

The prebuilt `data/analytics.duckdb` is committed, so you can skip the ETL step and run the app straight away. To rebuild it, place `data.xlsx` where `etl.py` expects it and run the script.

---

## Architecture

```
data.xlsx ──(etl.py, run once)──▶ analytics.duckdb ──▶ FastAPI (SQL aggregations) ──▶ React dashboard
```

| Layer | Responsibility |
|---|---|
| `backend/etl.py` | Reads the Excel file, cleans types, computes line revenue, writes a DuckDB table |
| `data/analytics.duckdb` | Embedded columnar database holding the cleaned line items |
| `backend/app.py` | FastAPI endpoints. Each request translates the active filters into a parameterised SQL query and returns aggregated JSON |
| `frontend-app/` | React app: filter controls, KPI cards, charts, insights |
| `backend/test_queries.py` | Sanity checks on the aggregate queries |

### How the data is processed

1. **One-time ETL.** Parsing the Excel file takes roughly 40 seconds, which is far too slow to do per request or even per server start. The ETL converts it once into a DuckDB file.
2. **Aggregate in SQL, not in the browser.** The API returns only small, aggregated result sets (a few dozen rows per chart) instead of 300K raw rows, so page loads stay fast and the browser never holds the full dataset.
3. **Filters map to `WHERE` clauses.** Every filter change triggers one round of aggregate queries against DuckDB.

### Why DuckDB (and why a database at all)

| Option | Why I didn't pick it |
|---|---|
| Read the Excel file on each request | About 40s per read. Unusable |
| Load everything into pandas at startup | Works, but slow cold starts and higher memory use on a small free instance. Every query is also hand-written dataframe code |
| PostgreSQL / MySQL | Needs a separate hosted database server, extra cost and setup, for a dataset that is read-only and fits comfortably on one machine |
| **DuckDB (chosen)** | Embedded (no server to run), columnar storage that is very fast for `GROUP BY` / `SUM` over a few hundred thousand rows, plain SQL, and the whole database is a single file that deploys with the app |

---

## Metric definitions

The file has one row per **line item**, so a single order (`BillNo`) spans several rows. Metrics are defined to avoid double counting:

- **Revenue** = `SUM(Price × Quantity)` across line items
- **Orders** = `COUNT(DISTINCT BillNo)`, not the row count
- **AOV** = Revenue ÷ Orders
- **Records** = raw row count (line items)

---

## Key trade-offs and assumptions

- **Pre-built database over live ETL.** The `.duckdb` file is committed so deployment needs no build-time ETL. The cost is a slightly larger repository and a database that is only as fresh as the last ETL run. That is acceptable for a static export.
- **Read-only, single-instance design.** There are no writes, so DuckDB's single-process model is not a constraint. Scaling out to many instances or live data would call for a client-server database.
- **Free-priced rows are kept.** Some line items have a price of 0 (for example complimentary dips). They count towards quantities and records but add 0 revenue.
- **Timestamps** are parsed as `DD-MM-YYYY HH:MM:SS`. Partial months at the start and end of the data range are included as-is, so month-level comparisons at the edges should be read with care.
- **Brand filter.** The dataset contains a single brand, so this filter has no effect on the numbers. It is kept for compatibility with multi-brand data.
- **Free-tier hosting.** Cold starts on Render's free plan are the main performance caveat. Once warm, queries return quickly.

---

## Possible improvements

- Date-range picker and outlet / settlement filters
- Data export (CSV) of the filtered view
- Response caching for repeated filter combinations
- Hour-of-day and weekday heatmaps for peak-time analysis
- Authentication and a responsive mobile layout

---

## Deployment

The app is deployed on **Render**. The FastAPI service serves the API, and the built React app is served as static files. The deployed URL is at the top of this README.
