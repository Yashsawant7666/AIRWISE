import os
import sys

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
    sys.path.insert(0, BACKEND_DIR)


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
        "anomaly detection and recommendation system."
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

        print("PostgreSQL connection successful!")

    except Exception as error:

        print("PostgreSQL connection failed!")
        print(error)


# ============================================================
# HELPER
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


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "status": "success",
        "message": "AIRWISE API is running",
        "version": "1.0.0"
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
            "status": "healthy",
            "database": "connected",
            "service": "AIRWISE"
        }

    except Exception as error:

        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error)
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
                    WHERE anomaly_status != 'NORMAL'
                ) AS unusual_fares,

                COUNT(*) FILTER (
                    WHERE anomaly_status = 'NORMAL'
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

            "status": "success",

            "total_fares":
                int(row["total_fares"] or 0),

            "unusual_fares":
                int(row["unusual_fares"] or 0),

            "normal_fares":
                int(row["normal_fares"] or 0),

            "low_anomalies":
                int(row["low_anomalies"] or 0),

            "medium_anomalies":
                int(row["medium_anomalies"] or 0),

            "high_anomalies":
                int(row["high_anomalies"] or 0),

            "book_now":
                int(row["book_now"] or 0),

            "monitor":
                int(row["monitor"] or 0),

            "wait":
                int(row["wait"] or 0)

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
                    safe_int(row["id"]),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "total_fare":
                    safe_float(row["total_fare"]),

                "current_fare":
                    safe_float(row["total_fare"]),

                "expected_fare":
                    safe_float(row["expected_fare"]),

                "fare_difference":
                    safe_float(row["fare_difference"]),

                "fare_difference_percent":
                    safe_float(
                        row["fare_difference_percent"]
                    ),

                "group_mean":
                    safe_float(row["group_mean"]),

                "group_std":
                    safe_float(row["group_std"]),

                "z_score":
                    safe_float(row["z_score"]),

                "anomaly_score":
                    safe_float(row["anomaly_score"]),

                "anomaly_status":
                    row["anomaly_status"],

                "recommendation":
                    row["recommendation"],

                "recommendation_reason":
                    row["recommendation_reason"]

            })

        return {

            "status": "success",

            "count": len(fares),

            "fares": fares

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
                        "fare_id": fare_id
                    }
                )
                .mappings()
                .first()
            )

        if row is None:

            raise HTTPException(
                status_code=404,
                detail=f"Fare {fare_id} not found."
            )

        return {

            "status": "success",

            "id":
                safe_int(row["id"]),

            "airline":
                row["airline"],

            "origin":
                row["origin"],

            "destination":
                row["destination"],

            "total_fare":
                safe_float(row["total_fare"]),

            "current_fare":
                safe_float(row["total_fare"]),

            "expected_fare":
                safe_float(row["expected_fare"]),

            "fare_difference":
                safe_float(row["fare_difference"]),

            "fare_difference_percent":
                safe_float(
                    row["fare_difference_percent"]
                ),

            "group_mean":
                safe_float(row["group_mean"]),

            "group_std":
                safe_float(row["group_std"]),

            "z_score":
                safe_float(row["z_score"]),

            "anomaly_score":
                safe_float(row["anomaly_score"]),

            "anomaly_status":
                row["anomaly_status"],

            "recommendation":
                row["recommendation"],

            "recommendation_reason":
                row["recommendation_reason"]

        }

    except HTTPException:

        raise

    except Exception as error:

        print()
        print("FARE DETAILS ERROR")
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

    destination = destination.strip().upper()

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

            WHERE UPPER(origin) = :origin

              AND UPPER(destination) = :destination

            ORDER BY total_fare ASC
        """)


        with engine.connect() as connection:

            rows = (
                connection
                .execute(
                    query,
                    {
                        "origin": origin,
                        "destination": destination
                    }
                )
                .mappings()
                .all()
            )


        if not rows:

            return {

                "status": "success",

                "message":
                    "No fare data found.",

                "route": {

                    "origin":
                        origin,

                    "destination":
                        destination

                },

                "count": 0,

                "fares": []

            }


        fares = []


        for index, row in enumerate(rows):

            fares.append({

                "id":
                    safe_int(row["id"]),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "current_fare":
                    safe_float(row["total_fare"]),

                "total_fare":
                    safe_float(row["total_fare"]),

                "expected_fare":
                    safe_float(row["expected_fare"]),

                "fare_difference":
                    safe_float(
                        row["fare_difference"]
                    ),

                "fare_difference_percent":
                    safe_float(
                        row["fare_difference_percent"]
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
                    row["recommendation_reason"],

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
                detail="Current fare must be greater than 0."
            )


        if expected_fare <= 0:

            raise HTTPException(
                status_code=400,
                detail="Expected fare must be greater than 0."
            )


        # ----------------------------------------------------
        # DIFFERENCE
        # ----------------------------------------------------

        difference = (
            current_fare -
            expected_fare
        )


        difference_percent = (
            difference /
            expected_fare
        ) * 100


        # ----------------------------------------------------
        # RECOMMENDATION
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # ANOMALY
        # ----------------------------------------------------

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
            detail="Fare values must be valid numbers."
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

            WHERE anomaly_status != 'NORMAL'

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
                    safe_int(row["id"]),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "current_fare":
                    safe_float(row["total_fare"]),

                "expected_fare":
                    safe_float(row["expected_fare"]),

                "fare_difference":
                    safe_float(
                        row["fare_difference"]
                    ),

                "fare_difference_percent":
                    safe_float(
                        row["fare_difference_percent"]
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
                    row["recommendation_reason"]

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
                    OR UPPER(origin) = UPPER(:origin)
                )

                AND

                (
                    :destination IS NULL
                    OR UPPER(destination) = UPPER(:destination)
                )

                AND

                (
                    :airline IS NULL
                    OR UPPER(airline) = UPPER(:airline)
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
                    safe_int(row["id"]),

                "airline":
                    row["airline"],

                "origin":
                    row["origin"],

                "destination":
                    row["destination"],

                "current_fare":
                    safe_float(row["total_fare"]),

                "expected_fare":
                    safe_float(row["expected_fare"]),

                "anomaly_score":
                    safe_float(row["anomaly_score"]),

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
            "AI-powered airfare intelligence platform",

        "modules": [

            "Fare Data",

            "Fare Fingerprinting",

            "Dynamic Baseline",

            "Anomaly Detection",

            "Recommendation Engine",

            "FastAPI",

            "React"

        ]

    }