import json
from typing import Any

from app import db

CHAT_STATE_KEY = "chat_state"


async def load_chat_state() -> dict[str, Any] | None:
    async with db.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT state_json FROM app_state WHERE state_key = %s LIMIT 1",
                (CHAT_STATE_KEY,),
            )
            row = await cur.fetchone()
            if not row:
                return None
            raw = row[0]
            if isinstance(raw, (bytes, str)):
                return json.loads(raw)
            return raw


async def save_chat_state(state: dict[str, Any]) -> None:
    payload = json.dumps(state, ensure_ascii=False)
    async with db.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO app_state (state_key, state_json)
                VALUES (%s, CAST(%s AS JSON))
                ON DUPLICATE KEY UPDATE state_json = CAST(%s AS JSON);
                """,
                (CHAT_STATE_KEY, payload, payload),
            )
