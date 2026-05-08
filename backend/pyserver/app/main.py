from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from app import config
from app import db
from app import spark_client
from app import state_repo


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await db.init_db()
    yield
    await db.close_pool()


app = FastAPI(title="ai-chat-assistant-server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatStreamBody(BaseModel):
    model: str | None = None
    messages: list[dict[str, Any]]
    temperature: float = 0.7
    max_tokens: int = Field(default=2000, ge=1)


class StatePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    conversations: list[Any]
    currentConversationId: str | None = None


@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "service": "ai-chat-assistant-server",
        "time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/api/state")
async def get_state():
    try:
        state = await state_repo.load_chat_state()
        return {"state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to load persisted chat state.") from e


@app.put("/api/state")
async def put_state(body: StatePayload):
    try:
        await state_repo.save_chat_state(body.model_dump(mode="json"))
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save chat state.") from e


@app.post("/api/chat/stream")
async def chat_stream(body: ChatStreamBody):
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages must be a non-empty array.")

    async def byte_stream():
        try:
            async for chunk in spark_client.iter_spark_chat_stream(
                messages=body.messages,
                model=body.model,
                temperature=body.temperature,
                max_tokens=body.max_tokens,
            ):
                yield chunk
        except ValueError as e:
            raise HTTPException(status_code=500, detail=str(e)) from e
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e)) from e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e) or "Unexpected stream error.") from e

    return StreamingResponse(
        byte_stream(),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )


def run():
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=config.SERVER_PORT,
        reload=True,
    )


if __name__ == "__main__":
    run()
