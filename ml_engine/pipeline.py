import os
import sys

import pandas as pd
from sqlalchemy import create_engine, text


# ==========================================
# PATH SETUP
# ==========================================

# pipeline.py is inside:
# AIRWISE/ml_engine/pipeline.py
#
# Therefore BASE_DIR becomes:
# AIRWISE/

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

# Add AIRWISE root to Python path
sys.path.insert(0, BASE_DIR)

# Add backend to Python path
sys.path.insert(
    0,
    os.path.join(BASE_DIR, "backend")
)


# ==========================================
# IMPORTS
# ==========================================

from config import DATABASE_URL

from data_engine.fingerprint.fare_fingerprint import (
    create_fingerprint
)

from data_engine.analytics.fare_baseline import (
    attach_baseline
)

from ml_engine.anomaly.anomaly_detector import (
    calculate_anomaly_scores
)

from ml_engine.recommendation.recommendation_engine import (
    add_recommendations
)


# ==========================================
# DATABASE CONNECTION
# ==========================================

print("\nConnecting to PostgreSQL...")

try:

    engine = create_engine(DATABASE_URL)

    # Test connection
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    print("Database connection successful!")

except Exception as e:

    print("\nDATABASE CONNECTION FAILED!")
    print(e)

    sys.exit(1)


# ==========================================
# LOAD DATA
# ==========================================

def load_fares():

    print("\n========================================")
    print("LOADING FARES")
    print("========================================")

    query = """
        SELECT *
        FROM fare_observations
        ORDER BY id
    """

    try:

        df = pd.read_sql(
            query,
            engine
        )

        print("Rows loaded:", len(df))

        return df

    except Exception as e:

        print("\nERROR WHILE LOADING FARES!")
        print(e)

        sys.exit(1)


# ==========================================
# FARE FINGERPRINT
# ==========================================

def apply_fingerprints(df):

    print("\n========================================")
    print("CREATING FARE FINGERPRINTS")
    print("========================================")

    try:

        df["fare_fingerprint"] = df.apply(
            create_fingerprint,
            axis=1
        )

        print("Fingerprints created successfully.")

        return df

    except Exception as e:

        print("\nFINGERPRINT ERROR!")
        print(e)

        sys.exit(1)


# ==========================================
# DYNAMIC BASELINE
# ==========================================

def apply_baseline(df):

    print("\n========================================")
    print("CALCULATING DYNAMIC FARE BASELINE")
    print("========================================")

    try:

        df = attach_baseline(df)

        print("Expected fares calculated successfully.")

        return df

    except Exception as e:

        print("\nBASELINE ERROR!")
        print(e)

        sys.exit(1)


# ==========================================
# ANOMALY DETECTION
# ==========================================

def apply_anomaly_detection(df):

    print("\n========================================")
    print("RUNNING ANOMALY DETECTION")
    print("========================================")

    try:

        df = calculate_anomaly_scores(df)

        print("Anomaly detection completed successfully.")

        return df

    except Exception as e:

        print("\nANOMALY DETECTION ERROR!")
        print(e)

        sys.exit(1)


# ==========================================
# RECOMMENDATION
# ==========================================

def apply_recommendations(df):

    print("\n========================================")
    print("GENERATING RECOMMENDATIONS")
    print("========================================")

    try:

        df = add_recommendations(df)

        print("Recommendations generated successfully.")

        return df

    except Exception as e:

        print("\nRECOMMENDATION ERROR!")
        print(e)

        sys.exit(1)


# ==========================================
# UPDATE DATABASE
# ==========================================

def update_database(df):

    print("\n========================================")
    print("UPDATING POSTGRESQL")
    print("========================================")

    update_query = text("""
        UPDATE fare_observations
        SET
            fare_fingerprint = :fare_fingerprint,
            expected_fare = :expected_fare,
            fare_difference = :fare_difference,
            fare_difference_percent = :fare_difference_percent,
            group_mean = :group_mean,
            group_std = :group_std,
            z_score = :z_score,
            anomaly_score = :anomaly_score,
            anomaly_status = :anomaly_status,
            recommendation = :recommendation,
            recommendation_reason = :recommendation_reason
        WHERE id = :id
    """)

    try:

        with engine.begin() as connection:

            for _, row in df.iterrows():

                connection.execute(
                    update_query,
                    {
                        "id": int(row["id"]),

                        "fare_fingerprint":
                            row["fare_fingerprint"],

                        "expected_fare":
                            row["expected_fare"],

                        "fare_difference":
                            row["fare_difference"],

                        "fare_difference_percent":
                            row["fare_difference_percent"],

                        "group_mean":
                            row["group_mean"],

                        "group_std":
                            row["group_std"],

                        "z_score":
                            row["z_score"],

                        "anomaly_score":
                            row["anomaly_score"],

                        "anomaly_status":
                            row["anomaly_status"],

                        "recommendation":
                            row["recommendation"],

                        "recommendation_reason":
                            row["recommendation_reason"]
                    }
                )

        print("PostgreSQL updated successfully.")

    except Exception as e:

        print("\nDATABASE UPDATE ERROR!")
        print(e)

        sys.exit(1)


# ==========================================
# DISPLAY RESULTS
# ==========================================

def show_results(df):

    print("\n========================================")
    print("AIRWISE RESULTS")
    print("========================================")

    columns = [
        "id",
        "airline",
        "origin",
        "destination",
        "total_fare",
        "expected_fare",
        "fare_difference_percent",
        "anomaly_score",
        "anomaly_status",
        "recommendation"
    ]

    available_columns = [
        column
        for column in columns
        if column in df.columns
    ]

    print()

    print(
        df[available_columns]
        .to_string(index=False)
    )


# ==========================================
# SUMMARY
# ==========================================

def show_summary(df):

    print("\n========================================")
    print("AIRWISE SUMMARY")
    print("========================================")

    total = len(df)

    unusual = 0

    if "anomaly_status" in df.columns:

        unusual = (
            df["anomaly_status"]
            .astype(str)
            .str.upper()
            .eq("UNUSUAL")
            .sum()
        )

    book_now = 0
    monitor = 0
    wait = 0

    if "recommendation" in df.columns:

        recommendations = (
            df["recommendation"]
            .astype(str)
            .str.upper()
        )

        book_now = (
            recommendations == "BOOK NOW"
        ).sum()

        monitor = (
            recommendations == "MONITOR"
        ).sum()

        wait = (
            recommendations == "WAIT"
        ).sum()

    print("Total fares:", total)
    print("Unusual fares:", unusual)
    print("BOOK NOW:", book_now)
    print("MONITOR:", monitor)
    print("WAIT:", wait)


# ==========================================
# MAIN PIPELINE
# ==========================================

def main():

    print("\n")
    print("========================================")
    print("       AIRWISE INTELLIGENCE PIPELINE")
    print("========================================")

    # 1. Load PostgreSQL data
    df = load_fares()

    if df.empty:

        print("\nNo fare data found in PostgreSQL.")

        return

    # 2. Create fingerprints
    df = apply_fingerprints(df)

    # 3. Calculate expected fare
    df = apply_baseline(df)

    # 4. Detect anomalies
    df = apply_anomaly_detection(df)

    # 5. Generate recommendations
    df = apply_recommendations(df)

    # 6. Update PostgreSQL
    update_database(df)

    # 7. Display results
    show_results(df)

    # 8. Display summary
    show_summary(df)

    print("\n========================================")
    print("AIRWISE PIPELINE COMPLETED SUCCESSFULLY")
    print("========================================")


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    main()