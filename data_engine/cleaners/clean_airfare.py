import pandas as pd
import os


# ==========================================
# AIRWISE - AIRFARE DATA CLEANING
# ==========================================

# Get project root directory
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

# Input and output files
INPUT_FILE = os.path.join(
    BASE_DIR,
    "datasets",
    "airfare_raw.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "datasets",
    "airfare_cleaned.csv"
)


# ==========================================
# 1. LOAD DATA
# ==========================================

print("\n========================================")
print("AIRWISE DATA CLEANING PIPELINE")
print("========================================")

print("\nLoading dataset...")

df = pd.read_csv(INPUT_FILE)

print("Dataset loaded successfully!")
print("Rows:", len(df))
print("Columns:", len(df.columns))


# ==========================================
# 2. DISPLAY BASIC INFORMATION
# ==========================================

print("\n----------------------------------------")
print("DATASET INFORMATION")
print("----------------------------------------")

print(df.info())


# ==========================================
# 3. REMOVE DUPLICATES
# ==========================================

print("\n----------------------------------------")
print("REMOVING DUPLICATES")
print("----------------------------------------")

duplicate_count = df.duplicated().sum()

print("Duplicate rows found:", duplicate_count)

df = df.drop_duplicates()

print("Rows after duplicate removal:", len(df))


# ==========================================
# 4. HANDLE MISSING VALUES
# ==========================================

print("\n----------------------------------------")
print("CHECKING MISSING VALUES")
print("----------------------------------------")

missing_values = df.isnull().sum()

print(missing_values)


# Fill missing text values
text_columns = [
    "source",
    "airline",
    "flight_number",
    "origin",
    "destination",
    "departure_time",
    "cabin_class",
    "fare_class",
    "baggage",
    "refundable",
    "cancellation_policy",
    "currency"
]

for column in text_columns:
    if column in df.columns:
        df[column] = df[column].fillna("Unknown")


# ==========================================
# 5. NORMALIZE AIRLINE NAMES
# ==========================================

print("\n----------------------------------------")
print("NORMALIZING AIRLINE NAMES")
print("----------------------------------------")

if "airline" in df.columns:

    df["airline"] = (
        df["airline"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    airline_mapping = {
        "indigo": "IndiGo",
        "indi go": "IndiGo",
        "indigo airlines": "IndiGo",

        "air india": "Air India",
        "airindia": "Air India"
    }

    df["airline"] = df["airline"].replace(airline_mapping)


# ==========================================
# 6. NORMALIZE AIRPORT CODES
# ==========================================

print("\n----------------------------------------")
print("NORMALIZING AIRPORT CODES")
print("----------------------------------------")

for column in ["origin", "destination"]:

    if column in df.columns:

        df[column] = (
            df[column]
            .astype(str)
            .str.strip()
            .str.upper()
        )


# ==========================================
# 7. CONVERT DATES
# ==========================================

print("\n----------------------------------------")
print("CONVERTING DATES")
print("----------------------------------------")

date_columns = [
    "booking_timestamp",
    "departure_date",
    "collected_at"
]

for column in date_columns:

    if column in df.columns:

        df[column] = pd.to_datetime(
            df[column],
            errors="coerce"
        )


# ==========================================
# 8. CONVERT NUMERIC COLUMNS
# ==========================================

print("\n----------------------------------------")
print("CONVERTING NUMERIC VALUES")
print("----------------------------------------")

numeric_columns = [
    "advance_days",
    "stops",
    "base_fare",
    "taxes",
    "fees",
    "total_fare"
]

for column in numeric_columns:

    if column in df.columns:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )


# ==========================================
# 9. REMOVE INVALID FARES
# ==========================================

print("\n----------------------------------------")
print("VALIDATING FARES")
print("----------------------------------------")

before_validation = len(df)

df = df[
    (df["base_fare"] >= 0) &
    (df["taxes"] >= 0) &
    (df["fees"] >= 0) &
    (df["total_fare"] >= 0)
]

removed_rows = before_validation - len(df)

print("Invalid fare rows removed:", removed_rows)


# ==========================================
# 10. VALIDATE AIRPORT CODES
# ==========================================

print("\n----------------------------------------")
print("VALIDATING AIRPORT CODES")
print("----------------------------------------")

valid_airports = [
    "BOM",
    "DEL",
    "BLR",
    "HYD",
    "PNQ",
    "MAA",
    "CCU",
    "GOI",
    "AMD",
    "COK"
]

before_airport_validation = len(df)

df = df[
    df["origin"].isin(valid_airports)
    &
    df["destination"].isin(valid_airports)
]

removed_airport_rows = (
    before_airport_validation - len(df)
)

print(
    "Invalid airport rows removed:",
    removed_airport_rows
)


# ==========================================
# 11. CHECK TOTAL FARE
# ==========================================

print("\n----------------------------------------")
print("CHECKING TOTAL FARE")
print("----------------------------------------")

df["calculated_total"] = (
    df["base_fare"]
    + df["taxes"]
    + df["fees"]
)

df["fare_difference"] = (
    df["total_fare"]
    - df["calculated_total"]
)

print(
    "Maximum fare calculation difference:",
    df["fare_difference"].abs().max()
)


# ==========================================
# 12. REMOVE TEMPORARY COLUMNS
# ==========================================

df = df.drop(
    columns=[
        "calculated_total",
        "fare_difference"
    ]
)


# ==========================================
# 13. SORT DATA
# ==========================================

df = df.sort_values(
    by=[
        "origin",
        "destination",
        "departure_date"
    ]
)


# ==========================================
# 14. SAVE CLEANED DATA
# ==========================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ==========================================
# 15. FINAL REPORT
# ==========================================

print("\n========================================")
print("CLEANING COMPLETED")
print("========================================")

print("Final rows:", len(df))
print("Final columns:", len(df.columns))

print("\nCleaned dataset saved at:")

print(OUTPUT_FILE)

print("\nFirst 5 rows:")

print(df.head())

print("\nAIRWISE DATA PIPELINE SUCCESS!")