import os
import sys
import asyncio

from datetime import date, datetime, time, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

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
    sys.path.insert(
        0,
        BACKEND_DIR
    )


# ============================================================
# DATABASE CONFIG
# ============================================================

try:

    from config import DATABASE_URL

except ImportError as error:

    print()
    print("========================================")
    print("DATABASE CONFIG ERROR")
    print("========================================")
    print(error)
    print()
    print("Make sure backend/config.py exists.")
    print()

    raise


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AIRWISE API",
    description=(
        "AI-powered airfare intelligence, "
        "Airfare Price Index, anomaly detection "
        "and smart booking recommendation system."
    ),
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "https://airwise-taupe.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# HELPERS
# ============================================================

def safe_float(value):

    if value is None:
        return None

    try:
        return float(value)

    except (TypeError, ValueError):

        return None


def safe_int(value):

    if value is None:
        return None

    try:
        return int(value)

    except (TypeError, ValueError):

        return None


def serialize_date(value):

    if value is None:
        return None

    if isinstance(value, (date, datetime)):

        return value.isoformat()

    return str(value)


def serialize_time(value):

    if value is None:
        return None

    if isinstance(value, time):

        return value.isoformat()

    return str(value)


# ============================================================
# INDEX SNAPSHOT TABLE
# ============================================================

def ensure_index_snapshot_table():

    query = text("""
        CREATE TABLE IF NOT EXISTS airfare_index_snapshots (

            id SERIAL PRIMARY KEY,

            snapshot_time TIMESTAMPTZ NOT NULL,

            index_value DOUBLE PRECISION NOT NULL,

            average_fare DOUBLE PRECISION NOT NULL,

            observation_count INTEGER NOT NULL

        )
    """)

    with engine.begin() as connection:

        connection.execute(query)


# ============================================================
# CALCULATE CURRENT AIRFARE INDEX
# ============================================================

def calculate_current_airfare_index():

    query = text("""
        SELECT
            id,
            origin,
            destination,
            airline,
            departure_date,
            total_fare,
            expected_fare

        FROM fare_observations

        WHERE
            departure_date IS NOT NULL
            AND total_fare IS NOT NULL
            AND total_fare > 0

        ORDER BY
            departure_date ASC,
            id ASC
    """)

    with engine.connect() as connection:

        rows = (
            connection
            .execute(query)
            .mappings()
            .all()
        )


    if not rows:

        return None


    observations = []


    for row in rows:

        fare = safe_float(
            row["total_fare"]
        )

        departure_date = row[
            "departure_date"
        ]


        if (
            fare is None
            or fare <= 0
            or departure_date is None
        ):

            continue


        observations.append({

            "id":
                safe_int(
                    row["id"]
                ),

            "origin":
                row["origin"],

            "destination":
                row["destination"],

            "airline":
                row["airline"],

            "date":
                departure_date,

            "fare":
                fare

        })


    if not observations:

        return None


    # ========================================================
    # MONTHLY GROUPING
    # ========================================================

    monthly_fares = {}


    for item in observations:

        month_key = item[
            "date"
        ].strftime(
            "%Y-%m"
        )


        monthly_fares.setdefault(
            month_key,
            []
        ).append(
            item["fare"]
        )


    if not monthly_fares:

        return None


    # ========================================================
    # MONTHLY AVERAGES
    # ========================================================

    monthly_average = {}


    for month, values in monthly_fares.items():

        if values:

            monthly_average[
                month
            ] = (
                sum(values)
                /
                len(values)
            )


    sorted_months = sorted(
        monthly_average.keys()
    )


    if not sorted_months:

        return None


    # ========================================================
    # BASE PERIOD
    # ========================================================

    base_period = sorted_months[0]

    base_average = monthly_average[
        base_period
    ]


    if base_average <= 0:

        return None


    # ========================================================
    # CURRENT PERIOD
    # ========================================================

    current_period = sorted_months[-1]

    current_average = monthly_average[
        current_period
    ]


    # ========================================================
    # CURRENT INDEX
    # ========================================================

    current_index = (
        current_average
        /
        base_average
    ) * 100


    # ========================================================
    # PRESSURE
    # ========================================================

    change_percent = (
        current_index - 100
    )


    if current_index >= 105:

        pressure = "HIGH"

    elif current_index >= 102:

        pressure = "ELEVATED"

    elif current_index >= 98:

        pressure = "STABLE"

    else:

        pressure = "LOW"


    # ========================================================
    # HISTORY
    # ========================================================

    history = []


    for month in sorted_months:

        avg_fare = monthly_average[
            month
        ]


        index_value = (
            avg_fare
            /
            base_average
        ) * 100


        history.append({

            "period":
                month,

            "average_fare":
                round(
                    avg_fare,
                    2
                ),

            "index":
                round(
                    index_value,
                    2
                ),

            "change_percent":
                round(
                    index_value - 100,
                    2
                )

        })


    # ========================================================
    # RESULT
    # ========================================================

    return {

        "base_period":
            base_period,

        "base_average_fare":
            round(
                base_average,
                2
            ),

        "current_period":
            current_period,

        "current_average_fare":
            round(
                current_average,
                2
            ),

        "current_index":
            round(
                current_index,
                2
            ),

        "change_percent":
            round(
                change_percent,
                2
            ),

        "price_pressure":
            pressure,

        "observations":
            len(observations),

        "periods":
            len(sorted_months),

        "history":
            history

    }


