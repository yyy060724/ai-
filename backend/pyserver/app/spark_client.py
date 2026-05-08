from typing import Any, AsyncIterator

import httpx

from app import config


async def iter_spark_chat_stream(
    *,
    messages: list[dict[str, Any]],
    model: str | None,
    temperature: float,
    max_tokens: int,
) -> AsyncIterator[bytes]:
    if not config.SPARK_API_PASSWORD:
        raise ValueError("Missing SPARK_API_PASSWORD in server environment.")

    body = {
        "model": model or config.SPARK_MODEL,
        "messages": messages,
        "stream": True,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    url = f"{config.SPARK_BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.SPARK_API_PASSWORD}",
    }

    timeout = httpx.Timeout(60.0, connect=30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, json=body, headers=headers) as response:
            if response.status_code >= 400:
                err_text = (await response.aread()).decode("utf-8", errors="replace")
                raise RuntimeError(f"Spark API {response.status_code}: {err_text}")
            async for chunk in response.aiter_bytes():
                if chunk:
                    yield chunk
