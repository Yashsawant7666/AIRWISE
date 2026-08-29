import os
import sys
import pandas as pd
from sqlalchemy import create_engine

# ==========================================
# PROJECT PATH
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

# Allow importing backend config.py
sys.path.append(
    os.path.join(BASE_DIR, "backend")
)

from config import DATABASE_URL


# ==========================================
# FILE PATH
# ==========================================

CSV_FILE = os.path.join(
    BASE_DIR,
    "datasets",
    "airfare_cleaned.csv"
)

TABLE_NAME = "fare_observations"


# ==========================================
# START
# ==========================================

print("\n========================================")
print("AIRWISE CSV → POSTGRESQL")
print("========================================")


# ==========================================
# CHECK CSV
# ==========================================

if not os.path.exists(CSV_FILE):
    print("\nERROR: airfare_cleaned.csv not found!")
    print("Expected location:")
    print(CSV_FILE)
    sys.exit(1)


# ==========================================
# LOAD CSV
# ==========================================

print("\nLoading cleaned dataset...")

df = pd.read_csv(CSV_FILE)

print("Rows loaded:", len(df))
print("Columns:", len(df.columns))


# ==========================================
# CONVERT DATE/TIME COLUMNS
# ==========================================

print("\nConverting date/time columns...")

if "booking_timestamp" in df.columns:
    df["booking_timestamp"] = pd.to_datetime(
        df["booking_timestamp"],
        errors="coerce"
    )

if "departure_date" in df.columns:
    df["departure_date"] = pd.to_datetime(
        df["departure_date"],
        errors="coerce"
    ).dt.date

if "collected_at" in df.columns:
    df["collected_at"] = pd.to_datetime(
        df["collected_at"],
        errors="coerce"
    )

if "departure_time" in df.columns:
    df["departure_time"] = pd.to_datetime(
        df["departure_time"],
        format="%H:%M",
        errors="coerce"
    ).dt.time


# ==========================================
# CONNECT DATABASE
# ==========================================

print("\nConnecting to PostgreSQL...")

try:

    engine = create_engine(DATABASE_URL)

    with engine.connect() as connection:
        print("Database connection successful!")

except Exception as e:

    print("\nDATABASE CONNECTION FAILED!")
    print(e)
    sys.exit(1)


# ==========================================
# INSERT DATA
# ==========================================

print("\nUploading data to PostgreSQL...")

try:

    df.to_sql(
        TABLE_NAME,
        engine,
        if_exists="append",
        index=False
    )

    print("\n========================================")
    print("UPLOAD SUCCESSFUL")
    print("========================================")

    print(
        f"{len(df)} records inserted into "
        f"{TABLE_NAME}"
    )

except Exception as e:

    print("\nUPLOAD FAILED!")
    print(e)
    sys.exit(1)


# ==========================================
# FINISH
# ==========================================

print("\nAIRWISE DATA LOAD COMPLETE!")