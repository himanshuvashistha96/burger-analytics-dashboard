import duckdb
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "data" / "analytics.duckdb"

con = duckdb.connect(str(DB), read_only=True)

queries = {
    "SUMMARY": """
        SELECT
            COUNT(*) AS total_records,
            COUNT(DISTINCT BillNo) AS total_orders,
            ROUND(SUM(Revenue), 2) AS total_revenue,
            SUM(Quantity) AS items_sold,
            COUNT(DISTINCT Outlet_Name) AS outlets
        FROM orders
    """,

    "REVENUE BY OUTLET": """
        SELECT
            Outlet_Name,
            ROUND(SUM(Revenue), 2) AS revenue,
            COUNT(DISTINCT BillNo) AS orders
        FROM orders
        GROUP BY Outlet_Name
        ORDER BY revenue DESC
    """,

    "REVENUE BY GROUP": """
        SELECT
            "Group",
            ROUND(SUM(Revenue), 2) AS revenue
        FROM orders
        GROUP BY "Group"
        ORDER BY revenue DESC
    """,

    "ORDER TYPE": """
        SELECT
            Order_Type,
            COUNT(DISTINCT BillNo) AS orders,
            ROUND(SUM(Revenue), 2) AS revenue
        FROM orders
        GROUP BY Order_Type
        ORDER BY revenue DESC
    """,

    "TOP PRODUCTS": """
        SELECT
            Item,
            SUM(Quantity) AS quantity_sold,
            ROUND(SUM(Revenue), 2) AS revenue
        FROM orders
        GROUP BY Item
        ORDER BY revenue DESC
        LIMIT 10
    """
}

for name, query in queries.items():
    print(f"\n========== {name} ==========")
    print(con.execute(query).df().to_string(index=False))

con.close()