import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, text

from config import DATABASE_URL


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


def create_demo_history():

    print()
    print("========================================")
    print("AIRWISE DEMO HISTORICAL DATA")
    print("========================================")


    # --------------------------------------------------------
    # Read original fares
    # --------------------------------------------------------

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

        print(
            "No fare observations found."
        )

        return


    # --------------------------------------------------------
    # Clear old replay data
    # --------------------------------------------------------

    with engine.begin() as connection:

        connection.execute(
            text(
                "DELETE FROM airfare_replay_observations"
            )
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
            'DEMO_REPLAY'

        )
    """)


    # --------------------------------------------------------
    # Create 25 hourly snapshots
    # --------------------------------------------------------

    now = datetime.now(
        timezone.utc
    )


    base_time = (
        now
        .replace(
            minute=0,
            second=0,
            microsecond=0
        )
        -
        timedelta(
            hours=24
        )
    )


    snapshots_created = 0


    with engine.begin() as connection:

        for hour in range(25):

            snapshot_time = (
                base_time
                +
                timedelta(
                    hours=hour
                )
            )


            # ------------------------------------------------
            # Gradual trend
            # ------------------------------------------------

            trend = (
                1
                +
                (hour * 0.0025)
            )


            for row in rows:

                original_fare = float(
                    row["total_fare"]
                )


                random_factor = random.uniform(
                    -0.015,
                    0.015
                )


                demo_fare = (
                    original_fare
                    *
                    trend
                    *
                    (1 + random_factor)
                )


                demo_fare = round(
                    demo_fare,
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
                            demo_fare

                    }
                )


            snapshots_created += 1


    print()
    print(
        "Hourly snapshots:",
        snapshots_created
    )

    print(
        "Rows per snapshot:",
        len(rows)
    )

    print(
        "Total replay rows:",
        snapshots_created * len(rows)
    )

    print(
        "Mode: DEMO / REPLAY"
    )


if __name__ == "__main__":

    create_demo_history()