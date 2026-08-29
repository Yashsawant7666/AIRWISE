import pandas as pd


# ==========================================
# AIRWISE RECOMMENDATION ENGINE
# ==========================================

def generate_recommendation(row):
    """
    Generate a simple recommendation based on
    anomaly score and fare difference.
    """

    current_fare = row["total_fare"]
    expected_fare = row["expected_fare"]
    anomaly_score = row["anomaly_score"]

    # Percentage difference from expected fare
    if expected_fare > 0:
        difference_percent = (
            (current_fare - expected_fare)
            / expected_fare
        ) * 100
    else:
        difference_percent = 0


    # ======================================
    # RECOMMENDATION LOGIC
    # ======================================

    # Very unusual and expensive
    if anomaly_score >= 3 and difference_percent >= 20:

        recommendation = "WAIT"

        reason = (
            "Current fare is significantly higher "
            "than the expected fare."
        )


    # Moderately unusual and expensive
    elif anomaly_score >= 2 and difference_percent >= 10:

        recommendation = "MONITOR"

        reason = (
            "Fare is above the expected range. "
            "Monitor for a better price."
        )


    # Fare is close to or below expected
    elif difference_percent <= 0:

        recommendation = "BOOK NOW"

        reason = (
            "Current fare is at or below the "
            "expected fare."
        )


    # Normal fare
    else:

        recommendation = "MONITOR"

        reason = (
            "Fare is within a normal range."
        )


    return recommendation, reason


# ==========================================
# APPLY TO DATAFRAME
# ==========================================

def add_recommendations(df):

    recommendations = []

    reasons = []

    for _, row in df.iterrows():

        recommendation, reason = generate_recommendation(row)

        recommendations.append(recommendation)

        reasons.append(reason)


    df["recommendation"] = recommendations

    df["recommendation_reason"] = reasons

    return df


# ==========================================
# TEST
# ==========================================

if __name__ == "__main__":

    print("\n========================================")
    print("AIRWISE RECOMMENDATION ENGINE")
    print("========================================")


    data = {

        "total_fare": [
            4000,
            4500,
            6000,
            8000
        ],

        "expected_fare": [
            4500,
            4500,
            4500,
            4500
        ],

        "anomaly_score": [
            0.5,
            0.1,
            2.2,
            3.8
        ]
    }


    df = pd.DataFrame(data)


    result = add_recommendations(df)


    print("\nRecommendations:")

    print(
        result[
            [
                "total_fare",
                "expected_fare",
                "anomaly_score",
                "recommendation",
                "recommendation_reason"
            ]
        ].to_string(index=False)
    )


    print("\nRecommendation engine successful!")