# ============================================================
# SAVE HOURLY SNAPSHOT
# ============================================================

def save_airfare_index_snapshot():

    ensure_index_snapshot_table()


    index_data = (
        calculate_current_airfare_index()
    )


    if index_data is None:

        print(
            "No valid airfare data available "
            "for hourly snapshot."
        )

        return None


    snapshot_time = datetime.now(
        timezone.utc
    )


    # ========================================================
    # AVOID DUPLICATE SNAPSHOT
    # ========================================================

    duplicate_query = text("""
        SELECT id

        FROM airfare_index_snapshots

        WHERE snapshot_time >= date_trunc(
            'hour',
            :snapshot_time
        )

        AND snapshot_time <
            date_trunc(
                'hour',
                :snapshot_time
            ) + INTERVAL '1 hour'

        LIMIT 1
    """)


    insert_query = text("""
        INSERT INTO airfare_index_snapshots (

            snapshot_time,
            index_value,
            average_fare,
            observation_count

        )

        VALUES (

            :snapshot_time,
            :index_value,
            :average_fare,
            :observation_count

        )
    """)


    with engine.begin() as connection:

        existing = connection.execute(
            duplicate_query,
            {
                "snapshot_time":
                    snapshot_time
            }
        ).first()


        if existing:

            print(
                "Hourly AIRWISE index snapshot "
                "already exists."
            )

            return None


        connection.execute(
            insert_query,
            {

                "snapshot_time":
                    snapshot_time,

                "index_value":
                    index_data[
                        "current_index"
                    ],

                "average_fare":
                    index_data[
                        "current_average_fare"
                    ],

                "observation_count":
                    index_data[
                        "observations"
                    ]

            }
        )


    print()
    print("========================================")
    print("AIRWISE HOURLY INDEX SNAPSHOT")
    print("========================================")

    print(
        "Snapshot:",
        snapshot_time.isoformat()
    )

    print(
        "Index:",
        index_data["current_index"]
    )

    print(
        "Average fare:",
        index_data[
            "current_average_fare"
        ]
    )

    print(
        "Observations:",
        index_data[
            "observations"
        ]
    )

    return {

        "snapshot_time":
            snapshot_time.isoformat(),

        "index":
            index_data[
                "current_index"
            ],

        "average_fare":
            index_data[
                "current_average_fare"
            ],

        "observation_count":
            index_data[
                "observations"
            ]

    }


# ============================================================
# HOURLY BACKGROUND SERVICE
# ============================================================

async def hourly_index_snapshot_loop():

    print()
    print("AIRWISE HOURLY INDEX SERVICE STARTED")
    print("Snapshots will be checked every hour.")


    while True:

        try:

            save_airfare_index_snapshot()

        except Exception as error:

            print()
            print(
                "HOURLY INDEX SNAPSHOT ERROR"
            )

            print(error)


        # ====================================================
        # WAIT 1 HOUR
        # ====================================================

        await asyncio.sleep(
            3600
        )


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():

    print()
    print("========================================")
    print("          AIRWISE FASTAPI")
    print("========================================")


    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        print(
            "PostgreSQL connection successful!"
        )


        # Make sure snapshot table exists
        ensure_index_snapshot_table()


        # Start hourly background task
        asyncio.create_task(
            hourly_index_snapshot_loop()
        )


        print(
            "Hourly Airfare Index service enabled."
        )


    except Exception as error:

        print(
            "PostgreSQL connection failed!"
        )

        print(error)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "status":
            "success",

        "message":
            "AIRWISE API is running",

        "version":
            "1.0.0",

        "docs":
            "/docs",

        "endpoints": [

            "/health",

            "/summary",

            "/fares",

            "/fare/{fare_id}",

            "/search",

            "/predict",

            "/anomalies",

            "/fare-trend",

            "/index",

            "/index/hourly",

            "/index/snapshot",

            "/info"

        ]

    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        return {

            "status":
                "healthy",

            "database":
                "connected",

            "service":
                "AIRWISE"

        }

    except Exception as error:

        return {

            "status":
                "unhealthy",

            "database":
                "disconnected",

            "service":
                "AIRWISE",

            "error":
                str(error)

        }


