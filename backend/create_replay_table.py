from sqlalchemy import create_engine, text

from config import DATABASE_URL


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


def main():

    query = text("""
        CREATE TABLE IF NOT EXISTS airfare_replay_observations (
            id SERIAL PRIMARY KEY,
            original_fare_id INTEGER,
            snapshot_time TIMESTAMPTZ NOT NULL,
            airline VARCHAR(100),
            origin VARCHAR(10),
            destination VARCHAR(10),
            total_fare DOUBLE PRECISION NOT NULL,
            source_mode VARCHAR(30) DEFAULT 'REPLAY'
        )
    """)

    with engine.begin() as connection:
        connection.execute(query)

    print("airfare_replay_observations table ready.")


if __name__ == "__main__":
    main()
