from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.messages import PostMessageRequest, PostMessageResponse
from app.core.errors import AppError, ValidationError
from app.core.config import settings
from app.repositories.memory_repo import InMemoryRepo
from app.services.history import build_history
from app.llm.chain import LLMClient, ChatChain

router = APIRouter()

# Wiring DI tạm thời (sau này thay bằng Mongo repo)
_repo = InMemoryRepo()
_llm = LLMClient()
_chain = ChatChain(_llm)

@router.post("/threads/{thread_id}/messages", response_model=PostMessageResponse, status_code=201)
async def post_message(thread_id: str, body: PostMessageRequest, request: Request):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="content is required")

    try:
        user_id = await _repo.create_message(thread_id, "user", body.content, metadata=body.metadata)

        raw = await _repo.list_messages(thread_id, limit=200)
        history = build_history(raw, n_latest=settings.history_n_latest, max_tokens=settings.history_max_tokens)

        result = await _chain.run(user_input=body.content, history=history)
        assistant_id = await _repo.create_message(
            thread_id, "assistant", result["content"],
            model=result.get("model"), usage=result.get("usage"), latency_ms=result.get("latency_ms", 0)
        )

        return PostMessageResponse(
            thread_id=thread_id,
            user_message_id=user_id,
            assistant_message_id=assistant_id,
            assistant={
                "content": result["content"],
                "model": result.get("model"),
                "usage": result.get("usage", {}),
            },
        )
    except AppError as e:
        raise HTTPException(status_code=e.http_status, detail={"code": e.code, "message": e.message})