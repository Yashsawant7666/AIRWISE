import pandas as pd
import hashlib


# ==========================================
# AIRWISE FARE FINGERPRINT
# ==========================================

def create_fingerprint(row):

    route = (
        str(row["origin"]).strip().upper()
        + "-"
        + str(row["destination"]).strip().upper()
    )

    departure_time = str(row["departure_time"])

    cabin_class = str(row["cabin_class"]).strip().lower()

    fare_class = str(row["fare_class"]).strip().lower()

    stops = str(row["stops"])

    advance_days = str(row["advance_days"])


    # --------------------------------------
    # Combine important fare characteristics
    # --------------------------------------

    fingerprint_string = "|".join([
        route,
        departure_time,
        cabin_class,
        fare_class,
        stops,
        advance_days
    ])


    # --------------------------------------
    # Generate SHA256 fingerprint
    # --------------------------------------

    fingerprint = hashlib.sha256(
        fingerprint_string.encode("utf-8")
    ).hexdigest()


    return fingerprint


# ==========================================
# TEST FUNCTION
# ==========================================

if __name__ == "__main__":

    example = {
        "origin": "BOM",
        "destination": "BLR",
        "departure_time": "09:00",
        "cabin_class": "Economy",
        "fare_class": "Y",
        "stops": 0,
        "advance_days": 15
    }

    fingerprint = create_fingerprint(
        pd.Series(example)
    )

    print("\n========================================")
    print("AIRWISE FARE FINGERPRINT")
    print("========================================")

    print("\nRoute:")
    print("BOM-BLR")

    print("\nFingerprint:")
    print(fingerprint)

    print("\nFingerprint length:")
    print(len(fingerprint))

    print("\nFingerprint generation successful!")