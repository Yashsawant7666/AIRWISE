import os
import sys

from pathlib import Path

from sqlalchemy import (
    create_engine,
    text,
    inspect
)

from dotenv import load_dotenv


# ============================================================
# PATH SETUP
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent


if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_DIR)
    )


# ============================================================
# LOAD LOCAL ENVIRONMENT
# ============================================================

load_dotenv(
    PROJECT_ROOT / ".env"
)


# ============================================================
# LOCAL DATABASE
# ============================================================

from config import DATABASE_URL as LOCAL_DATABASE_URL


# ============================================================
# SUPABASE DATABASE URL
# ============================================================
#
# Put your Supabase PostgreSQL connection string
# in .env as:
#
# SUPABASE_DATABASE_URL=postgresql://...
#
# ============================================================

SUPABASE_DATABASE_URL = os.getenv(
    "SUPABASE_DATABASE_URL"
)


if not SUPABASE_DATABASE_URL:

    raise RuntimeError(
        "\nSUPABASE_DATABASE_URL is missing.\n\n"
        "Open AIRWISE/.env and add:\n\n"
        "SUPABASE_DATABASE_URL=YOUR_SUPABASE_DATABASE_URL\n"
    )


# ============================================================
# ENGINES
# ============================================================

print()
print("========================================")
print("AIRWISE DATABASE MIGRATION")
print("========================================")


print()
print("Connecting to local PostgreSQL...")


local_engine = create_engine(
    LOCAL_DATABASE_URL,
    pool_pre_ping=True
)


try:

    with local_engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )

    print(
        "Local PostgreSQL connection successful!"
    )

except Exception as error:

    print(
        "Local PostgreSQL connection failed!"
    )

    print(error)

    raise


print()
print("Connecting to Supabase PostgreSQL...")


supabase_engine = create_engine(
    SUPABASE_DATABASE_URL,
    pool_pre_ping=True
)


try:

    with supabase_engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )

    print(
        "Supabase PostgreSQL connection successful!"
    )

except Exception as error:

    print(
        "Supabase PostgreSQL connection failed!"
    )

    print(error)

    raise


# ============================================================
# READ LOCAL TABLE
# ============================================================

print()
print("Reading local fare_observations...")


with local_engine.connect() as connection:

    local_rows = (
        connection
        .execute(
            text("""
                SELECT *
                FROM fare_observations
                ORDER BY id
            """)
        )
        .mappings()
        .all()
    )


print(
    "Local rows:",
    len(local_rows)
)


if not local_rows:

    raise RuntimeError(
        "No rows found in local fare_observations."
    )


# ============================================================
# GET COLUMNS
# ============================================================

columns = list(
    local_rows[0].keys()
)


print()
print("Columns found:")

for column in columns:

    print(
        " -",
        column
    )


# ============================================================
# CREATE SUPABASE TABLE
# ============================================================

print()
print(
    "Checking Supabase fare_observations table..."
)


inspector = inspect(
    supabase_engine
)


table_exists = inspector.has_table(
    "fare_observations"
)


# ------------------------------------------------------------
# CREATE TABLE
# ------------------------------------------------------------

if not table_exists:

    print(
        "Table does not exist."
    )

    print(
        "Creating fare_observations..."
    )


    with supabase_engine.begin() as connection:

        connection.execute(
            text("""
                CREATE TABLE fare_observations (
                    id INTEGER PRIMARY KEY,

                    airline TEXT,
                    origin TEXT,
                    destination TEXT,

                    booking_timestamp TIMESTAMP NULL,
                    departure_date DATE NULL,
                    departure_time TIME NULL,

                    advance_days INTEGER NULL,

                    cabin_class TEXT,
                    fare_class TEXT,

                    stops INTEGER NULL,

                    base_fare DOUBLE PRECISION NULL,
                    taxes DOUBLE PRECISION NULL,
                    fees DOUBLE PRECISION NULL,
                    total_fare DOUBLE PRECISION NULL,

                    currency TEXT NULL,

                    source TEXT NULL,

                    fare_fingerprint TEXT NULL,

                    expected_fare DOUBLE PRECISION NULL,

                    fare_difference DOUBLE PRECISION NULL,

                    fare_difference_percent DOUBLE PRECISION NULL,

                    group_mean DOUBLE PRECISION NULL,

                    group_std DOUBLE PRECISION NULL,

                    z_score DOUBLE PRECISION NULL,

                    anomaly_score DOUBLE PRECISION NULL,

                    anomaly_status TEXT NULL,

                    recommendation TEXT NULL,

                    recommendation_reason TEXT NULL
                )
            """)
        )


    print(
        "Supabase table created successfully."
    )

else:

    print(
        "fare_observations already exists."
    )


# ============================================================
# CLEAR EXISTING DATA
# ============================================================

print()
print(
    "Clearing existing Supabase fare data..."
)


with supabase_engine.begin() as connection:

    connection.execute(
        text(
            "DELETE FROM fare_observations"
        )
    )


print(
    "Existing Supabase fare data cleared."
)


# ============================================================
# INSERT DATA
# ============================================================

print()
print(
    "Copying rows to Supabase..."
)


inserted = 0


insert_query = text("""
    INSERT INTO fare_observations (
        id,
        airline,
        origin,
        destination,
        booking_timestamp,
        departure_date,
        departure_time,
        advance_days,
        cabin_class,
        fare_class,
        stops,
        base_fare,
        taxes,
        fees,
        total_fare,
        currency,
        source,
        fare_fingerprint,
        expected_fare,
        fare_difference,
        fare_difference_percent,
        group_mean,
        group_std,
        z_score,
        anomaly_score,
        anomaly_status,
        recommendation,
        recommendation_reason
    )

    VALUES (
        :id,
        :airline,
        :origin,
        :destination,
        :booking_timestamp,
        :departure_date,
        :departure_time,
        :advance_days,
        :cabin_class,
        :fare_class,
        :stops,
        :base_fare,
        :taxes,
        :fees,
        :total_fare,
        :currency,
        :source,
        :fare_fingerprint,
        :expected_fare,
        :fare_difference,
        :fare_difference_percent,
        :group_mean,
        :group_std,
        :z_score,
        :anomaly_score,
        :anomaly_status,
        :recommendation,
        :recommendation_reason
    )
""")


with supabase_engine.begin() as connection:

    for row in local_rows:

        connection.execute(
            insert_query,
            dict(row)
        )

        inserted += 1


print(
    "Rows inserted:",
    inserted
)


# ============================================================
# VERIFY
# ============================================================

print()
print(
    "Verifying Supabase data..."
)


with supabase_engine.connect() as connection:

    count = connection.execute(
        text("""
            SELECT COUNT(*)
            FROM fare_observations
        """)
    ).scalar()


print(
    "Supabase rows:",
    count
)


# ============================================================
# FINAL CHECK
# ============================================================

if count != len(local_rows):

    raise RuntimeError(
        f"Migration mismatch: "
        f"local={len(local_rows)}, "
        f"supabase={count}"
    )


print()
print("========================================")
print("MIGRATION COMPLETED SUCCESSFULLY")
print("========================================")

print()
print(
    f"Transferred {count} fare observations."
)

print()