import pandas as pd
import numpy as np


# ==========================================
# AIRWISE ANOMALY DETECTION
# ==========================================

def calculate_anomaly_scores(df):

    df = df.copy()

    print("\nCalculating anomaly scores...")

    # ======================================
    # REQUIRED COLUMNS
    # ======================================

    required_columns = [
        "total_fare",
        "expected_fare",
        "group_mean",
        "group_std"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing columns for anomaly detection: "
            + ", ".join(missing_columns)
        )

    # ======================================
    # CONVERT NUMERIC VALUES
    # ======================================

    df["total_fare"] = pd.to_numeric(
        df["total_fare"],
        errors="coerce"
    )

    df["expected_fare"] = pd.to_numeric(
        df["expected_fare"],
        errors="coerce"
    )

    df["group_mean"] = pd.to_numeric(
        df["group_mean"],
        errors="coerce"
    )

    df["group_std"] = pd.to_numeric(
        df["group_std"],
        errors="coerce"
    )

    # ======================================
    # HANDLE MISSING VALUES
    # ======================================

    df["expected_fare"] = df[
        "expected_fare"
    ].fillna(
        df["total_fare"]
    )

    df["group_mean"] = df[
        "group_mean"
    ].fillna(
        df["expected_fare"]
    )

    df["group_std"] = df[
        "group_std"
    ].fillna(0)

    # ======================================
    # Z-SCORE
    # ======================================

    # Avoid division by zero.

    df["z_score"] = np.where(

        df["group_std"] > 0,

        (
            df["total_fare"]
            - df["group_mean"]
        )
        / df["group_std"],

        0
    )

    # ======================================
    # ABSOLUTE Z-SCORE
    # ======================================

    df["absolute_z_score"] = (
        df["z_score"].abs()
    )

    # ======================================
    # ANOMALY SCORE
    # ======================================

    # Convert z-score into a 0-100 score.

    df["anomaly_score"] = np.clip(

        df["absolute_z_score"] * 25,

        0,

        100
    )

    # ======================================
    # ANOMALY STATUS
    # ======================================

    df["anomaly_status"] = np.select(

        [
            df["absolute_z_score"] >= 3,
            df["absolute_z_score"] >= 2,
            df["absolute_z_score"] >= 1
        ],

        [
            "HIGH",
            "MEDIUM",
            "LOW"
        ],

        default="NORMAL"
    )

    # ======================================
    # HANDLE SINGLE-OBSERVATION GROUPS
    # ======================================

    # When group_std = 0, z-score cannot
    # identify an anomaly.
    #
    # Use fare difference percentage instead.

    if "fare_difference_percent" in df.columns:

        percentage_difference = (
            df["fare_difference_percent"]
            .abs()
        )

        df.loc[
            (df["group_std"] == 0)
            & (percentage_difference >= 50),
            "anomaly_status"
        ] = "HIGH"

        df.loc[
            (df["group_std"] == 0)
            & (percentage_difference >= 30)
            & (percentage_difference < 50),
            "anomaly_status"
        ] = "MEDIUM"

        df.loc[
            (df["group_std"] == 0)
            & (percentage_difference >= 15)
            & (percentage_difference < 30),
            "anomaly_status"
        ] = "LOW"

    # ======================================
    # FINAL SAFETY
    # ======================================

    df["anomaly_score"] = pd.to_numeric(
        df["anomaly_score"],
        errors="coerce"
    ).fillna(0)

    df["z_score"] = pd.to_numeric(
        df["z_score"],
        errors="coerce"
    ).fillna(0)

    # ======================================
    # PRINT SUMMARY
    # ======================================

    print(
        "Anomaly scores calculated successfully."
    )

    print(
        "\nAnomaly status distribution:"
    )

    print(
        df["anomaly_status"]
        .value_counts()
        .to_string()
    )

    return df


# ==========================================
# TEST
# ==========================================

if __name__ == "__main__":

    print("\n========================================")
    print("AIRWISE ANOMALY DETECTOR TEST")
    print("========================================")

    test_data = {

        "total_fare": [
            4500,
            4800,
            5000,
            5200,
            9000
        ],

        "expected_fare": [
            5000,
            5000,
            5000,
            5000,
            5000
        ],

        "group_mean": [
            5000,
            5000,
            5000,
            5000,
            5000
        ],

        "group_std": [
            300,
            300,
            300,
            300,
            300
        ],

        "fare_difference_percent": [
            -10,
            -4,
            0,
            4,
            80
        ]
    }

    test_df = pd.DataFrame(test_data)

    result = calculate_anomaly_scores(
        test_df
    )

    print("\n========================================")
    print("ANOMALY RESULTS")
    print("========================================")

    print(
        result[
            [
                "total_fare",
                "expected_fare",
                "group_std",
                "z_score",
                "anomaly_score",
                "anomaly_status"
            ]
        ].to_string(index=False)
    )

    print("\n========================================")
    print("ANOMALY TEST COMPLETED SUCCESSFULLY")
    print("========================================")