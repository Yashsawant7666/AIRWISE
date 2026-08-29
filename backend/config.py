import os
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# PROJECT ROOT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# LOAD .ENV
# ============================================================

ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_FILE
)


# ============================================================
# DATABASE URL
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:
    raise RuntimeError(
        f"DATABASE_URL is not set.\n"
        f"Expected .env file at:\n{ENV_FILE}"
    )