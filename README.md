# 🍔 Burger Analytics Dashboard

An interactive business intelligence dashboard built to analyze sales, orders, products, outlets, and ordering behavior for a multi-outlet burger business.

The project combines a **React frontend**, **FastAPI backend**, **DuckDB database**, and **SQL-based analytics** to provide an interactive analytics experience with dynamic filtering.

---

## 📊 Dashboard Preview

The dashboard provides an overview of:

- Total Revenue
- Total Orders
- Average Order Value
- Outlet Performance
- Revenue Trends
- Top Products
- Business Insights

Users can dynamically filter the dashboard by:

- Product Group
- Order Type
- Brand

All major dashboard metrics update based on the selected filters.

---

## 🚀 Key Features

### Business Performance Overview
- Total revenue
- Total orders
- Average order value
- Number of outlets

### Revenue Analysis
- Daily revenue trend
- Revenue comparison across filtered datasets

### Product Analysis
- Top revenue-generating products
- Product quantity and revenue analysis

### Outlet Analysis
- Revenue by outlet
- Orders by outlet
- Outlet-level performance comparison

### Dynamic Filtering
Filters are connected directly to the backend API and SQL queries.

Supported filters:

- Group
- Order Type
- Brand

### Business Insights
The dashboard automatically presents key observations based on the filtered dataset.

---

## 🛠️ Tech Stack

### Frontend
- React
- JavaScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- Uvicorn
- DuckDB

### Data & Analytics
- SQL
- DuckDB
- Pandas

### Development Tools
- VS Code
- Git
- GitHub

---

## 🏗️ Project Architecture

```text
burger-analytics-dashboard/
│
├── backend/
│   ├── app.py
│   ├── etl.py
│   └── test_queries.py
│
├── data/
│   └── analytics.duckdb
│
├── frontend-app/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── frontend/
├── .gitignore
└── README.md
