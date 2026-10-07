import pandas as pd
import duckdb
from pathlib import Path

# File locations
BASE_DIR = Path(__file__).resolve().parent.parent
EXCEL_FILE = BASE_DIR / "data" / "data.xlsx"
DATABASE_FILE = BASE_DIR / "data" / "analytics.duckdb"

print("Loading Excel file...")
df = pd.read_excel(EXCEL_FILE)

print(f"Rows loaded: {len(df):,}")
print(f"Columns: {list(df.columns)}")

# Convert date column
df["Order_Datetime"] = pd.to_datetime(
    df["Order_Datetime"],
    format="%d-%m-%Y %H:%M:%S"
)

# Calculate revenue for each line item
df["Revenue"] = df["Price"] * df["Quantity"]

# Basic validation
print("\n--- Data Validation ---")
print(f"Missing values: {df.isna().sum().sum():,}")
print(f"Duplicate rows: {df.duplicated().sum():,}")
print(f"Unique orders: {df['BillNo'].nunique():,}")
print(f"Total revenue: ₹{df['Revenue'].sum():,.2f}")

# Create DuckDB database
print("\nCreating DuckDB database...")

con = duckdb.connect(str(DATABASE_FILE))

con.register("orders_df", df)

con.execute("""
    CREATE OR REPLACE TABLE orders AS
    SELECT *
    FROM orders_df
""")

con.close()

print(f"\nDatabase created successfully:")
print(DATABASE_FILE)