import sys
from pathlib import Path

from sqlalchemy import create_engine, text


# ============================================================
# PATH
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent

PROJECT_ROOT = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_DIR)
    )


# ============================================================
# CONFIG
# ============================================================

from config import DATABASE_URL


# ============================================================
# TEST
# ============================================================

print("Connecting to PostgreSQL...")

try:

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )

    with engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )

    print("Database connection successful!")

except Exception as error:

    print("DATABASE CONNECTION FAILED!")

    print(error)