import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
# Prefer local pyserver/.env, then existing Node server .env
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT.parent / "server" / ".env")


def _get_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    return int(raw)


SERVER_PORT = _get_int("SERVER_PORT", 3000)

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = _get_int("DB_PORT", 3306)
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "ai_chat_assistant")

SPARK_BASE_URL = (os.environ.get("SPARK_BASE_URL") or "https://spark-api-open.xf-yun.com/x2").rstrip("/")
SPARK_MODEL = os.environ.get("SPARK_MODEL") or "spark-x"
SPARK_API_PASSWORD = (os.environ.get("SPARK_API_PASSWORD") or "").strip()