# ============================================================
# SUMMARY
# ============================================================

@app.get("/summary")
def get_summary():

    try:

        query = text("""
            SELECT

                COUNT(*) AS total_fares,

                COUNT(*) FILTER (
                    WHERE COALESCE(
                        anomaly_status,
                        'NORMAL'
                    ) != 'NORMAL'
                ) AS unusual_fares,

                COUNT(*) FILTER (
                    WHERE COALESCE(
                        anomaly_status,
                        'NORMAL'
                    ) = 'NORMAL'
                ) AS normal_fares,

                COUNT(*) FILTER (
                    WHERE anomaly_status = 'LOW'
                ) AS low_anomalies,

                COUNT(*) FILTER (
                    WHERE anomaly_status = 'MEDIUM'
                ) AS medium_anomalies,

                COUNT(*) FILTER (
                    WHERE anomaly_status = 'HIGH'
                ) AS high_anomalies,

                COUNT(*) FILTER (
                    WHERE recommendation = 'BOOK NOW'
                ) AS book_now,

                COUNT(*) FILTER (
                    WHERE recommendation = 'MONITOR'
                ) AS monitor,

                COUNT(*) FILTER (
                    WHERE recommendation = 'WAIT'
                ) AS wait

            FROM fare_observations
        """)


        with engine.connect() as connection:

            row = (
                connection
                .execute(query)
                .mappings()
                .first()
            )


        return {

            "status":
                "success",

            "total_fares":
                int(
                    row[
                        "total_fares"
                    ] or 0
                ),

            "unusual_fares":
                int(
                    row[
                        "unusual_fares"
                    ] or 0
                ),

            "normal_fares":
                int(
                    row[
                        "normal_fares"
                    ] or 0
                ),

            "low_anomalies":
                int(
                    row[
                        "low_anomalies"
                    ] or 0
                ),

            "medium_anomalies":
                int(
                    row[
                        "medium_anomalies"
                    ] or 0
                ),

            "high_anomalies":
                int(
                    row[
                        "high_anomalies"
                    ] or 0
                ),

            "book_now":
                int(
                    row[
                        "book_now"
                    ] or 0
                ),

            "monitor":
                int(
                    row[
                        "monitor"
                    ] or 0
                ),

            "wait":
                int(
                    row[
                        "wait"
                    ] or 0
                )

        }


    except Exception as error:

        print()
        print("SUMMARY ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# ALL FARES
# ============================================================

@app.get("/fares")
def get_fares():

    try:

        query = text("""
            SELECT

                id,
                airline,
                origin,
                destination,
                total_fare,
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

            FROM fare_observations

            ORDER BY id ASC
        """)


        with engine.connect() as connection:

            rows = (
                connection
                .execute(query)
                .mappings()
                .all()
            )


        fares = []


        for row in rows:

            fares.append({

                "id":
                    safe_int(
                        row["id"]
                    ),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "total_fare":
                    safe_float(
                        row["total_fare"]
                    ),

                "current_fare":
                    safe_float(
                        row["total_fare"]
                    ),

                "expected_fare":
                    safe_float(
                        row["expected_fare"]
                    ),

                "fare_difference":
                    safe_float(
                        row[
                            "fare_difference"
                        ]
                    ),

                "fare_difference_percent":
                    safe_float(
                        row[
                            "fare_difference_percent"
                        ]
                    ),

                "group_mean":
                    safe_float(
                        row["group_mean"]
                    ),

                "group_std":
                    safe_float(
                        row["group_std"]
                    ),

                "z_score":
                    safe_float(
                        row["z_score"]
                    ),

                "anomaly_score":
                    safe_float(
                        row["anomaly_score"]
                    ),

                "anomaly_status":
                    row["anomaly_status"],

                "recommendation":
                    row["recommendation"],

                "recommendation_reason":
                    row[
                        "recommendation_reason"
                    ]

            })


        return {

            "status":
                "success",

            "count":
                len(fares),

            "fares":
                fares

        }


    except Exception as error:

        print()
        print("FARES ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# SINGLE FARE
# ============================================================

@app.get("/fare/{fare_id}")
def get_fare(fare_id: int):

    try:

        query = text("""
            SELECT

                id,
                airline,
                origin,
                destination,
                total_fare,
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

            FROM fare_observations

            WHERE id = :fare_id
        """)


        with engine.connect() as connection:

            row = (
                connection
                .execute(
                    query,
                    {
                        "fare_id":
                            fare_id
                    }
                )
                .mappings()
                .first()
            )


        if row is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Fare {fare_id} not found."
                )
            )


        return {

            "status":
                "success",

            "id":
                safe_int(
                    row["id"]
                ),

            "airline":
                row["airline"],

            "origin":
                row["origin"],

            "destination":
                row["destination"],

            "total_fare":
                safe_float(
                    row["total_fare"]
                ),

            "current_fare":
                safe_float(
                    row["total_fare"]
                ),

            "expected_fare":
                safe_float(
                    row["expected_fare"]
                ),

            "fare_difference":
                safe_float(
                    row["fare_difference"]
                ),

            "fare_difference_percent":
                safe_float(
                    row["fare_difference_percent"]
                ),

            "group_mean":
                safe_float(
                    row["group_mean"]
                ),

            "group_std":
                safe_float(
                    row["group_std"]
                ),

            "z_score":
                safe_float(
                    row["z_score"]
                ),

            "anomaly_score":
                safe_float(
                    row["anomaly_score"]
                ),

            "anomaly_status":
                row["anomaly_status"],

            "recommendation":
                row["recommendation"],

            "recommendation_reason":
                row[
                    "recommendation_reason"
                ]

        }


    except HTTPException:

        raise


    except Exception as error:

        print()
        print(
            "FARE DETAILS ERROR"
        )

        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# ROUTE SEARCH
