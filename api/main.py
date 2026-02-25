"""Ask Brooks API — FastAPI backend powered by NotebookLM."""

import os
import json
import base64
import asyncio
import tempfile
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ---------- NotebookLM client (lazy-init) ----------

_nlm_client = None
_nlm_lock = asyncio.Lock()

NOTEBOOK_ID = os.getenv(
    "NOTEBOOKLM_NOTEBOOK_ID",
    "33b8d0b2-ee3f-43f3-ba62-e8095ba5f03b",
)


def _ensure_storage_state():
    """Write storage_state.json from NOTEBOOKLM_STORAGE_B64 env var if present."""
    b64 = os.getenv("NOTEBOOKLM_STORAGE_B64")
    if not b64:
        return
    target = os.path.expanduser("~/.notebooklm/storage_state.json")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w") as f:
        f.write(base64.b64decode(b64).decode())


async def get_nlm_client():
    """Get or create the NotebookLM client singleton."""
    global _nlm_client
    if _nlm_client is not None:
        return _nlm_client

    async with _nlm_lock:
        if _nlm_client is not None:
            return _nlm_client

        try:
            from notebooklm import NotebookLMClient

            _ensure_storage_state()
            client = await NotebookLMClient.from_storage()
            await client.__aenter__()
            _nlm_client = client
            return _nlm_client
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to initialize NotebookLM: {e}",
            )


# ---------- App ----------


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    global _nlm_client
    if _nlm_client is not None:
        await _nlm_client.__aexit__(None, None, None)
        _nlm_client = None


app = FastAPI(
    title="Ask Brooks API",
    description="Price action Q&A powered by Al Brooks' books via NotebookLM",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Models ----------


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    sources: list[str]


# ---------- Routes ----------


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        client = await get_nlm_client()
        result = await client.chat.ask(NOTEBOOK_ID, question)

        return AskResponse(
            answer=result.answer,
            sources=[
                "Trading Price Action Trends",
                "Trading Price Action Reversals",
                "Trading Price Action Trading Ranges",
            ],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NotebookLM error: {e}")


# ---------- Entry point ----------

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
