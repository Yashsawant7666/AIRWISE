import os
import sys

from sqlalchemy import create_engine, text


# ============================================================
# PATH SETUP
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

BACKEND_DIR = os.path.join(
    BASE_DIR,
    "backend"
)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ============================================================
# DATABASE URLS
# ============================================================

from config import DATABASE_URL as LOCAL_DATABASE_URL


SUPABASE_DATABASE_URL = os.getenv(
    "SUPABASE_DATABASE_URL"
)


if not SUPABASE_DATABASE_URL:

    print()
    print("========================================")
    print("SUPABASE DATABASE URL MISSING")
    print("========================================")
    print()

    sys.exit(1)


# ============================================================
# ENGINES
# ============================================================

local_engine = create_engine(
    LOCAL_DATABASE_URL,
    pool_pre_ping=True
)

supabase_engine = create_engine(
    SUPABASE_DATABASE_URL,
    pool_pre_ping=True
)


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("========================================")
    print(" AIRWISE REPLAY DATA MIGRATION")
    print("========================================")


    # ========================================================
    # LOCAL CONNECTION
    # ========================================================

    print()
    print("Connecting to local PostgreSQL...")


    with local_engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )


    print(
        "Local PostgreSQL connection successful!"
    )


    # ========================================================
    # SUPABASE CONNECTION
    # ========================================================

    print()
    print("Connecting to Supabase...")


    with supabase_engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )


    print(
        "Supabase PostgreSQL connection successful!"
    )


    # ========================================================
    # READ LOCAL REPLAY DATA
    # ========================================================

    print()
    print(
        "Reading local replay observations..."
    )


    select_query = text("""
        SELECT

            original_fare_id,
            snapshot_time,
            airline,
            origin,
            destination,
            total_fare,
            source_mode

        FROM airfare_replay_observations

        ORDER BY
            snapshot_time ASC,
            id ASC
    """)


    with local_engine.connect() as connection:

        rows = (
            connection
            .execute(select_query)
            .mappings()
            .all()
        )


    print(
        "Local replay rows:",
        len(rows)
    )


    if not rows:

        print(
            "No local replay observations found."
        )

        return


    # ========================================================
    # CREATE TABLE
    # ========================================================

    create_table_query = text("""
        CREATE TABLE IF NOT EXISTS
        airfare_replay_observations (

            id BIGSERIAL PRIMARY KEY,

            original_fare_id INTEGER,

            snapshot_time TIMESTAMPTZ NOT NULL,

            airline VARCHAR(100),

            origin VARCHAR(10),

            destination VARCHAR(10),

            total_fare DOUBLE PRECISION NOT NULL,

            source_mode VARCHAR(30)
                DEFAULT 'DEMO_REPLAY'

        )
    """)


    with supabase_engine.begin() as connection:

        connection.execute(
            create_table_query
        )


    print(
        "Supabase replay table ready."
    )


    # ========================================================
    # CLEAR OLD DATA
    # ========================================================

    with supabase_engine.begin() as connection:

        connection.execute(
            text(
                "TRUNCATE TABLE "
                "airfare_replay_observations "
                "RESTART IDENTITY"
            )
        )


    print(
        "Existing Supabase replay data cleared."
    )


    # ========================================================
    # BULK INSERT
    # ========================================================

    print()
    print(
        "Copying replay data to Supabase..."
    )

    print(
        "Preparing",
        len(rows),
        "rows..."
    )


    insert_query = text("""
        INSERT INTO airfare_replay_observations (

            original_fare_id,
            snapshot_time,
            airline,
            origin,
            destination,
            total_fare,
            source_mode

        )

        VALUES (

            :original_fare_id,
            :snapshot_time,
            :airline,
            :origin,
            :destination,
            :total_fare,
            :source_mode

        )
    """)


    # Convert mappings into normal dictionaries.
    # This allows SQLAlchemy to perform executemany.

    data = [

        {

            "original_fare_id":
                row["original_fare_id"],

            "snapshot_time":
                row["snapshot_time"],

            "airline":
                row["airline"],

            "origin":
                row["origin"],

            "destination":
                row["destination"],

            "total_fare":
                row["total_fare"],

            "source_mode":
                row["source_mode"]

        }

        for row in rows

    ]


    # --------------------------------------------------------
    # Insert in chunks
    # --------------------------------------------------------

    chunk_size = 250

    inserted = 0


    with supabase_engine.begin() as connection:

        for start in range(
            0,
            len(data),
            chunk_size
        ):

            chunk = data[
                start:start + chunk_size
            ]


            connection.execute(
                insert_query,
                chunk
            )


            inserted += len(chunk)


            print(
                f"Inserted {inserted} / {len(data)}"
            )


    # ========================================================
    # VERIFY
    # ========================================================

    count_query = text("""
        SELECT COUNT(*)
        FROM airfare_replay_observations
    """)


    with supabase_engine.connect() as connection:

        count = connection.execute(
            count_query
        ).scalar()


    # ========================================================
    # SNAPSHOT PERIOD COUNT
    # ========================================================

    period_query = text("""
        SELECT COUNT(DISTINCT snapshot_time)
        FROM airfare_replay_observations
    """)


    with supabase_engine.connect() as connection:

        periods = connection.execute(
            period_query
        ).scalar()


    # ========================================================
    # FINAL RESULT
    # ========================================================

    print()
    print("========================================")
    print("MIGRATION COMPLETED SUCCESSFULLY")
    print("========================================")

    print(
        "Rows inserted:",
        inserted
    )

    print(
        "Supabase replay rows:",
        count
    )

    print(
        "Snapshot periods:",
        periods
    )

    print()


if __name__ == "__main__":

    main()