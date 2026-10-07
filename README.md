# 🍔 Burger Analytics Dashboard

An interactive analytics dashboard for a multi-outlet burger business, built on a ~300,000-row Excel export of order line items.

**Live app:** https://burger-analytics-dashboard.onrender.com/
**GitHub:** https://github.com/himanshuvashistha96/burger-analytics-dashboard

> Hosted on Render's free tier. The backend may take up to about one minute to wake up after a period of inactivity.

**Stack:** React (Vite) · FastAPI · DuckDB · SQL

---

## Features

- **KPIs:** Total Revenue, Total Orders, Average Order Value (AOV), Number of Outlets
- **Visualizations:** Daily Revenue Trend, Revenue and Orders by Outlet, Top Products by Revenue
- **Filters:** Group (menu category), Order Type, Brand. All KPIs and charts update together
- **Business Insights:** Short observations generated from the currently filtered data
- Works with ~300,000 records without loading the full dataset into the browser

---

## Setup and Run Locally

**Prerequisites:** Python 3.10+, Node.js 18+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload        # API at http://localhost:8000
```

The prebuilt database `data/analytics.duckdb` is committed, so no ETL is needed to run the app. To rebuild it from the original Excel file, place `data.xlsx` where `etl.py` expects it and run `python etl.py`.

### 2. Frontend

```bash
cd frontend-app
npm install
npm run dev                     # app at http://localhost:5173
```

---

## Project Structure

```
burger-analytics-dashboard/
├── backend/
│   ├── app.py              # FastAPI endpoints (SQL aggregations)
│   ├── etl.py              # Excel -> DuckDB loader (run once)
│   └── test_queries.py     # Sanity checks on aggregate queries
├── data/
│   └── analytics.duckdb    # Cleaned data, ready to query
├── frontend-app/           # React (Vite) dashboard
│   └── src/ (App.jsx, App.css, index.css, main.jsx)
├── .gitignore
└── README.md
```

---

## Architecture and Data Handling

```
data.xlsx --(etl.py, run once)--> analytics.duckdb --> FastAPI (SQL) --> React dashboard
```

1. **One-time ETL.** Parsing the Excel file takes about 40 seconds, which is far too slow per request or per server start. `etl.py` converts it once into a DuckDB file.
2. **Aggregate in SQL, not in the browser.** The API returns small aggregated result sets (a few dozen rows per chart) instead of 300K raw rows, so page loads stay fast.
3. **Filters map to `WHERE` clauses.** Each filter change runs a set of aggregate queries against DuckDB and the dashboard refreshes from the response.

### Why DuckDB

| Option | Why not |
|---|---|
| Read the Excel file on each request | About 40s per read. Unusable |
| Load everything into pandas at startup | Slow cold starts, higher memory use on a small free instance, and every query is hand-written dataframe code |
| PostgreSQL / MySQL | Needs a separate hosted database server, extra cost and setup, for a read-only dataset that fits on one machine |
| **DuckDB (chosen)** | Embedded (no server to run), columnar storage that is very fast for `GROUP BY` / `SUM` on a few hundred thousand rows, plain SQL, and the database is a single file that deploys with the app |

---

## Metric Definitions

The file has one row per **line item**, so one order (`BillNo`) spans several rows. Metrics are defined to avoid double counting:

- **Revenue** = `SUM(Price x Quantity)` across line items
- **Orders** = `COUNT(DISTINCT BillNo)`, not the row count
- **AOV** = Revenue / Orders

---

## Key Trade-offs and Assumptions

- **Pre-built database over live ETL.** The `.duckdb` file is committed so deployment needs no build-time ETL. The cost is a larger repository and data that is only as fresh as the last ETL run, which is fine for a static export.
- **Read-only, single-instance design.** There are no writes, so DuckDB's single-process model is not a constraint. Live data or many instances would call for a client-server database.
- **Free-priced rows are kept.** Some line items have a price of 0 (for example complimentary dips). They count towards quantities but add 0 revenue.
- **Partial months.** The data runs from mid-June 2025 to mid-June 2026, so the first and last months are partial. Compare them with care.
- **Brand filter.** The dataset contains a single brand, so this filter does not change the numbers.
- **Free-tier hosting.** Cold starts on Render's free plan are the main performance caveat. Once warm, queries return quickly.

---


## Deployment

Deployed on **Render** (free tier): https://burger-analytics-dashboard.onrender.com/
- Backend API: https://burger-analytics-api.onrender.com/
