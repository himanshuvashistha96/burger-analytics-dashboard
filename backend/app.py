from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import duckdb
from pathlib import Path

app = FastAPI(title="Burger Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = Path(__file__).resolve().parent.parent / "data" / "analytics.duckdb"


def query_db(sql, params=None):
    con = duckdb.connect(str(DB), read_only=True)
    result = con.execute(sql, params or []).fetchdf()
    con.close()
    return result.to_dict(orient="records")


# ---------------------------------------------------------
# BUILD FILTERS
# ---------------------------------------------------------

def build_filters(group=None, order_type=None, brand=None):
    conditions = []
    params = []

    if group:
        conditions.append('"Group" = ?')
        params.append(group)

    if order_type:
        conditions.append('Order_Type = ?')
        params.append(order_type)

    if brand:
        conditions.append('Brand = ?')
        params.append(brand)

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    else:
        where_clause = ""

    return where_clause, params


# ---------------------------------------------------------
# HOME
# ---------------------------------------------------------

@app.get("/")
def home():
    return {"message": "Burger Analytics API is running"}


# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------

@app.get("/api/summary")
def summary(
    group: str | None = None,
    order_type: str | None = None,
    brand: str | None = None
):
    where_clause, params = build_filters(
        group,
        order_type,
        brand
    )

    return query_db(
        f"""
        SELECT
            COUNT(*) AS total_records,
            COUNT(DISTINCT BillNo) AS total_orders,
            ROUND(SUM(Revenue), 2) AS total_revenue,
            SUM(Quantity) AS items_sold,
            COUNT(DISTINCT Outlet_Name) AS outlets,
            ROUND(
                SUM(Revenue) / NULLIF(COUNT(DISTINCT BillNo), 0),
                2
            ) AS average_order_value
        FROM orders
        {where_clause}
        """,
        params
    )[0]


# ---------------------------------------------------------
# REVENUE TREND
# ---------------------------------------------------------

@app.get("/api/revenue-trend")
def revenue_trend(
    group: str | None = None,
    order_type: str | None = None,
    brand: str | None = None
):
    where_clause, params = build_filters(
        group,
        order_type,
        brand
    )

    return query_db(
        f"""
        SELECT
            CAST(Order_Datetime AS DATE) AS date,
            ROUND(SUM(Revenue), 2) AS revenue
        FROM orders
        {where_clause}
        GROUP BY CAST(Order_Datetime AS DATE)
        ORDER BY date
        """,
        params
    )


# ---------------------------------------------------------
# OUTLETS
# ---------------------------------------------------------

@app.get("/api/outlets")
def outlets(
    group: str | None = None,
    order_type: str | None = None,
    brand: str | None = None
):
    where_clause, params = build_filters(
        group,
        order_type,
        brand
    )

    return query_db(
        f"""
        SELECT
            Outlet_Name AS outlet,
            ROUND(SUM(Revenue), 2) AS revenue,
            COUNT(DISTINCT BillNo) AS orders
        FROM orders
        {where_clause}
        GROUP BY Outlet_Name
        ORDER BY revenue DESC
        """,
        params
    )


# ---------------------------------------------------------
# GROUPS
# ---------------------------------------------------------

@app.get("/api/groups")
def groups(
    order_type: str | None = None,
    brand: str | None = None
):
    conditions = []
    params = []

    if order_type:
        conditions.append("Order_Type = ?")
        params.append(order_type)

    if brand:
        conditions.append("Brand = ?")
        params.append(brand)

    where_clause = (
        "WHERE " + " AND ".join(conditions)
        if conditions
        else ""
    )

    return query_db(
        f"""
        SELECT
            "Group" AS category,
            ROUND(SUM(Revenue), 2) AS revenue,
            SUM(Quantity) AS quantity
        FROM orders
        {where_clause}
        GROUP BY "Group"
        ORDER BY revenue DESC
        """,
        params
    )


# ---------------------------------------------------------
# ORDER TYPES
# ---------------------------------------------------------

@app.get("/api/order-types")
def order_types(
    group: str | None = None,
    brand: str | None = None
):
    conditions = []
    params = []

    if group:
        conditions.append('"Group" = ?')
        params.append(group)

    if brand:
        conditions.append("Brand = ?")
        params.append(brand)

    where_clause = (
        "WHERE " + " AND ".join(conditions)
        if conditions
        else ""
    )

    return query_db(
        f"""
        SELECT
            Order_Type AS order_type,
            COUNT(DISTINCT BillNo) AS orders,
            ROUND(SUM(Revenue), 2) AS revenue
        FROM orders
        {where_clause}
        GROUP BY Order_Type
        ORDER BY revenue DESC
        """,
        params
    )


# ---------------------------------------------------------
# PRODUCTS
# ---------------------------------------------------------

@app.get("/api/products")
def products(
    group: str | None = None,
    order_type: str | None = None,
    brand: str | None = None
):
    where_clause, params = build_filters(
        group,
        order_type,
        brand
    )

    return query_db(
        f"""
        SELECT
            Item AS product,
            SUM(Quantity) AS quantity,
            ROUND(SUM(Revenue), 2) AS revenue
        FROM orders
        {where_clause}
        GROUP BY Item
        ORDER BY revenue DESC
        LIMIT 10
        """,
        params
    )


# ---------------------------------------------------------
# FILTER OPTIONS
# ---------------------------------------------------------

@app.get("/api/filters")
def filters():
    return {
        "outlets": query_db("""
            SELECT DISTINCT Outlet_Name AS value
            FROM orders
            ORDER BY value
        """),

        "groups": query_db("""
            SELECT DISTINCT "Group" AS value
            FROM orders
            ORDER BY value
        """),

        "order_types": query_db("""
            SELECT DISTINCT Order_Type AS value
            FROM orders
            ORDER BY value
        """),

        "brands": query_db("""
            SELECT DISTINCT Brand AS value
            FROM orders
            ORDER BY value
        """)
    }