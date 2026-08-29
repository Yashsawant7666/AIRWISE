import random
from datetime import datetime, timezone

from sqlalchemy import create_engine, text

from config import DATABASE_URL


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


def create_replay_snapshot():

    print()
    print("========================================")
    print("        AIRWISE FARE REPLAY")
    print("========================================")


    # ========================================================
    # READ EXISTING FARE OBSERVATIONS
    # ========================================================

    read_query = text("""
        SELECT
            id,
            airline,
            origin,
            destination,
            total_fare

        FROM fare_observations

        WHERE
            total_fare IS NOT NULL
            AND total_fare > 0

        ORDER BY id
    """)


    with engine.connect() as connection:

        rows = (
            connection
            .execute(read_query)
            .mappings()
            .all()
        )


    if not rows:

        print()
        print(
            "No fare observations found."
        )

        return


    # ========================================================
    # SNAPSHOT TIME
    # ========================================================

    snapshot_time = datetime.now(
        timezone.utc
    )


    # ========================================================
    # INSERT QUERY
    # ========================================================

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
            'REPLAY'

        )
    """)


    inserted = 0


    # ========================================================
    # CREATE REPLAY SNAPSHOT
    # ========================================================

    with engine.begin() as connection:

        for row in rows:

            original_fare = float(
                row["total_fare"]
            )


            # ------------------------------------------------
            # Simulated airfare movement
            #
            # Small controlled variation: ±3%
            # ------------------------------------------------

            movement = random.uniform(
                -0.03,
                0.03
            )


            replay_fare = (
                original_fare *
                (1 + movement)
            )


            replay_fare = round(
                replay_fare,
                2
            )


            connection.execute(
                insert_query,
                {

                    "original_fare_id":
                        row["id"],

                    "snapshot_time":
                        snapshot_time,

                    "airline":
                        row["airline"],

                    "origin":
                        row["origin"],

                    "destination":
                        row["destination"],

                    "total_fare":
                        replay_fare

                }
            )


            inserted += 1


    # ========================================================
    # RESULT
    # ========================================================

    print()

    print(
        "Snapshot time:",
        snapshot_time.isoformat()
    )

    print(
        "Rows inserted:",
        inserted
    )

    print(
        "Mode: DEMO / REPLAY"
    )

    print()


if __name__ == "__main__":

    create_replay_snapshot()