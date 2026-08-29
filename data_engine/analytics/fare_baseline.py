import pandas as pd
import numpy as np


# ==========================================
# AIRWISE DYNAMIC FARE BASELINE
# ==========================================

def attach_baseline(df):

    df = df.copy()

    print("\nCalculating comparable fare groups...")

    # ======================================
    # CHECK REQUIRED COLUMNS
    # ======================================

    required_columns = [
        "origin",
        "destination",
        "airline",
        "cabin_class",
        "stops",
        "advance_days",
        "total_fare"
    ]

    missing = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing:
        raise ValueError(
            "Missing columns: " + ", ".join(missing)
        )

    # ======================================
    # CONVERT DATA TYPES
    # ======================================

    df["total_fare"] = pd.to_numeric(
        df["total_fare"],
        errors="coerce"
    )

    df["advance_days"] = pd.to_numeric(
        df["advance_days"],
        errors="coerce"
    )

    # ======================================
    # REMOVE INVALID FARES
    # ======================================

    df = df[
        df["total_fare"].notna()
        & (df["total_fare"] > 0)
    ].copy()

    if df.empty:
        raise ValueError("No valid fare records found.")

    # ======================================
    # COMPARABLE GROUP
    # ======================================

    group_columns = [
        "origin",
        "destination",
        "airline",
        "cabin_class",
        "stops",
        "advance_days"
    ]

    print(
        "Grouping by:",
        ", ".join(group_columns)
    )

    # ======================================
    # CALCULATE GROUP MEAN
    # ======================================

    group_mean = (
        df.groupby(
            group_columns,
            dropna=False
        )["total_fare"]
        .transform("mean")
    )

    df["group_mean"] = group_mean

    # ======================================
    # CALCULATE GROUP MEDIAN
    # ======================================

    group_median = (
        df.groupby(
            group_columns,
            dropna=False
        )["total_fare"]
        .transform("median")
    )

    df["group_median"] = group_median

    # ======================================
    # CALCULATE GROUP STANDARD DEVIATION
    # ======================================

    group_std = (
        df.groupby(
            group_columns,
            dropna=False
        )["total_fare"]
        .transform("std")
    )

    df["group_std"] = group_std

    # ======================================
    # FIX NaN STANDARD DEVIATION
    # ======================================

    df["group_std"] = df["group_std"].fillna(0)

    # ======================================
    # GROUP MINIMUM
    # ======================================

    df["group_min"] = (
        df.groupby(
            group_columns,
            dropna=False
        )["total_fare"]
        .transform("min")
    )

    # ======================================
    # GROUP MAXIMUM
    # ======================================

    df["group_max"] = (
        df.groupby(
            group_columns,
            dropna=False
        )["total_fare"]
        .transform("max")
    )

    # ======================================
    # GROUP COUNT
    # ======================================

    df["group_count"] = (
        df.groupby(
            group_columns,
            dropna=False
        )["total_fare"]
        .transform("count")
    )

    # ======================================
    # EXPECTED FARE
    # ======================================

    # Use median because it is less affected
    # by extreme prices.

    df["expected_fare"] = df["group_median"]

    # Fallback to mean
    df["expected_fare"] = df[
        "expected_fare"
    ].fillna(
        df["group_mean"]
    )

    # Final fallback
    df["expected_fare"] = df[
        "expected_fare"
    ].fillna(
        df["total_fare"]
    )

    # ======================================
    # FARE DIFFERENCE
    # ======================================

    df["fare_difference"] = (
        df["total_fare"]
        - df["expected_fare"]
    )

    # ======================================
    # FARE DIFFERENCE %
    # ======================================

    df["fare_difference_percent"] = np.where(

        df["expected_fare"] > 0,

        (
            df["fare_difference"]
            / df["expected_fare"]
        ) * 100,

        0
    )

    # ======================================
    # BASELINE STATUS
    # ======================================

    df["baseline_status"] = np.where(

        df["fare_difference_percent"] > 10,

        "ABOVE_EXPECTED",

        np.where(

            df["fare_difference_percent"] < -10,

            "BELOW_EXPECTED",

            "NORMAL"
        )
    )

    # ======================================
    # FINAL SAFETY CHECK
    # ======================================

    if "group_std" not in df.columns:

        raise RuntimeError(
            "group_std was not created."
        )

    if "expected_fare" not in df.columns:

        raise RuntimeError(
            "expected_fare was not created."
        )

    print(
        "Comparable fare groups:",
        df[group_columns]
        .drop_duplicates()
        .shape[0]
    )

    print(
        "Expected fare calculated successfully."
    )

    print(
        "Group standard deviation calculated successfully."
    )

    return df


# ==========================================
# TEST
# ==========================================

if __name__ == "__main__":

    print("\n========================================")
    print("AIRWISE BASELINE TEST")
    print("========================================")

    test_data = {

        "origin": [
            "BOM",
            "BOM",
            "BOM",
            "BOM",
            "BOM"
        ],

        "destination": [
            "DEL",
            "DEL",
            "DEL",
            "DEL",
            "DEL"
        ],

        "airline": [
            "IndiGo",
            "IndiGo",
            "IndiGo",
            "IndiGo",
            "IndiGo"
        ],

        "cabin_class": [
            "Economy",
            "Economy",
            "Economy",
            "Economy",
            "Economy"
        ],

        "stops": [
            0,
            0,
            0,
            0,
            0
        ],

        "advance_days": [
            7,
            7,
            7,
            7,
            7
        ],

        "total_fare": [
            4500,
            4800,
            5000,
            5100,
            9000
        ]
    }

    test_df = pd.DataFrame(test_data)

    result = attach_baseline(test_df)

    print("\n========================================")
    print("BASELINE RESULTS")
    print("========================================")

    print(
        result[
            [
                "total_fare",
                "group_mean",
                "group_std",
                "expected_fare",
                "fare_difference",
                "fare_difference_percent",
                "baseline_status"
            ]
        ].to_string(index=False)
    )

    print("\n========================================")
    print("BASELINE TEST COMPLETED SUCCESSFULLY")
    print("========================================")