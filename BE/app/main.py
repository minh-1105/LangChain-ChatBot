from fastapi import FastAPI
from app.core.logging import RequestLoggingMiddleware
from app.api.threads import router as threads_router

app = FastAPI(title="Chatbot Backend")
app.add_middleware(RequestLoggingMiddleware)
app.include_router(threads_router)

# health
@app.get("/health")
def health():
    return {"ok": True}