# ============================================================

@app.get("/search")
def search_fares(

    origin: str = Query(
        ...,
        min_length=3,
        max_length=3
    ),

    destination: str = Query(
        ...,
        min_length=3,
        max_length=3
    )

):

    origin = origin.strip().upper()

    destination = (
        destination
        .strip()
        .upper()
    )


    print()
    print("========================================")
    print("AIRWISE ROUTE SEARCH")
    print("========================================")

    print(
        f"{origin} → {destination}"
    )


    try:

        query = text("""
            SELECT

                id,
                airline,
                origin,
                destination,
                total_fare,
                expected_fare,
                fare_difference,
                fare_difference_percent,
                anomaly_score,
                anomaly_status,
                recommendation,
                recommendation_reason

            FROM fare_observations

            WHERE
                UPPER(origin) = :origin

                AND

                UPPER(destination)
                    = :destination

            ORDER BY total_fare ASC
        """)


        with engine.connect() as connection:

            rows = (
                connection
                .execute(
                    query,
                    {
                        "origin":
                            origin,

                        "destination":
                            destination
                    }
                )
                .mappings()
                .all()
            )


        if not rows:

            return {

                "status":
                    "success",

                "message":
                    "No fare data found.",

                "route": {

                    "origin":
                        origin,

                    "destination":
                        destination

                },

                "count":
                    0,

                "fares":
                    []

            }


        fares = []


        for index, row in enumerate(rows):

            fares.append({

                "id":
                    safe_int(
                        row["id"]
                    ),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "current_fare":
                    safe_float(
                        row["total_fare"]
                    ),

                "total_fare":
                    safe_float(
                        row["total_fare"]
                    ),

                "expected_fare":
                    safe_float(
                        row["expected_fare"]
                    ),

                "fare_difference":
                    safe_float(
                        row["fare_difference"]
                    ),

                "fare_difference_percent":
                    safe_float(
                        row[
                            "fare_difference_percent"
                        ]
                    ),

                "anomaly_score":
                    safe_float(
                        row["anomaly_score"]
                    ),

                "anomaly_status":
                    row["anomaly_status"],

                "recommendation":
                    row["recommendation"],

                "recommendation_reason":
                    row[
                        "recommendation_reason"
                    ],

                "is_best_fare":
                    index == 0

            })


        return {

            "status":
                "success",

            "route": {

                "origin":
                    origin,

                "destination":
                    destination

            },

            "count":
                len(fares),

            "best_fare":
                fares[0],

            "fares":
                fares

        }


    except Exception as error:

        print()
        print("SEARCH ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict_fare(data: dict):

    try:

        current_fare = float(
            data.get(
                "current_fare",
                0
            )
        )

        expected_fare = float(
            data.get(
                "expected_fare",
                0
            )
        )

        origin = str(
            data.get(
                "origin",
                ""
            )
        ).upper()

        destination = str(
            data.get(
                "destination",
                ""
            )
        ).upper()

        airline = str(
            data.get(
                "airline",
                ""
            )
        )


        if current_fare <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Current fare must be "
                    "greater than 0."
                )
            )


        if expected_fare <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Expected fare must be "
                    "greater than 0."
                )
            )


        difference = (
            current_fare -
            expected_fare
        )


        difference_percent = (
            difference /
            expected_fare
        ) * 100


        # ====================================================
        # RECOMMENDATION
        # ====================================================

        if difference_percent <= -5:

            recommendation = "BOOK NOW"

            reason = (
                "The current fare is significantly "
                "below the expected fare. This may "
                "represent a good booking opportunity."
            )

        elif difference_percent <= 2:

            recommendation = "BOOK NOW"

            reason = (
                "The current fare is close to or "
                "below the expected fare."
            )

        elif difference_percent <= 7:

            recommendation = "MONITOR"

            reason = (
                "The current fare is slightly above "
                "the expected fare. Monitor the fare "
                "before booking."
            )

        else:

            recommendation = "WAIT"

            reason = (
                "The current fare is significantly "
                "higher than the expected fare. "
                "Waiting may provide a better price."
            )


        # ====================================================
        # ANOMALY
        # ====================================================

        absolute_difference = abs(
            difference_percent
        )


        if absolute_difference >= 10:

            anomaly_status = "HIGH"

        elif absolute_difference >= 5:

            anomaly_status = "MEDIUM"

        elif absolute_difference >= 2:

            anomaly_status = "LOW"

        else:

            anomaly_status = "NORMAL"


        anomaly_score = round(
            absolute_difference * 10,
            2
        )


        return {

            "status":
                "success",

            "route": {

                "origin":
                    origin,

                "destination":
                    destination

            },

            "airline":
                airline,

            "current_fare":
                round(
                    current_fare,
                    2
                ),

            "expected_fare":
                round(
                    expected_fare,
                    2
                ),

            "fare_difference":
                round(
                    difference,
                    2
                ),

            "fare_difference_percent":
                round(
                    difference_percent,
                    2
                ),

            "anomaly_score":
                anomaly_score,

            "anomaly_status":
                anomaly_status,

            "recommendation":
                recommendation,

            "recommendation_reason":
                reason

        }


    except HTTPException:

        raise


    except ValueError:

        raise HTTPException(
            status_code=400,
            detail=(
                "Fare values must be valid numbers."
            )
        )


    except Exception as error:

        print()
        print("PREDICTION ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# ANOMALIES
# ============================================================

@app.get("/anomalies")
def get_anomalies():

    try:

        query = text("""
            SELECT

                id,
                airline,
                origin,
                destination,
                total_fare,
                expected_fare,
                fare_difference,
                fare_difference_percent,
                anomaly_score,
                anomaly_status,
                recommendation,
                recommendation_reason

            FROM fare_observations

            WHERE COALESCE(
                anomaly_status,
                'NORMAL'
            ) != 'NORMAL'

            ORDER BY anomaly_score DESC
        """)


        with engine.connect() as connection:

            rows = (
                connection
                .execute(query)
                .mappings()
                .all()
            )


        anomalies = []


        for row in rows:

            anomalies.append({

                "id":
                    safe_int(
                        row["id"]
                    ),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "current_fare":
                    safe_float(
                        row["total_fare"]
                    ),

                "expected_fare":
                    safe_float(
                        row["expected_fare"]
                    ),

                "fare_difference":
                    safe_float(
                        row["fare_difference"]
                    ),

                "fare_difference_percent":
                    safe_float(
                        row[
                            "fare_difference_percent"
                        ]
                    ),

                "anomaly_score":
                    safe_float(
                        row["anomaly_score"]
                    ),

                "anomaly_status":
                    row["anomaly_status"],

                "recommendation":
                    row["recommendation"],

                "recommendation_reason":
                    row[
                        "recommendation_reason"
                    ]

            })


        return {

            "status":
                "success",

            "count":
                len(anomalies),

            "data":
                anomalies

        }


    except Exception as error:

        print()
        print("ANOMALY ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# FARE TREND
# ============================================================

@app.get("/fare-trend")
def get_fare_trend(

    origin: str | None = None,

    destination: str | None = None,

    airline: str | None = None

):

    try:

        query = text("""
            SELECT

                id,
                airline,
                origin,
                destination,
                total_fare,
                expected_fare,
                anomaly_score,
                anomaly_status,
                recommendation

            FROM fare_observations

            WHERE

                (
                    :origin IS NULL

                    OR UPPER(origin)
                    = UPPER(:origin)
                )

                AND

                (
                    :destination IS NULL

                    OR UPPER(destination)
                    = UPPER(:destination)
                )

                AND

                (
                    :airline IS NULL

                    OR UPPER(airline)
                    = UPPER(:airline)
                )

            ORDER BY id ASC
        """)


        with engine.connect() as connection:

            rows = (
                connection
                .execute(
                    query,
                    {
                        "origin":
                            origin,

                        "destination":
                            destination,

                        "airline":
                            airline
                    }
                )
                .mappings()
                .all()
            )


        data = []


        for row in rows:

            data.append({

                "id":
                    safe_int(
                        row["id"]
                    ),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "current_fare":
                    safe_float(
                        row["total_fare"]
                    ),

                "expected_fare":
                    safe_float(
                        row["expected_fare"]
                    ),

                "anomaly_score":
                    safe_float(
                        row["anomaly_score"]
                    ),

                "anomaly_status":
                    row["anomaly_status"],

                "recommendation":
                    row["recommendation"]

            })


        return {

            "status":
                "success",

            "count":
                len(data),

            "data":
                data

        }


    except Exception as error:

        print()
        print("FARE TREND ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# AIRWISE AIRFARE PRICE INDEX
# ============================================================

@app.get("/index")
def get_airfare_index():

    try:

        print()
        print("========================================")
        print("AIRWISE AIRFARE PRICE INDEX")
        print("========================================")


        index_data = (
            calculate_current_airfare_index()
        )


        if index_data is None:

            return {

                "status":
                    "success",

                "index_name":
                    "AIRWISE Airfare Price Index",

                "message":
                    (
                        "No valid dated airfare "
                        "observations available."
                    ),

                "base_period":
                    None,

                "base_index":
                    100,

                "current_period":
                    None,

                "current_index":
                    100,

                "change_percent":
                    0,

                "price_pressure":
                    "STABLE",

                "observations":
                    0,

                "periods":
                    0,

                "history":
                    [],

                "routes":
                    []

            }


        # ====================================================
        # ROUTE INDEX
        # ====================================================

        route_query = text("""
            SELECT

                origin,
                destination,

                COUNT(*) AS observations,

                AVG(total_fare) AS average_fare

            FROM fare_observations

            WHERE
                total_fare IS NOT NULL
                AND total_fare > 0

            GROUP BY
                origin,
                destination

            ORDER BY
                average_fare DESC
        """)


        with engine.connect() as connection:

            route_rows = (
                connection
                .execute(route_query)
                .mappings()
                .all()
            )


        routes = []


        base_average = index_data[
            "base_average_fare"
        ]


        for row in route_rows:

            average_fare = safe_float(
                row["average_fare"]
            )


            if (
                average_fare is None
                or base_average <= 0
            ):

                continue


            route_index = (
                average_fare
                /
                base_average
            ) * 100


            routes.append({

                "route":
                    (
                        f"{row['origin']}"
                        f"-"
                        f"{row['destination']}"
                    ),

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "observations":
                    safe_int(
                        row["observations"]
                    ),

                "average_fare":
                    round(
                        average_fare,
                        2
                    ),

                "index":
                    round(
                        route_index,
                        2
                    ),

                "change_percent":
                    round(
                        route_index - 100,
                        2
                    )

            })


        return {

            "status":
                "success",

            "index_name":
                "AIRWISE Airfare Price Index",

            "methodology":
                (
                    "Monthly average airfare relative "
                    "to the earliest available base "
                    "period, normalized to 100."
                ),

            "note":
                (
                    "Prototype AIRWISE index. "
                    "It is not an official government "
                    "CPI value."
                ),

            "base_period":
                index_data[
                    "base_period"
                ],

            "base_index":
                100,

            "base_average_fare":
                index_data[
                    "base_average_fare"
                ],

            "current_period":
                index_data[
                    "current_period"
                ],

            "current_average_fare":
                index_data[
                    "current_average_fare"
                ],

            "current_index":
                index_data[
                    "current_index"
                ],

            "change_percent":
                index_data[
                    "change_percent"
                ],

            "price_pressure":
                index_data[
                    "price_pressure"
                ],

            "observations":
                index_data[
                    "observations"
                ],

            "periods":
                index_data[
                    "periods"
                ],

            "history":
                index_data[
                    "history"
                ],

            "routes":
                routes[:20]

        }


    except Exception as error:

        print()
        print(
            "AIRFARE INDEX ERROR"
        )

        print(error)


        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# HOURLY AIRFARE INDEX MOVEMENT
# ============================================================
#
# Uses timestamped airfare_replay_observations.
#
# Provides:
#   - Current replay index
#   - 1 hour change
#   - 2 hour change
#   - 6 hour change
#   - 24 hour change
#   - Last update timestamp
#   - Snapshot count
#
# DEMO / REPLAY mode only.
#
# ============================================================

@app.get("/index/hourly")
def get_hourly_index():

    try:

        print()
        print("========================================")
        print("AIRWISE HOURLY AIRFARE INDEX")
        print("========================================")


        # ----------------------------------------------------
        # CHECK REPLAY TABLE
        # ----------------------------------------------------

        table_check = text("""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_name =
                    'airfare_replay_observations'
            ) AS table_exists
        """)


        with engine.connect() as connection:

            table_result = (
                connection
                .execute(table_check)
                .mappings()
                .first()
            )


        if not table_result["table_exists"]:

            return {

                "status":
                    "success",

                "mode":
                    "DEMO / REPLAY",

                "message":
                    (
                        "Replay observation table "
                        "does not exist yet."
                    ),

                "current_index":
                    None,

                "current_average_fare":
                    None,

                "last_updated":
                    None,

                "changes": {

                    "last_1_hour":
                        None,

                    "last_2_hours":
                        None,

                    "last_6_hours":
                        None,

                    "last_24_hours":
                        None

                },

                "snapshot_count":
                    0,

                "snapshots":
                    []

            }


        # ----------------------------------------------------
        # READ TIMESTAMPED REPLAY SNAPSHOTS
        # ----------------------------------------------------

        query = text("""
            SELECT

                snapshot_time,

                AVG(total_fare)
                    AS average_fare,

                COUNT(*)
                    AS observation_count

            FROM airfare_replay_observations

            WHERE
                total_fare IS NOT NULL

                AND total_fare > 0

            GROUP BY
                snapshot_time

            ORDER BY
                snapshot_time DESC
        """)


        with engine.connect() as connection:

            rows = (
                connection
                .execute(query)
                .mappings()
                .all()
            )


        if not rows:

            return {

                "status":
                    "success",

                "mode":
                    "DEMO / REPLAY",

                "message":
                    "No replay observations available yet.",

                "current_index":
                    None,

                "current_average_fare":
                    None,

                "last_updated":
                    None,

                "changes": {

                    "last_1_hour":
                        None,

                    "last_2_hours":
                        None,

                    "last_6_hours":
                        None,

                    "last_24_hours":
                        None

                },

                "snapshot_count":
                    0,

                "snapshots":
                    []

            }


        # ----------------------------------------------------
        # BASE PERIOD
        # ----------------------------------------------------
        #
        # Earliest replay snapshot = base.
        # Base Index = 100.
        #
        # ----------------------------------------------------

        base_average = safe_float(
            rows[-1]["average_fare"]
        )


        if (
            base_average is None
            or base_average <= 0
        ):

            raise HTTPException(
                status_code=500,
                detail=(
                    "Invalid base-period "
                    "airfare average."
                )
            )


        # ----------------------------------------------------
        # BUILD INDEX SNAPSHOTS
        # ----------------------------------------------------

        snapshots = []


        for row in rows:

            average_fare = safe_float(
                row["average_fare"]
            )


            if (
                average_fare is None
                or average_fare <= 0
            ):

                continue


            index_value = (
                average_fare
                /
                base_average
            ) * 100


            snapshot_time = row[
                "snapshot_time"
            ]


            snapshots.append({

                "timestamp":
                    snapshot_time.isoformat(),

                "average_fare":
                    round(
                        average_fare,
                        2
                    ),

                "index":
                    round(
                        index_value,
                        2
                    ),

                "observation_count":
                    int(
                        row[
                            "observation_count"
                        ]
                    )

            })


        if not snapshots:

            return {

                "status":
                    "success",

                "mode":
                    "DEMO / REPLAY",

                "message":
                    "No valid replay snapshots available.",

                "current_index":
                    None,

                "current_average_fare":
                    None,

                "last_updated":
                    None,

                "changes": {

                    "last_1_hour":
                        None,

                    "last_2_hours":
                        None,

                    "last_6_hours":
                        None,

                    "last_24_hours":
                        None

                },

                "snapshot_count":
                    0,

                "snapshots":
                    []

            }


        # ----------------------------------------------------
        # CURRENT SNAPSHOT
        # ----------------------------------------------------

        current = snapshots[0]


        current_index = safe_float(
            current["index"]
        )


        # ----------------------------------------------------
        # TIME-BASED CHANGE
        # ----------------------------------------------------
        #
        # Find the closest available snapshot at or before
        # the target timestamp. This is safer than assuming
        # the SQL result always contains exactly one snapshot
        # for every hour.
        #
        # ----------------------------------------------------

        def calculate_change(hours):

            if (
                current_index is None
                or current["timestamp"] is None
            ):

                return None


            current_time = datetime.fromisoformat(
                current["timestamp"]
            )


            target_time = (
                current_time
                -
                __import__("datetime").timedelta(
                    hours=hours
                )
            )


            previous = None


            for snapshot in snapshots[1:]:

                snapshot_time = datetime.fromisoformat(
                    snapshot["timestamp"]
                )


                if snapshot_time <= target_time:

                    previous = snapshot

                    break


            if previous is None:

                return None


            previous_index = safe_float(
                previous["index"]
            )


            if (
                previous_index is None
                or previous_index == 0
            ):

                return None


            change = (

                (
                    current_index
                    -
                    previous_index
                )

                /
                previous_index

            ) * 100


            return round(
                change,
                2
            )


        # ----------------------------------------------------
        # CHANGES
        # ----------------------------------------------------

        changes = {

            "last_1_hour":
                calculate_change(1),

            "last_2_hours":
                calculate_change(2),

            "last_6_hours":
                calculate_change(6),

            "last_24_hours":
                calculate_change(24)

        }


        # ----------------------------------------------------
        # PRICE PRESSURE
        # ----------------------------------------------------

        if current_index >= 105:

            pressure = "HIGH"

        elif current_index >= 102:

            pressure = "ELEVATED"

        elif current_index >= 98:

            pressure = "STABLE"

        else:

            pressure = "LOW"


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {

            "status":
                "success",

            "mode":
                "DEMO / REPLAY",

            "index_name":
                "AIRWISE Airfare Price Index",

            "base_index":
                100,

            "base_average_fare":
                round(
                    base_average,
                    2
                ),

            "current_index":
                round(
                    current_index,
                    2
                ),

            "current_average_fare":
                round(
                    current["average_fare"],
                    2
                ),

            "last_updated":
                current["timestamp"],

            "price_pressure":
                pressure,

            "changes":
                changes,

            "snapshot_count":
                len(snapshots),

            "snapshots":
                snapshots[:25]

        }


    except HTTPException:

        raise


    except Exception as error:

        print()
        print(
            "HOURLY REPLAY INDEX ERROR"
        )

        print(error)


        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# CREATE SNAPSHOT NOW
# ============================================================

@app.post("/index/snapshot")
def create_index_snapshot():

    try:

        result = (
            save_airfare_index_snapshot()
        )


        if result is None:

            return {

                "status":
                    "success",

                "message":
                    (
                        "Snapshot was not created. "
                        "It may already exist for "
                        "the current hour."
                    )

            }


        return {

            "status":
                "success",

            "message":
                "AIRWISE index snapshot created.",

            "snapshot":
                result

        }


    except Exception as error:

        print()
        print(
            "SNAPSHOT CREATION ERROR"
        )

        print(error)


        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# SERVER INFORMATION
# ============================================================

@app.get("/info")
def get_info():

    return {

        "project":
            "AIRWISE",

        "version":
            "1.0.0",

        "description":
            (
                "AI-powered airfare intelligence "
                "platform with prototype "
                "Airfare Price Index."
            ),

        "modules": [

            "Fare Data",

            "Fare Fingerprinting",

            "Dynamic Baseline",

            "Airfare Price Index",

            "Hourly Index Snapshots",

            "Anomaly Detection",

            "Recommendation Engine",

            "FastAPI",

            "React"

        ]

    }