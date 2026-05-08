from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import aiomysql

from app import config

_pool: aiomysql.Pool | None = None


async def get_pool() -> aiomysql.Pool:
    global _pool
    if _pool is None:
        raise RuntimeError("Database pool is not initialized.")
    return _pool


async def init_db() -> None:
    global _pool
    _pool = await aiomysql.create_pool(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        db=config.DB_NAME,
        charset="utf8mb4",
        autocommit=True,
        minsize=1,
        maxsize=10,
    )
    async with _pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_state (
                  state_key VARCHAR(64) PRIMARY KEY,
                  state_json JSON NOT NULL,
                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );
                """
            )


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None


@asynccontextmanager
async def connection() -> AsyncIterator[aiomysql.Connection]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
