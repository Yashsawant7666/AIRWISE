import os
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# PROJECT ROOT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# LOAD LOCAL .ENV
# ============================================================

load_dotenv(
    BASE_DIR / ".env"
)


# ============================================================
# DATABASE
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


# ============================================================
# VALIDATION
# ============================================================

if not DATABASE_URL:

    raise RuntimeError(
        "DATABASE_URL environment variable is not configured."
    )